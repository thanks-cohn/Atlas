"""Per-user Windows authority state; protected DACLs and retained root handles."""
import ctypes
from contextlib import contextmanager
from ctypes import wintypes as w
import json
import ntpath
import os
from pathlib import Path
import secrets
import sqlite3
import uuid

from .state import State
from .security import APIError
from .windows_provider import WindowsRoot, components, root_components


def windows_api():
    if os.name != 'nt':
        raise OSError('Actual Windows kernel required.')
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    advapi = ctypes.WinDLL('advapi32', use_last_error=True)
    kernel.GetCurrentProcess.restype = w.HANDLE
    kernel.CreateFileW.argtypes = [w.LPCWSTR, w.DWORD, w.DWORD, w.LPVOID, w.DWORD, w.DWORD, w.HANDLE]
    kernel.CreateFileW.restype = w.HANDLE
    kernel.CloseHandle.argtypes = [w.HANDLE]
    kernel.LocalFree.argtypes = [w.HLOCAL]
    advapi.OpenProcessToken.argtypes = [w.HANDLE, w.DWORD, ctypes.POINTER(w.HANDLE)]
    advapi.GetTokenInformation.argtypes = [w.HANDLE, ctypes.c_int, w.LPVOID, w.DWORD, ctypes.POINTER(w.DWORD)]
    advapi.ConvertSidToStringSidW.argtypes = [w.LPVOID, ctypes.POINTER(w.LPWSTR)]
    advapi.ConvertStringSecurityDescriptorToSecurityDescriptorW.argtypes = [w.LPCWSTR, w.DWORD, ctypes.POINTER(w.LPVOID), ctypes.POINTER(w.DWORD)]
    return kernel, advapi


def token_sid(process=None):
    kernel, advapi = windows_api()
    token = w.HANDLE()
    if not advapi.OpenProcessToken(process or kernel.GetCurrentProcess(), 8, ctypes.byref(token)):
        raise ctypes.WinError(ctypes.get_last_error())
    try:
        length = w.DWORD()
        advapi.GetTokenInformation(token, 1, None, 0, ctypes.byref(length))
        data = ctypes.create_string_buffer(length.value)
        if not advapi.GetTokenInformation(token, 1, data, length, ctypes.byref(length)):
            raise ctypes.WinError(ctypes.get_last_error())
        sid = ctypes.cast(data, ctypes.POINTER(w.LPVOID))[0]
        text = w.LPWSTR()
        if not advapi.ConvertSidToStringSidW(sid, ctypes.byref(text)):
            raise ctypes.WinError(ctypes.get_last_error())
        try:
            return text.value
        finally:
            kernel.LocalFree(ctypes.cast(text, w.HLOCAL))
    finally:
        kernel.CloseHandle(token)


def security_descriptor(sid, inherit=False):
    kernel, advapi = windows_api()
    pointer = w.LPVOID()
    flags = 'OICI' if inherit else ''
    sddl = f'O:{sid}D:P(A;{flags};GA;;;{sid})(A;{flags};GA;;;SY)'
    if not advapi.ConvertStringSecurityDescriptorToSecurityDescriptorW(sddl, 1, ctypes.byref(pointer), None):
        raise ctypes.WinError(ctypes.get_last_error())
    return pointer


def protect_handle(handle, sid, inherit=False):
    kernel, advapi = windows_api()
    verify_owner_handle(handle, sid)
    descriptor = security_descriptor(sid, inherit)
    try:
        advapi.GetSecurityDescriptorDacl.argtypes = [w.LPVOID, ctypes.POINTER(w.BOOL), ctypes.POINTER(w.LPVOID), ctypes.POINTER(w.BOOL)]
        present, defaulted, acl = w.BOOL(), w.BOOL(), w.LPVOID()
        if not advapi.GetSecurityDescriptorDacl(descriptor, ctypes.byref(present), ctypes.byref(acl), ctypes.byref(defaulted)):
            raise ctypes.WinError(ctypes.get_last_error())
        advapi.SetSecurityInfo.argtypes = [w.HANDLE, ctypes.c_int, w.DWORD, w.LPVOID, w.LPVOID, w.LPVOID, w.LPVOID]
        code = advapi.SetSecurityInfo(handle, 1, 4 | 0x80000000, None, None, acl, None)
        if code:
            raise ctypes.WinError(code)
    finally:
        kernel.LocalFree(descriptor)


