"""Bounded real local operations with receipts and no-overwrite semantics."""
import base64
import hashlib
import errno
import mimetypes
import os
import stat
import threading
import time
import uuid

from .security import (APIError, directory, name, parent, parts, regular_stat,
                       rename_no_replace, root_fd)

MAX_HASH_BYTES = 256 * 1024 * 1024
MAX_PREVIEW = 2 * 1024 * 1024
MAX_COPY_BYTES = 256 * 1024 * 1024
MAX_COPY_ENTRIES = 10000


def error(exc):
    if isinstance(exc, APIError):
        return {'code': exc.code, 'message': exc.message}
    code = {errno.ENOENT: 'NOT_FOUND', errno.EEXIST: 'CONFLICT', errno.EACCES: 'ACCESS_DENIED',
            errno.EPERM: 'ACCESS_DENIED', errno.ELOOP: 'SYMLINK_DENIED', errno.ENOTDIR: 'NOT_DIRECTORY',
            errno.EXDEV: 'CROSS_DEVICE', errno.ENOSPC: 'NO_SPACE'}.get(getattr(exc, 'errno', None), 'IO_ERROR')
    return {'code': code, 'message': {'CONFLICT': 'Destination already exists. Choose another name.',
            'CROSS_DEVICE': 'Cross-device move is unsupported. Copy, verify, then trash the source.'}.get(code, str(exc))}


