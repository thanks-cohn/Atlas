"""Windows provider: handle-relative mutations, bounded copy, durable receipts.

Linux's receipt/request envelope is shared; no Linux filesystem primitive is used.
Directory copy is deliberately unsupported. No public permanent-delete exists.
"""
import base64
import ctypes
import hashlib
import json
import mimetypes
import re
import uuid
from contextlib import contextmanager
from ctypes import wintypes as w

from .filesystem import Provider as ReceiptProvider
from .security import APIError
from .windows_provider import WindowsRoot, WindowsBoundaryError, components, _Basic, _Standard

MAX_BYTES = 256 * 1024 * 1024


def path_parts(path, empty=True):
    try:
        return components(path, empty)
    except WindowsBoundaryError as exc:
        raise APIError('INVALID_PATH', str(exc)) from exc


def join(parent, leaf):
    return '/'.join(filter(None, (parent, leaf)))


class Provider(ReceiptProvider):
    @contextmanager
    def _root(self, grant):
        try:
            with WindowsRoot(grant['root'], expected_identity=grant['identity'],
                             excluded_paths=[item['path'] if isinstance(item, dict) else item
                                             for item in self.state._exclusions()]) as root:
                yield root
        except WindowsBoundaryError as exc:
            raise APIError('BOUNDARY_DENIED', str(exc), 403) from exc

    def _authority(self, grant, path, write=False, recursive=False):
        current = self.state.get_grant(grant['id'], write=write)
        if tuple(current['identity']) != tuple(grant['identity']):
            raise APIError('GRANT_CHANGED', 'Root authority changed.', 403)
        self.state.check_path(current, path, recursive=recursive)

    def list(self, request):
        grant = self.state.get_grant(request.get('grant'))
        path = request.get('path', '')
        path_parts(path)
        self.state.check_path(grant, path)
        offset, limit = request.get('offset', 0), request.get('limit', 500)
        if type(offset) is not int or offset < 0 or type(limit) is not int or not 1 <= limit <= 1000:
            raise APIError('INVALID_PAGE', 'offset must be nonnegative; limit must be 1–1000.')
        with self._root(grant) as root:
            entries = []
            for entry in root.list(path):
                try:
                    self.state.check_path(grant, entry['path'])
                    entries.append(entry)
                except APIError as exc:
                    if exc.code != 'PRIVATE_STATE':
                        raise
        self._authority(grant, path)
        return {'entries': entries[offset:offset + limit], 'total': len(entries),
                'offset': offset, 'limit': limit, 'path': path, 'grant': grant['id']}

    def read(self, request):
        grant = self.state.get_grant(request.get('grant'))
        path = request.get('path')
        path_parts(path, False)
        self.state.check_path(grant, path)
        with self._root(grant) as root:
            data = root.read(path)
        self._authority(grant, path)
        leaf = path_parts(path, False)[-1]
        return {'data': base64.b64encode(data).decode('ascii'), 'size': len(data),
                'mime': mimetypes.guess_type(leaf)[0] or 'application/octet-stream', 'name': leaf}

    @staticmethod
    def _signature(root, handle):
        standard = root._info(handle, 1, _Standard)
        basic = root._info(handle, 0, _Basic)
        return (root._identity(handle), standard.EndOfFile, basic.LastWriteTime, basic.ChangeTime)

    def _stream(self, root, source, grant, path, consume):
        before = self._signature(root, source)
        if root._info(source, 1, _Standard).Directory:
            raise APIError('UNSUPPORTED_ENTRY', 'Directory copy is not supported; select files.', 403)
        if before[1] > MAX_BYTES:
            raise APIError('LIMIT', 'File transfer and hashing are limited to 256 MiB.', 413)
        total = 0
        while True:
            self._authority(grant, path)
            buffer = ctypes.create_string_buffer(min(1024 * 1024, MAX_BYTES - total + 1))
            amount = w.DWORD()
            if not root.kernel.ReadFile(source, buffer, len(buffer), ctypes.byref(amount), None):
                raise ctypes.WinError(ctypes.get_last_error())
            if not amount.value:
                break
            total += amount.value
            if total > MAX_BYTES:
                raise APIError('LIMIT', 'File grew beyond 256 MiB.', 413)
            consume(buffer.raw[:amount.value])
        if before != self._signature(root, source) or total != before[1]:
            raise APIError('CHANGED_DURING_READ', 'Source changed during transfer.', 409)
        return total

    def hash(self, request):
        grant = self.state.get_grant(request.get('grant'))
        path = request.get('path')
        path_parts(path, False)
        self.state.check_path(grant, path)
        digest = hashlib.sha256()
        with self._root(grant) as root, root._open(path, False) as source:
            size = self._stream(root, source, grant, path, digest.update)
            basic = root._info(source, 0, _Basic)
            self._authority(grant, path)
        return {'sha256': digest.hexdigest(), 'size': size,
                'modified': basic.LastWriteTime / 10000000 - 11644473600}

    def operate(self, request):
        # Validate Windows grammar before the portable receipt/request validation.
        action = request.get('action')
        destination = request.get('destination')
        if isinstance(destination, dict):
            path_parts(destination.get('path', ''))
        sources = request.get('sources', [])
        if isinstance(sources, list):
            for source in sources:
                if isinstance(source, dict) and action != 'restore':
                    path_parts(source.get('path'), False)
        if request.get('name') is not None:
            if len(path_parts(request['name'], False)) != 1:
                raise APIError('INVALID_NAME', 'Enter one file or folder name.')
        return super().operate(request)

    @contextmanager
    def _source(self, root, path, *, write):
        names = path_parts(path, False)
        with root._open('/'.join(names[:-1]), True) as parent:
            handle = root._relative(parent, names[-1], access=0x110081 if write else 0x100081,
                                    share=3 if write else 1)
            try:
                yield parent, handle, names[-1]
            finally:
                root.kernel.CloseHandle(handle)

    def _one(self, action, source, destination, new_name):
        try:
            return self._one_native(action, source, destination, new_name)
        except WindowsBoundaryError as exc:
            raise APIError('BOUNDARY_DENIED', str(exc), 403) from exc

    def _one_native(self, action, source, destination, new_name):
        if action == 'mkdir':
            grant = self.state.get_grant(destination['grant'], write=True)
            target_path = join(destination.get('path', ''), new_name)
            self._authority(grant, target_path, True)
            with self._root(grant) as root, root._open(destination.get('path', ''), True) as parent:
                self._authority(grant, target_path, True)
                handle = root._relative(parent, new_name, True, disposition=2)
                root.kernel.CloseHandle(handle)
            return {'destination': {'grant': grant['id'], 'path': target_path}}
        grant = self.state.get_grant(source['grant'], write=action != 'copy')
        if action == 'restore':
            return self._restore_native(grant, source, destination)
        self._authority(grant, source['path'], action != 'copy', True)
        with self._root(grant) as root, self._source(root, source['path'], write=action != 'copy') as (parent, handle, leaf):
            if action == 'trash':
                self._authority(grant, source['path'], True, True)
                with self._trash(root) as trash:
                    ident = uuid.uuid4().hex
                    identity = root._identity(handle)
                    directory_identity = root._identity(trash)
                    self._authority(grant, source['path'], True, True)
                    root.rename_handle(handle, trash, ident)
                    return {'trash_id': ident, 'original': source, 'recoverable': True,
                            'identity': identity, 'trash_identity': directory_identity}
            if action == 'rename':
                dest_path = join('/'.join(path_parts(source['path'])[:-1]), new_name)
                self._authority(grant, source['path'], True, True)
                self._authority(grant, dest_path, True)
                root.rename_handle(handle, parent, new_name)
                self._reconcile(grant['id'], source['path'], grant['id'], dest_path)
                return {'destination': {'grant': grant['id'], 'path': dest_path}}
            target = self.state.get_grant(destination['grant'], write=True)
            target_leaf = new_name if action == 'copy' and new_name else leaf
            dest_path = join(destination.get('path', ''), target_leaf)
            self._authority(target, dest_path, True)
            with self._root(target) as target_root, target_root._open(destination.get('path', ''), True) as dst:
                self._authority(grant, source['path'], action != 'copy', True)
                self._authority(target, dest_path, True)
                if action == 'move':
                    root.rename_handle(handle, dst, target_leaf)
                    self._reconcile(grant['id'], source['path'], target['id'], dest_path)
                else:
                    self._copy_file(root, handle, grant, source['path'], target_root, dst, target, dest_path, target_leaf)
            return {'destination': {'grant': target['id'], 'path': dest_path}}

    def _copy_file(self, root, source, grant, source_path, target_root, dst, target, dest_path, leaf):
        if root._info(source, 1, _Standard).Directory:
            raise APIError('UNSUPPORTED_ENTRY', 'Directory copy is not supported; select files.', 403)
        staging = '.atlas-copy-' + uuid.uuid4().hex
        # FILE_CREATE, DELETE|WRITE_DATA|READ_ATTRIBUTES|SYNCHRONIZE; no overwrite.
        handle = target_root._relative(dst, staging, False, access=0x110082, disposition=2, internal=True)
        published = False
        try:
            def consume(chunk):
                self._authority(target, dest_path, True)
                buffer = ctypes.create_string_buffer(chunk)
                offset = 0
                while offset < len(chunk):
                    amount = w.DWORD()
                    if not target_root.kernel.WriteFile(handle, ctypes.byref(buffer, offset), len(chunk) - offset,
                                                        ctypes.byref(amount), None):
                        raise ctypes.WinError(ctypes.get_last_error())
                    if amount.value == 0:
                        raise APIError('IO_ERROR', 'Native file write made no progress.')
                    offset += amount.value
            self._stream(root, source, grant, source_path, consume)
            if not target_root.kernel.FlushFileBuffers(handle):
                raise ctypes.WinError(ctypes.get_last_error())
            self._authority(grant, source_path)
            self._authority(target, dest_path, True)
            target_root.rename_handle(handle, dst, leaf)
            published = True
        finally:
            try:
                if not published:
                    target_root.discard_staging(handle)
            finally:
                target_root.kernel.CloseHandle(handle)

    @contextmanager
    def _trash(self, root):
        # The descriptor supplied here must be protected against other accounts.
        # Creation and existing-directory verification use the same held handle.
        from .windows_state import security_descriptor, verify_private_handle, windows_api
        descriptor = security_descriptor(self.state.sid, inherit=True)
        try:
            handle = root._relative(root.handle, '.atlas-trash', True, disposition=3,
                                    internal=True, security=descriptor, access=0x120081)
        finally:
            windows_api()[0].LocalFree(descriptor)
        try:
            verify_private_handle(handle, self.state.sid)
            yield handle
        finally:
            root.kernel.CloseHandle(handle)

    def _restore_native(self, grant, source, destination):
        found = None
        with self.state.connect() as db:
            for row in db.execute('SELECT result FROM receipts WHERE result IS NOT NULL'):
                for result in json.loads(row['result']).get('results', []):
                    if (result.get('ok') and result.get('trash_id') == source['path']
                            and result.get('original', {}).get('grant') == grant['id']):
                        found = result
                        break
        if found is None:
            raise APIError('NOT_FOUND', 'No authorized recovery receipt exists.', 404)
        target = self.state.get_grant(destination['grant'], write=True)
        leaf = path_parts(found['original']['path'], False)[-1]
        dest_path = join(destination.get('path', ''), leaf)
        self._authority(grant, '', True)
        self._authority(target, dest_path, True)
        with self._root(grant) as root, self._trash(root) as trash:
            if root._identity(trash) != tuple(found.get('trash_identity', ())):
                raise APIError('RECOVERY_CHANGED', 'Recovery directory identity changed.', 409)
            handle = root._relative(trash, source['path'], access=0x110081)
            try:
                if root._identity(handle) != tuple(found.get('identity', ())):
                    raise APIError('RECOVERY_CHANGED', 'Recovery entry identity changed.', 409)
                with self._root(target) as target_root, target_root._open(destination.get('path', ''), True) as dst:
                    self._authority(grant, '', True)
                    self._authority(target, dest_path, True)
                    root.rename_handle(handle, dst, leaf)
            finally:
                root.kernel.CloseHandle(handle)
        self._reconcile(grant['id'], found['original']['path'], target['id'], dest_path)
        return {'destination': {'grant': target['id'], 'path': dest_path}}