class WindowsState(State):
    platform = 'windows'
    def __init__(self, directory):
        self.sid = token_sid()
        absolute = os.path.abspath(directory)
        root_components(absolute)
        _create_private_directory(absolute, self.sid)
        self.directory = Path(absolute)
        self._guard = WindowsRoot(absolute)
        self.identity = self._guard.identity
        try:
            # The traversal handle deliberately has no WRITE_DAC. Open a separate
            # security-only handle while retained guard prevents replacement.
            kernel, _ = windows_api()
            kernel.CreateFileW.argtypes = [w.LPCWSTR, w.DWORD, w.DWORD, w.LPVOID, w.DWORD, w.DWORD, w.HANDLE]
            kernel.CreateFileW.restype = w.HANDLE
            handle = kernel.CreateFileW(absolute, 0x60000, 3, None, 3, 0x02200000, None)
            if handle == ctypes.c_void_p(-1).value:
                raise ctypes.WinError(ctypes.get_last_error())
            try:
                protect_handle(handle, self.sid, True)
            finally:
                kernel.CloseHandle(handle)
            self.path = self.directory / 'windows-state.sqlite3'
            for suffix in ('', '-journal', '-wal', '-shm'):
                artifact = self.directory / (self.path.name + suffix)
                if artifact.exists():
                    self._protect_file(artifact.name)
            with self.connect() as db:
                version = db.execute('PRAGMA user_version').fetchone()[0]
                if version not in (0, 1):
                    raise APIError('UNSUPPORTED_STATE_VERSION', 'Newer Windows companion state.')
                db.executescript('''BEGIN IMMEDIATE;
                    CREATE TABLE IF NOT EXISTS clients(origin TEXT PRIMARY KEY,digest TEXT NOT NULL);
                    CREATE TABLE IF NOT EXISTS grants(id TEXT PRIMARY KEY,root TEXT UNIQUE NOT NULL,label TEXT NOT NULL,identity TEXT NOT NULL,writable INTEGER NOT NULL,broad INTEGER NOT NULL);
                    CREATE TABLE IF NOT EXISTS receipts(id TEXT PRIMARY KEY,request TEXT NOT NULL,result TEXT,created REAL NOT NULL);
                    CREATE TABLE IF NOT EXISTS exclusions(path TEXT PRIMARY KEY,identity TEXT NOT NULL);
                    PRAGMA user_version=1;''')
                db.execute('INSERT OR REPLACE INTO exclusions VALUES (?,?)', (absolute, json.dumps(self.identity)))
        except BaseException:
            self.close()
            raise

    def close(self):
        if getattr(self, '_guard', None):
            self._guard.close()
            self._guard = None

    def _validate_file(self, name):
        with self._guard._open(name, False):
            pass

    def _protect_file(self, name):
        self._validate_file(name)
        kernel, _ = windows_api()
        handle = kernel.CreateFileW(str(self.directory / name), 0x60000, 3, None, 3, 0x00200000, None)
        if handle == ctypes.c_void_p(-1).value:
            raise ctypes.WinError(ctypes.get_last_error())
        try:
            protect_handle(handle, self.sid)
        finally:
            kernel.CloseHandle(handle)

    @contextmanager
    def connect(self):
        # SQLite's CRT-created files inherit a token's default OWNER, which can
        # be Administrators under an elevated account. Precreate both durable
        # artifacts with explicit TokenUser ownership; PERSIST keeps the rollback
        # journal in place rather than recreating it with the CRT default owner.
        for name in (self.path.name, self.path.name + '-journal'):
            try:
                fd = create_private_file(self.directory / name, self.sid)
            except FileExistsError:
                self._protect_file(name)
            else:
                os.close(fd)
        db = sqlite3.connect(self.path, timeout=15)
        db.row_factory = sqlite3.Row
        try:
            mode = db.execute('PRAGMA journal_mode=PERSIST').fetchone()[0]
            if mode.lower() != 'persist':
                raise APIError('INVALID_STATE', 'Private persistent rollback journal required.')
            db.execute('PRAGMA synchronous=FULL')
            with db:
                yield db
        finally:
            db.close()

    def bootstrap_key(self):
        path = self.directory / 'bootstrap.key'
        try:
            fd = create_private_file(path, self.sid)
        except FileExistsError:
            pass
        else:
            try:
                os.write(fd, secrets.token_bytes(32))
                os.fsync(fd)
            finally:
                os.close(fd)
        self._protect_file('bootstrap.key')
        key = self._guard.read('bootstrap.key', 32)
        if len(key) != 32:
            raise APIError('INVALID_STATE', 'Invalid private bootstrap key.')
        return key

    @staticmethod
    def _under(path, ancestor):
        try:
            return ntpath.commonpath([ntpath.normcase(path), ntpath.normcase(ancestor)]) == ntpath.normcase(ancestor)
        except ValueError:
            return False

    def protect_path(self, path):
        absolute = os.path.abspath(path)
        if ntpath.dirname(absolute) == absolute:
            raise APIError('INVALID_EXCLUSION', 'Cannot exclude an entire drive.')
        # Native runtime exclusions may be regular files as well as folders.
        parent, name = ntpath.split(absolute)
        with WindowsRoot(parent) as root:
            with root._open(name, None) as handle:
                identity = root._identity(handle)
        with self.connect() as db:
            db.execute('INSERT OR REPLACE INTO exclusions VALUES (?,?)', (absolute, json.dumps(identity)))
        return absolute

    def requires_broad(self, path):
        root = os.path.abspath(path)
        return (ntpath.dirname(root) == root or ntpath.normcase(root) == ntpath.normcase(str(Path.home()))
                or any(self._under(item['path'], root) for item in self._exclusions()))

    def grant(self, path, label=None, writable=False, allow_broad=False):
        root = os.path.abspath(path)
        self._check_absolute(root)
        broad = self.requires_broad(root)
        if broad and allow_broad is not True:
            raise APIError('BROAD_CONSENT_REQUIRED', 'Explicit consent required for home, drive or private-state ancestor.', 403)
        with WindowsRoot(root, excluded_paths=[e['path'] for e in self._exclusions() if os.path.exists(e['path'])]) as opened:
            identity = opened.identity
        with self.connect() as db:
            old = db.execute('SELECT id FROM grants WHERE root=?', (root,)).fetchone()
            ident = old['id'] if old else uuid.uuid4().hex
            db.execute('INSERT OR REPLACE INTO grants VALUES (?,?,?,?,?,?)',
                       (ident, root, label or ntpath.basename(root) or 'Drive', json.dumps(identity), int(writable), int(broad)))
        return ident

    def get_grant(self, ident, write=False):
        result = super().get_grant(ident, write)
        result['identity'] = tuple(json.loads(result['identity']))
        self._check_absolute(result['root'])
        with WindowsRoot(result['root'], expected_identity=result['identity'],
                         excluded_paths=[e['path'] for e in self._exclusions() if os.path.exists(e['path'])]):
            pass
        return result

    def grants(self):
        result = super().grants()
        for item in result:
            item['identity'] = tuple(json.loads(item['identity']))
        return result

    def check_path(self, grant, path='', recursive=False, exclusions=None):
        absolute = ntpath.join(grant['root'], *components(path))
        self._check_absolute(absolute, recursive, exclusions)


