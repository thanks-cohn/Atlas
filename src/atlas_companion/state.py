"""Private local configuration and durable mutation receipts (no raw tokens)."""
from contextlib import contextmanager
import hashlib
import stat
import json
import os
import re
import secrets
import sqlite3
import time
import uuid
from pathlib import Path

from .security import APIError, open_absolute_directory, parts, descriptor_path


class State:
    def __init__(self, directory):
        self.directory = Path(directory).absolute()
        self.directory.mkdir(parents=True, exist_ok=True, mode=0o700)
        if self.directory.is_symlink():
            raise APIError('INVALID_STATE', 'State directory cannot be a symlink.')
        state_fd = open_absolute_directory(str(self.directory))
        try:
            # Parent symlinks would make lexical exclusion/consent checks ambiguous.
            self.directory = Path(descriptor_path(state_fd))
        finally:
            os.close(state_fd)
        os.chmod(self.directory, 0o700)
        self.path = self.directory / 'state.sqlite3'
        if self.path.is_symlink():
            raise APIError('INVALID_STATE', 'State database cannot be a symlink.')
        with self.connect() as db:
            version = db.execute('PRAGMA user_version').fetchone()[0]
            if version not in (0, 1, 2):
                raise APIError('UNSUPPORTED_STATE_VERSION', 'State database was created by a newer companion.')
            db.executescript('''
                BEGIN IMMEDIATE;
                CREATE TABLE IF NOT EXISTS clients(origin TEXT PRIMARY KEY, digest TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS grants(id TEXT PRIMARY KEY, root TEXT UNIQUE NOT NULL,
                    label TEXT NOT NULL, device INTEGER NOT NULL, inode INTEGER NOT NULL, writable INTEGER NOT NULL);
                CREATE TABLE IF NOT EXISTS receipts(id TEXT PRIMARY KEY, request TEXT NOT NULL,
                    result TEXT, created REAL NOT NULL);
                CREATE TABLE IF NOT EXISTS exclusions(path TEXT PRIMARY KEY, device INTEGER NOT NULL, inode INTEGER NOT NULL);
            ''')
            columns = {row['name'] for row in db.execute('PRAGMA table_info(grants)')}
            if 'broad' not in columns:
                db.execute('ALTER TABLE grants ADD COLUMN broad INTEGER NOT NULL DEFAULT 0')
            info = self.directory.stat()
            db.execute('INSERT OR REPLACE INTO exclusions VALUES (?,?,?)',
                       (str(self.directory), info.st_dev, info.st_ino))
            db.execute('PRAGMA user_version=2')
        os.chmod(self.path, 0o600)

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=15)
        db.row_factory = sqlite3.Row
        db.execute('PRAGMA synchronous=FULL')
        try:
            with db:
                yield db
        finally:
            db.close()

    def bootstrap_key(self):
        path = self.directory / 'bootstrap.key'
        try:
            fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
        except FileExistsError:
            pass
        else:
            try:
                os.write(fd, secrets.token_bytes(32))
                os.fsync(fd)
            finally:
                os.close(fd)
        fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
        try:
            info = os.fstat(fd)
            if not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid() or info.st_mode & 0o077:
                raise APIError('INVALID_STATE', 'Bootstrap key must be a private regular file owned by this user.')
            key = os.read(fd, 33)
            if len(key) != 32:
                raise APIError('INVALID_STATE', 'Bootstrap key is invalid. Stop the companion and repair local state.')
            return key
        finally:
            os.close(fd)

    def pair(self, extension_id):
        if not isinstance(extension_id, str) or not re.fullmatch('[a-p]{32}', extension_id):
            raise APIError('INVALID_EXTENSION', 'Expected a 32-character Chrome extension ID (a-p).')
        origin = 'chrome-extension://' + extension_id
        token = secrets.token_urlsafe(32)
        with self.connect() as db:
            db.execute('INSERT OR REPLACE INTO clients VALUES (?,?)', (origin, hashlib.sha256(token.encode()).hexdigest()))
        return token

    def authenticate(self, origin, token):
        if not isinstance(origin, str) or not isinstance(token, str) or len(token) > 200:
            return False
        with self.connect() as db:
            row = db.execute('SELECT digest FROM clients WHERE origin=?', (origin,)).fetchone()
        return bool(row and secrets.compare_digest(row['digest'], hashlib.sha256(token.encode()).hexdigest()))

    def known_origin(self, origin):
        with self.connect() as db:
            return db.execute('SELECT 1 FROM clients WHERE origin=?', (origin,)).fetchone() is not None

    def revoke_client(self, extension_id):
        with self.connect() as db:
            db.execute('DELETE FROM clients WHERE origin=?', ('chrome-extension://' + extension_id,))

    def _exclusions(self):
        # Other trusted installer processes can add exclusions while serving.
        with self.connect() as db:
            return [dict(row) for row in db.execute('SELECT * FROM exclusions')]

    def protect_path(self, path):
        """Trusted-native only: persist an installed runtime/config exclusion."""
        absolute = str(Path(path).absolute())
        parent_path, leaf = os.path.split(absolute.rstrip('/'))
        if not leaf:
            raise APIError('INVALID_EXCLUSION', 'Cannot exclude the complete filesystem.')
        parent = open_absolute_directory(parent_path or '/')
        try:
            fd = os.open(leaf, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=parent)
            try:
                info = os.fstat(fd)
                if not (stat.S_ISDIR(info.st_mode) or stat.S_ISREG(info.st_mode)):
                    raise APIError('INVALID_EXCLUSION', 'Protect only an existing regular file or directory.')
                canonical = descriptor_path(fd)
            finally:
                os.close(fd)
        finally:
            os.close(parent)
        with self.connect() as db:
            db.execute('INSERT OR REPLACE INTO exclusions VALUES (?,?,?)', (canonical, info.st_dev, info.st_ino))
        return canonical

    @staticmethod
    def _under(path, ancestor):
        return os.path.commonpath([path, ancestor]) == ancestor

    def requires_broad(self, path):
        root = str(Path(path).absolute())
        return (root == '/' or root == str(Path.home()) or os.path.ismount(root)
                or any(self._under(item['path'], root) for item in self._exclusions()))

    def grant(self, path, label=None, writable=False, allow_broad=False):
        root = str(Path(path).absolute())
        exclusions = self._exclusions()
        if any(self._under(root, item['path']) for item in exclusions):
            raise APIError('PRIVATE_STATE', 'Private companion state cannot be granted.', 403)
        broad = self.requires_broad(root)
        if broad and allow_broad is not True:
            raise APIError('BROAD_CONSENT_REQUIRED', 'This location includes a home, volume or private-state ancestor. Explicit broad access consent is required.', 403)
        fd = open_absolute_directory(root)
        try:
            self.check_fd(fd)
            info = os.fstat(fd)
        finally:
            os.close(fd)
        with self.connect() as db:
            old = db.execute('SELECT id FROM grants WHERE root=?', (root,)).fetchone()
            ident = old['id'] if old else uuid.uuid4().hex
            db.execute('INSERT OR REPLACE INTO grants (id,root,label,device,inode,writable,broad) VALUES (?,?,?,?,?,?,?)',
                       (ident, root, label or Path(root).name or 'Filesystem', info.st_dev, info.st_ino, int(writable), int(broad)))
        return ident

    def check_path(self, grant, path='', recursive=False, exclusions=None):
        components = parts(path)
        absolute = os.path.join(grant['root'], *components)
        self._check_absolute(absolute, recursive, exclusions)

    def _check_absolute(self, absolute, recursive=False, exclusions=None):
        for item in self._exclusions() if exclusions is None else exclusions:
            private = item['path']
            if self._under(absolute, private) or (recursive and self._under(private, absolute)):
                raise APIError('PRIVATE_STATE', 'Private companion state and operations on its ancestors are excluded.', 403)

    def check_fd(self, fd, recursive=False):
        """Check the actual held Linux descriptor, not only an attacker path.

        Directory ancestry is traversed by descriptors so renaming a directory
        into the private subtree cannot bypass its persisted inode exclusion.
        Files with multiple hard links are deliberately unsupported: an alias to
        a private database must never become a readable graph/file resource.
        """
        self._check_absolute(descriptor_path(fd), recursive)
        info = os.fstat(fd)
        excluded = {(item['device'], item['inode']) for item in self._exclusions()}
        if (info.st_dev, info.st_ino) in excluded:
            raise APIError('PRIVATE_STATE', 'Private companion artifact is excluded.', 403)
        if not stat.S_ISDIR(info.st_mode):
            if info.st_nlink > 1:
                raise APIError('HARDLINK_DENIED', 'Multiply linked files are excluded from companion access.', 403)
            return
        current = os.dup(fd)
        try:
            for _ in range(512):
                value = os.fstat(current)
                identity = value.st_dev, value.st_ino
                if identity in excluded:
                    raise APIError('PRIVATE_STATE', 'Private companion directory is excluded.', 403)
                above = os.open('..', os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=current)
                parent_info = os.fstat(above)
                if (parent_info.st_dev, parent_info.st_ino) == identity:
                    os.close(above)
                    return
                os.close(current)
                current = above
            raise APIError('LIMIT', 'Directory ancestry exceeds the supported limit.', 403)
        finally:
            os.close(current)

    def check_entry(self, parent_fd, leaf, recursive=False):
        self.check_fd(parent_fd)
        fd = os.open(leaf, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=parent_fd)
        try:
            self.check_fd(fd, recursive)
        finally:
            os.close(fd)

    def grants(self):
        with self.connect() as db:
            return [dict(row) for row in db.execute('SELECT * FROM grants ORDER BY label')]

    def get_grant(self, ident, write=False):
        if not isinstance(ident, str):
            raise APIError('INVALID_GRANT', 'A grant ID is required.')
        with self.connect() as db:
            row = db.execute('SELECT * FROM grants WHERE id=?', (ident,)).fetchone()
        if not row:
            raise APIError('UNAUTHORIZED', 'Folder grant is missing or revoked.', 403)
        if write and not row['writable']:
            raise APIError('READ_ONLY', 'This folder is granted read-only.', 403)
        return dict(row)

    def revoke_grant(self, ident):
        with self.connect() as db:
            db.execute('DELETE FROM grants WHERE id=?', (ident,))

    def begin(self, ident, request):
        if not isinstance(ident, str) or not re.fullmatch('[A-Za-z0-9_-]{16,80}', ident):
            raise APIError('INVALID_OPERATION_ID', 'Use a fresh UUID for each operation.')
        encoded = json.dumps(request, sort_keys=True, separators=(',', ':'))
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            row = db.execute('SELECT * FROM receipts WHERE id=?', (ident,)).fetchone()
            if row:
                if row['request'] != encoded:
                    raise APIError('ID_CONFLICT', 'Operation ID was already used for different arguments.', 409)
                if row['result'] is None:
                    raise APIError('OUTCOME_UNKNOWN', 'Interrupted operation: inspect filesystem before retrying with a new ID.', 409)
                return json.loads(row['result'])
            db.execute('INSERT INTO receipts VALUES (?,?,NULL,?)', (ident, encoded, time.time()))
        return None

    def finish(self, ident, result):
        with self.connect() as db:
            db.execute('UPDATE receipts SET result=? WHERE id=?', (json.dumps(result), ident))

    def receipts(self, limit=100):
        """Recent authorized outcomes, never raw requests or revoked grant metadata.

        Omit an entire cross-grant receipt when any involved grant is revoked.
        Pending means the durable intent exists but its effects are uncertain.
        """
        if type(limit) is not int or not 1 <= limit <= 100:
            raise APIError('INVALID_LIMIT', 'History limit must be 1–100.')

        def references(value):
            if isinstance(value, dict):
                for key, item in value.items():
                    if key == 'grant':
                        yield item
                    else:
                        yield from references(item)
            elif isinstance(value, list):
                for item in value:
                    yield from references(item)

        def locator(value):
            if isinstance(value, dict):
                return {key: value[key] for key in ('grant', 'path') if key in value}

        history = []
        with self.connect() as db:
            grants = {row['id'] for row in db.execute('SELECT id FROM grants')}
            # Bound database work independently of the number of revoked records.
            rows = db.execute('SELECT * FROM receipts ORDER BY created DESC, id DESC LIMIT 1000')
            for row in rows:
                request = json.loads(row['request'])
                result = json.loads(row['result']) if row['result'] else None
                involved = list(references(request)) + list(references(result))
                if not involved or any(not isinstance(g, str) or g not in grants for g in involved):
                    continue
                item = {'id': row['id'], 'action': request.get('action'),
                        'created': row['created'], 'status': 'pending', 'results': []}
                if result is None:
                    item['error'] = {'code': 'OUTCOME_UNKNOWN', 'message': 'Interrupted or still running. Inspect the filesystem before any new operation; do not retry blindly.'}
                else:
                    item['status'] = result['status']
                    item['finished'] = result.get('finished')
                    for entry in result.get('results', []):
                        clean = {'ok': bool(entry.get('ok'))}
                        for key in ('source', 'original', 'destination'):
                            if isinstance(entry.get(key), dict):
                                clean[key] = locator(entry[key])
                        for key in ('trash_id', 'recoverable'):
                            if key in entry:
                                clean[key] = entry[key]
                        if entry.get('error'):
                            # OS messages can contain absolute paths; show a safe code only.
                            clean['error'] = {'code': entry['error'].get('code', 'IO_ERROR')}
                        item['results'].append(clean)
                history.append(item)
                if len(history) == limit:
                    break
        return history