class Provider:
    def __init__(self, state, graph=None):
        self.state, self.graph = state, graph
        self.lock = threading.RLock()

    def list(self, request):
        grant = self.state.get_grant(request.get('grant'))
        path = request.get('path', '')
        components = parts(path)
        self.state.check_path(grant, path)
        offset, limit = request.get('offset', 0), request.get('limit', 500)
        if type(offset) is not int or type(limit) is not int or offset < 0 or not 1 <= limit <= 1000:
            raise APIError('INVALID_PAGE', 'offset must be nonnegative; limit must be 1–1000.')
        entries = []
        scanned = 0
        private_exclusions = self.state._exclusions()
        private_ids = {(item['device'], item['inode']) for item in private_exclusions}
        with root_fd(grant) as root, directory(root, components) as fd:
            self.state.check_fd(fd)
            # Bound work even when an attacker supplies a huge directory.
            with os.scandir(fd) as scan:
                for entry in scan:
                    scanned += 1
                    if scanned > 20000:
                        raise APIError('LIMIT', 'Directory exceeds 20,000 entries. Choose a narrower folder.', 413)
                    if entry.name.startswith('.atlas-'):
                        continue
                    try:
                        self.state.check_path(grant, '/'.join(components + [entry.name]), exclusions=private_exclusions)
                    except APIError as exc:
                        if exc.code == 'PRIVATE_STATE':
                            continue
                        raise
                    s = entry.stat(follow_symlinks=False)
                    if s.st_nlink > 1 and stat.S_ISREG(s.st_mode):
                        continue
                    if (s.st_dev, s.st_ino) in private_ids:
                        continue
                    if not (stat.S_ISDIR(s.st_mode) or stat.S_ISREG(s.st_mode)):
                        continue
                    entries.append({'name': entry.name, 'path': '/'.join(components + [entry.name]),
                                    'kind': 'directory' if stat.S_ISDIR(s.st_mode) else 'file',
                                    'size': s.st_size, 'modified': s.st_mtime})
                    if len(entries) > 20000:
                        raise APIError('LIMIT', 'Directory exceeds 20,000 entries. Choose a narrower folder.', 413)
        entries.sort(key=lambda e: (e['kind'] != 'directory', e['name'].casefold(), e['name']))
        return {'entries': entries[offset:offset + limit], 'total': len(entries), 'offset': offset,
                'limit': limit, 'path': path, 'grant': grant['id']}

    def read(self, request):
        grant = self.state.get_grant(request.get('grant'))
        path = request.get('path')
        self.state.check_path(grant, path)
        with root_fd(grant) as root, parent(root, path) as (fd, leaf):
            self.state.check_fd(fd)
            stream = os.open(leaf, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=fd)
            try:
                self.state.check_fd(stream)
                s = os.fstat(stream)
                if not stat.S_ISREG(s.st_mode):
                    raise APIError('UNSUPPORTED_ENTRY', 'Only regular files can be previewed.', 403)
                if s.st_size > MAX_PREVIEW:
                    raise APIError('PREVIEW_TOO_LARGE', 'Preview is limited to 2 MiB.', 413)
                with os.fdopen(os.dup(stream), 'rb') as f:
                    content = f.read(MAX_PREVIEW + 1)
                if len(content) > MAX_PREVIEW:
                    raise APIError('PREVIEW_TOO_LARGE', 'File grew beyond the preview limit.', 413)
            finally:
                os.close(stream)
        self.state.get_grant(grant['id'])
        return {'data': base64.b64encode(content).decode('ascii'), 'size': len(content),
                'mime': mimetypes.guess_type(leaf)[0] or 'application/octet-stream', 'name': leaf}

    def hash(self, request):
        """On-demand content proof within an existing read grant; never indexes.

        Descriptor traversal and O_NOFOLLOW keep symlinks outside this authority.
        A changing file yields no accepted digest. Read work is bounded even when
        another process grows the file after the initial metadata check.
        """
        grant = self.state.get_grant(request.get('grant'))
        self.state.check_path(grant, request.get('path'))
        with root_fd(grant) as root, parent(root, request.get('path')) as (fd, leaf):
            self.state.check_fd(fd)
            stream = os.open(leaf, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=fd)
            try:
                self.state.check_fd(stream)
                before = os.fstat(stream)
                if not stat.S_ISREG(before.st_mode):
                    raise APIError('UNSUPPORTED_ENTRY', 'Only regular files can be hashed.', 403)
                if before.st_size > MAX_HASH_BYTES:
                    raise APIError('HASH_TOO_LARGE', 'Content hashing is limited to 256 MiB.', 413)
                digest = hashlib.sha256()
                total = 0
                while True:
                    chunk = os.read(stream, min(1024 * 1024, MAX_HASH_BYTES - total + 1))
                    if not chunk:
                        break
                    total += len(chunk)
                    if total > MAX_HASH_BYTES:
                        raise APIError('HASH_TOO_LARGE', 'File grew beyond the content hashing limit.', 413)
                    digest.update(chunk)
                after = os.fstat(stream)
                signature = lambda value: (value.st_dev, value.st_ino, value.st_size,
                                           value.st_mtime_ns, value.st_ctime_ns)
                if signature(before) != signature(after) or total != after.st_size:
                    raise APIError('CHANGED_DURING_READ', 'File changed while hashing; retry when it is stable.', 409)
                self.state.get_grant(grant['id'])
                return {'sha256': digest.hexdigest(), 'size': total, 'modified': after.st_mtime}
            finally:
                os.close(stream)

    def operate(self, request):
        action = request.get('action')
        if action not in ('mkdir', 'rename', 'copy', 'move', 'trash', 'restore'):
            raise APIError('UNSUPPORTED_ACTION', 'Unsupported file operation.')
        sources = request.get('sources', [])
        if not isinstance(sources, list) or len(sources) > 100 or any(not isinstance(s, dict) for s in sources):
            raise APIError('INVALID_SOURCES', 'Select at most 100 entries.')
        if action != 'mkdir' and not sources:
            raise APIError('INVALID_SOURCES', 'Select at least one entry.')
        if action in ('rename', 'restore') and len(sources) != 1:
            raise APIError('INVALID_SOURCES', 'This action requires exactly one entry.')
        if action in ('mkdir', 'rename') or request.get('name') is not None:
            name(request.get('name'))
        if request.get('name') is not None and action not in ('mkdir', 'rename', 'copy'):
            raise APIError('INVALID_NAME', 'Name override is supported only for mkdir, rename and copy.')
        if action == 'copy' and request.get('name') is not None and len(sources) != 1:
            raise APIError('INVALID_SOURCES', 'Copy with a new name requires exactly one entry.')
        destination = request.get('destination')
        if action in ('copy', 'move', 'mkdir', 'restore'):
            if not isinstance(destination, dict):
                raise APIError('INVALID_DESTINATION', 'Choose an authorized destination folder.')
            parts(destination.get('path', ''))
            target_grant = self.state.get_grant(destination.get('grant'), write=True)
            self.state.check_path(target_grant, destination.get('path', ''))
        for source in sources:
            source_grant = self.state.get_grant(source.get('grant'), write=action != 'copy')
            if action != 'restore':
                parts(source.get('path'), False)
                self.state.check_path(source_grant, source['path'], recursive=True)
            else:
                # Restore source path is an opaque trash ID, not a filesystem path.
                if not isinstance(source.get('path'), str) or not __import__('re').fullmatch('[a-f0-9]{32}', source['path']):
                    raise APIError('INVALID_TRASH_ID', 'Expected the trash ID from an operation receipt.')
        with self.lock:
            old = self.state.begin(request.get('id'), request)
            if old is not None:
                return {'receipt': old, 'replayed': True}
            results = []
            items = sources if action != 'mkdir' else [None]
            for source in items:
                try:
                    result = self._one(action, source, destination, request.get('name'))
                    results.append({'source': source, 'ok': True, **result})
                except (APIError, OSError) as exc:
                    results.append({'source': source, 'ok': False, 'error': error(exc)})
            status = 'completed' if all(r['ok'] for r in results) else ('partial' if any(r['ok'] for r in results) else 'failed')
            receipt = {'id': request['id'], 'action': action, 'status': status, 'results': results, 'finished': time.time()}
            self.state.finish(request['id'], receipt)
            return {'receipt': receipt, 'replayed': False}

    def _one(self, action, source, destination, new_name):
        if action == 'mkdir':
            grant = self.state.get_grant(destination['grant'], write=True)
            self.state.check_path(grant, '/'.join(filter(None, [destination.get('path', ''), new_name])))
            with root_fd(grant) as root, directory(root, parts(destination.get('path', ''))) as dst:
                self.state.check_fd(dst)
                os.mkdir(new_name, 0o755, dir_fd=dst)
                os.fsync(dst)
            return {'destination': {'grant': grant['id'], 'path': '/'.join(filter(None, [destination.get('path', ''), new_name]))}}
        grant = self.state.get_grant(source['grant'], write=action != 'copy')
        with root_fd(grant) as root:
            if action == 'restore':
                return self._restore(root, grant, source, destination)
            self.state.check_path(grant, source['path'], recursive=True)
            with parent(root, source['path']) as (src, leaf):
                self.state.check_entry(src, leaf, recursive=True)
                s = regular_stat(src, leaf)
                if action == 'trash':
                    trash = self._trash_fd(root)
                    ident = uuid.uuid4().hex
                    try:
                        rename_no_replace(src, leaf, trash, ident)
                        os.fsync(src)
                        os.fsync(trash)
                    finally:
                        os.close(trash)
                    return {'trash_id': ident, 'original': source, 'recoverable': True}
                if action == 'rename':
                    self.state.check_path(grant, '/'.join(parts(source['path'])[:-1] + [new_name]))
                    rename_no_replace(src, leaf, src, new_name)
                    os.fsync(src)
                    dest_path = '/'.join(parts(source['path'])[:-1] + [new_name])
                    self._reconcile(grant['id'], source['path'], grant['id'], dest_path)
                    return {'destination': {'grant': grant['id'], 'path': dest_path}}
                target = self.state.get_grant(destination['grant'], write=True)
                target_leaf = new_name if action == 'copy' and new_name else leaf
                dest_path = '/'.join(filter(None, [destination.get('path', ''), target_leaf]))
                self.state.check_path(target, dest_path)
                # Never copy a directory into itself, including overlapping grants.
                target_abs = os.path.join(target['root'], destination.get('path', ''), target_leaf)
                source_abs = os.path.join(grant['root'], source['path'])
                if stat.S_ISDIR(s.st_mode) and os.path.commonpath([target_abs, source_abs]) == source_abs:
                    raise APIError('RECURSIVE_DESTINATION', 'A folder cannot be transferred into itself.')
                with root_fd(target) as dstroot, directory(dstroot, parts(destination.get('path', ''))) as dst:
                    self.state.check_fd(dst)
                    if action == 'move':
                        rename_no_replace(src, leaf, dst, leaf)
                        os.fsync(src)
                        os.fsync(dst)
                        self._reconcile(grant['id'], source['path'], target['id'], dest_path)
                    else:
                        self._copy_publish(src, leaf, dst, target_leaf, grant['id'], target['id'])
                return {'destination': {'grant': target['id'], 'path': dest_path}}

    def _reconcile(self, old_grant, old, new_grant, new):
        if self.graph:
            self.graph.update_locator('local', old_grant + '/' + old, new_grant + '/' + new)

    @staticmethod
    def _trash_fd(root):
        try:
            os.mkdir('.atlas-trash', 0o700, dir_fd=root)
        except FileExistsError:
            pass
        return os.open('.atlas-trash', os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=root)

    def _restore(self, root, grant, source, destination):
        # Require a successful recorded trash operation for the opaque ID.
        found = None
        with self.state.connect() as db:
            for row in db.execute('SELECT result FROM receipts WHERE result IS NOT NULL'):
                for result in __import__('json').loads(row['result']).get('results', []):
                    if result.get('ok') and result.get('trash_id') == source['path'] and result['original']['grant'] == grant['id']:
                        found = result
                        break
        if found is None:
            raise APIError('NOT_FOUND', 'No authorized trash receipt exists.', 404)
        target = self.state.get_grant(destination['grant'], write=True)
        leaf = parts(found['original']['path'])[-1]
        restored_path = '/'.join(filter(None, [destination.get('path', ''), leaf]))
        self.state.check_path(target, restored_path)
        trash = self._trash_fd(root)
        try:
            self.state.check_entry(trash, source['path'], recursive=True)
            regular_stat(trash, source['path'])
            with root_fd(target) as dstroot, directory(dstroot, parts(destination.get('path', ''))) as dst:
                self.state.check_fd(dst)
                rename_no_replace(trash, source['path'], dst, leaf)
                os.fsync(dst)
                os.fsync(trash)
        finally:
            os.close(trash)
        restored_path = '/'.join(filter(None, [destination.get('path', ''), leaf]))
        self._reconcile(grant['id'], found['original']['path'], target['id'], restored_path)
        return {'destination': {'grant': target['id'], 'path': restored_path}}

    def _copy_publish(self, src, leaf, dst, target, source_grant=None, target_grant=None):
        # Stage within destination; never publish a partially copied file/tree.
        staging = '.atlas-copy-' + uuid.uuid4().hex
        budget = {'bytes': 0, 'entries': 0, 'source_grant': source_grant, 'target_grant': target_grant}
        try:
            self._copy(src, leaf, dst, staging, budget, 0)
            self._copy_authority(budget)
            self.state.check_fd(dst)
            rename_no_replace(dst, staging, dst, target)
            os.fsync(dst)
        finally:
            self._remove_staging(dst, staging)

    def _copy_authority(self, budget):
        if budget.get('source_grant'):
            self.state.get_grant(budget['source_grant'])
        if budget.get('target_grant'):
            self.state.get_grant(budget['target_grant'], write=True)

    def _copy(self, src, leaf, dst, target, budget, depth):
        self._copy_authority(budget)
        if depth > 64:
            raise APIError('LIMIT', 'Copy exceeds 64 directory levels.')
        budget['entries'] += 1
        if budget['entries'] > MAX_COPY_ENTRIES:
            raise APIError('LIMIT', 'Copy exceeds 10,000 entries.')
        self.state.check_entry(src, leaf, recursive=True)
        self.state.check_fd(dst)
        fd = os.open(leaf, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=src)
        try:
            self.state.check_fd(fd, recursive=True)
            s = os.fstat(fd)
            if stat.S_ISDIR(s.st_mode):
                os.mkdir(target, 0o755, dir_fd=dst)
                out = os.open(target, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=dst)
                try:
                    for item in os.listdir(fd):
                        if item.startswith('.atlas-'):
                            continue
                        self._copy(fd, item, out, item, budget, depth + 1)
                    os.fsync(out)
                finally:
                    os.close(out)
            elif stat.S_ISREG(s.st_mode):
                out = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o644, dir_fd=dst)
                try:
                    with os.fdopen(os.dup(fd), 'rb') as reader, os.fdopen(os.dup(out), 'wb') as writer:
                        while chunk := reader.read(1024 * 1024):
                            self._copy_authority(budget)
                            budget['bytes'] += len(chunk)
                            if budget['bytes'] > MAX_COPY_BYTES:
                                raise APIError('LIMIT', 'Copy exceeds 256 MiB; use the system file manager for larger transfers.')
                            writer.write(chunk)
                        writer.flush()
                    os.fsync(out)
                finally:
                    os.close(out)
            else:
                raise APIError('UNSUPPORTED_ENTRY', 'Copy rejects symlinks and special files.', 403)
        finally:
            os.close(fd)

    def _remove_staging(self, parent_fd, entry):
        # Only internal generated names/subtrees, always descriptor-relative.
        try:
            s = os.stat(entry, dir_fd=parent_fd, follow_symlinks=False)
        except FileNotFoundError:
            return
        if stat.S_ISDIR(s.st_mode):
            fd = os.open(entry, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=parent_fd)
            try:
                for child in os.listdir(fd):
                    self._remove_staging(fd, child)
            finally:
                os.close(fd)
            os.rmdir(entry, dir_fd=parent_fd)
        else:
            os.unlink(entry, dir_fd=parent_fd)