current_sid = token_sid


def secure_directory(path):
    """Prepare a protected native folder without creating application data."""
    sid = token_sid()
    absolute = os.path.abspath(path)
    root_components(absolute)
    _create_private_directory(absolute, sid)
    with WindowsRoot(absolute):
        kernel, _ = windows_api()
        handle = kernel.CreateFileW(absolute, 0x60000, 3, None, 3, 0x02200000, None)
        if handle == ctypes.c_void_p(-1).value:
            raise ctypes.WinError(ctypes.get_last_error())
        try:
            protect_handle(handle, sid, True)
        finally:
            kernel.CloseHandle(handle)
    return Path(absolute)


def verify_private_handle(handle, sid):
    """Reject foreign owners, inherited/unprotected ACLs and additional trustees.

    Requires READ_CONTROL on the held handle. Used for existing private artifacts,
    never treats a user-writable pathname or an ACL display string as authority.
    """
    kernel, advapi = windows_api()
    owner, acl, descriptor = w.LPVOID(), w.LPVOID(), w.LPVOID()
    advapi.GetSecurityInfo.argtypes = [w.HANDLE, ctypes.c_int, w.DWORD, ctypes.POINTER(w.LPVOID),
                                     w.LPVOID, ctypes.POINTER(w.LPVOID), w.LPVOID, ctypes.POINTER(w.LPVOID)]
    code = advapi.GetSecurityInfo(handle, 1, 5, ctypes.byref(owner), None, ctypes.byref(acl), None, ctypes.byref(descriptor))
    if code:
        raise ctypes.WinError(code)

    def sid_string(pointer):
        value = w.LPWSTR()
        if not advapi.ConvertSidToStringSidW(pointer, ctypes.byref(value)):
            raise ctypes.WinError(ctypes.get_last_error())
        try:
            return value.value
        finally:
            kernel.LocalFree(ctypes.cast(value, w.HLOCAL))

    try:
        control, revision = w.WORD(), w.DWORD()
        advapi.GetSecurityDescriptorControl.argtypes = [w.LPVOID, ctypes.POINTER(w.WORD), ctypes.POINTER(w.DWORD)]
        if not advapi.GetSecurityDescriptorControl(descriptor, ctypes.byref(control), ctypes.byref(revision)):
            raise ctypes.WinError(ctypes.get_last_error())
        if not control.value & 0x1000 or not acl or sid_string(owner) != sid:
            raise APIError('INVALID_STATE', 'Private artifact owner or protected ACL differs.')
        # ACL header: revision, reserved, size WORD, ace count WORD, reserved WORD.
        count = ctypes.cast(acl, ctypes.POINTER(w.WORD))[2]
        trustees = set()
        advapi.GetAce.argtypes = [w.LPVOID, w.DWORD, ctypes.POINTER(w.LPVOID)]
        for index in range(count):
            ace = w.LPVOID()
            if not advapi.GetAce(acl, index, ctypes.byref(ace)):
                raise ctypes.WinError(ctypes.get_last_error())
            header = ctypes.string_at(ace, 8)
            mask = int.from_bytes(header[4:8], 'little')
            if header[0] != 0 or int.from_bytes(header[2:4], 'little') < 20:
                raise APIError('INVALID_STATE', 'Unsupported private ACL entry.')
            trustee = sid_string(w.LPVOID(ace.value + 8))
            if header[0] != 0 or header[1] & 0x10 or trustee not in (sid, 'S-1-5-18') or mask not in (0x10000000, 0x1f01ff):
                raise APIError('INVALID_STATE', 'Private ACL has unexpected authority.')
            trustees.add(trustee)
        if trustees != {sid, 'S-1-5-18'}:
            raise APIError('INVALID_STATE', 'Private ACL is incomplete.')
    finally:
        kernel.LocalFree(descriptor)


def verify_owner_handle(handle, sid):
    kernel, advapi = windows_api()
    owner, descriptor = w.LPVOID(), w.LPVOID()
    advapi.GetSecurityInfo.argtypes = [w.HANDLE, ctypes.c_int, w.DWORD, ctypes.POINTER(w.LPVOID),
                                     w.LPVOID, w.LPVOID, w.LPVOID, ctypes.POINTER(w.LPVOID)]
    code = advapi.GetSecurityInfo(handle, 1, 1, ctypes.byref(owner), None, None, None, ctypes.byref(descriptor))
    if code:
        raise ctypes.WinError(code)
    try:
        value = w.LPWSTR()
        if not advapi.ConvertSidToStringSidW(owner, ctypes.byref(value)):
            raise ctypes.WinError(ctypes.get_last_error())
        try:
            if value.value != sid:
                raise APIError('INVALID_STATE', 'Private artifact must be owned by the current account.')
        finally:
            kernel.LocalFree(ctypes.cast(value, w.HLOCAL))
    finally:
        kernel.LocalFree(descriptor)


def _create_private_directory(path, sid):
    """Create missing components privately while retaining every ancestor.

    Existing OS/account ancestors may have different owners. Every component we
    create (including a raced CREATE collision) and the final folder must have
    the current user as owner. All opens reject reparse points and deny delete
    sharing, so no validated ancestor can be swapped during path-based creation.
    """
    drive, names = root_components(path)
    if not names:
        raise APIError('INVALID_STATE', 'A drive root cannot be private state.')
    class Attributes(ctypes.Structure):
        _fields_ = [('length', w.DWORD), ('descriptor', w.LPVOID), ('inherit', w.BOOL)]
    kernel, _ = windows_api()
    descriptor = security_descriptor(sid, True)
    opened = []
    try:
        attributes = Attributes(ctypes.sizeof(Attributes), descriptor, False)
        kernel.CreateDirectoryW.argtypes = [w.LPCWSTR, ctypes.POINTER(Attributes)]
        with WindowsRoot(drive) as root:
            parent = root.handle
            current = drive
            try:
                for index, name in enumerate(names):
                    current = ntpath.join(current, name)
                    creating = False
                    try:
                        child = root._relative(parent, name, True)
                    except OSError as exc:
                        if getattr(exc, 'winerror', None) not in (2, 3):
                            raise
                        creating = True
                        if not kernel.CreateDirectoryW(current, ctypes.byref(attributes)):
                            code = ctypes.get_last_error()
                            if code != 183:
                                raise ctypes.WinError(code)
                        child = root._relative(parent, name, True)
                    opened.append(child)
                    parent = child
                    if creating or index == len(names) - 1:
                        security = kernel.CreateFileW(current, 0x20000, 3, None, 3, 0x02200000, None)
                        if security == ctypes.c_void_p(-1).value:
                            raise ctypes.WinError(ctypes.get_last_error())
                        try:
                            verify_owner_handle(security, sid)
                        finally:
                            kernel.CloseHandle(security)
            finally:
                for handle in reversed(opened):
                    kernel.CloseHandle(handle)
    finally:
        kernel.LocalFree(descriptor)


def create_private_file(path, sid):
    """CREATE_NEW with an explicit TokenUser owner and protected private DACL.

    Return a Python-owned CRT descriptor. Existing artifacts are never adopted,
    followed, truncated or assigned a different owner by this creation helper.
    """
    import msvcrt
    class Attributes(ctypes.Structure):
        _fields_ = [('length', w.DWORD), ('descriptor', w.LPVOID), ('inherit', w.BOOL)]
    kernel, _ = windows_api()
    descriptor = security_descriptor(sid)
    try:
        attributes = Attributes(ctypes.sizeof(Attributes), descriptor, False)
        handle = kernel.CreateFileW(str(path), 0xc0060000, 3, ctypes.byref(attributes), 1, 0x00200080, None)
        if handle == ctypes.c_void_p(-1).value:
            code = ctypes.get_last_error()
            if code in (80, 183):
                raise FileExistsError(code, 'Private artifact already exists', str(path))
            raise ctypes.WinError(code)
        try:
            verify_private_handle(handle, sid)
            return msvcrt.open_osfhandle(handle, os.O_BINARY | os.O_RDWR)
        except BaseException:
            kernel.CloseHandle(handle)
            raise
    finally:
        kernel.LocalFree(descriptor)
