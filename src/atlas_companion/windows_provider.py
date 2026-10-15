"""Windows handle-based read provider under construction; never auto-enables grants.

This module is independent of Linux dirfd/flock/pidfd code. The integrated
companion remains Linux-only until Windows state ACL, install and recovery gates
pass. These operations use actual Windows kernel handles, never path-prefix
checks as a substitute for traversal authorization. Windows 10/11 API target.
"""
import ctypes
import ntpath
import os
import re
from contextlib import contextmanager
from ctypes import wintypes as w


class WindowsBoundaryError(ValueError):
    pass


def components(path, allow_empty=True):
    if not isinstance(path, str) or len(path) > 4096 or '\x00' in path or '\\' in path:
        raise WindowsBoundaryError('Expected a portable relative slash-separated path.')
    if path == '' and allow_empty:
        return []
    result = path.split('/')
    for name in result:
        if (not name or name in ('.', '..') or name.startswith('.atlas-')
                or any(c in name for c in ':<>"|?*') or any(ord(c) < 32 for c in name)
                or name.endswith((' ', '.'))
                or re.fullmatch(r'(CON|PRN|AUX|NUL|COM[1-9¹²³]|LPT[1-9¹²³])(?:\..*)?', name, re.I)):
            raise WindowsBoundaryError('Traversal, device, alternate-stream and ambiguous names are denied.')
        try:
            length = len(name.encode('utf-16-le')) // 2
        except UnicodeError as exc:
            raise WindowsBoundaryError('Invalid UTF-16 file name.') from exc
        if length > 255:
            raise WindowsBoundaryError('File name exceeds 255 UTF-16 code units.')
    return result


def root_components(path):
    if not isinstance(path, str) or not re.match(r'^[a-zA-Z]:\\', path):
        raise WindowsBoundaryError('Use an explicit local drive path; UNC/device namespaces are not enabled.')
    drive, tail = ntpath.splitdrive(path)
    # Open the drive root, then each individual component without following reparse points.
    relative = tail[1:].replace('\\', '/')
    if relative.endswith('/'):
        relative = relative[:-1]
    return drive.upper() + '\\', components(relative)


class _UnicodeString(ctypes.Structure):
    _fields_ = [('Length', w.USHORT), ('MaximumLength', w.USHORT), ('Buffer', w.LPWSTR)]


class _ObjectAttributes(ctypes.Structure):
    _fields_ = [('Length', w.ULONG), ('RootDirectory', w.HANDLE),
                ('ObjectName', ctypes.POINTER(_UnicodeString)), ('Attributes', w.ULONG),
                ('SecurityDescriptor', w.LPVOID), ('SecurityQualityOfService', w.LPVOID)]


class _IOStatus(ctypes.Structure):
    _fields_ = [('Status', ctypes.c_void_p), ('Information', ctypes.c_size_t)]


class _FileId(ctypes.Structure):
    _fields_ = [('VolumeSerialNumber', ctypes.c_ulonglong), ('FileId', ctypes.c_ubyte * 16)]


class _Tag(ctypes.Structure):
    _fields_ = [('FileAttributes', w.DWORD), ('ReparseTag', w.DWORD)]


class _Standard(ctypes.Structure):
    _fields_ = [('AllocationSize', ctypes.c_longlong), ('EndOfFile', ctypes.c_longlong),
                ('NumberOfLinks', w.DWORD), ('DeletePending', w.BOOLEAN), ('Directory', w.BOOLEAN)]


class _Basic(ctypes.Structure):
    _fields_ = [('CreationTime', ctypes.c_longlong), ('LastAccessTime', ctypes.c_longlong),
                ('LastWriteTime', ctypes.c_longlong), ('ChangeTime', ctypes.c_longlong), ('FileAttributes', w.DWORD)]


class _DirectoryEntry(ctypes.Structure):
    _fields_ = [('NextEntryOffset', w.DWORD), ('FileIndex', w.DWORD),
                ('CreationTime', ctypes.c_longlong), ('LastAccessTime', ctypes.c_longlong),
                ('LastWriteTime', ctypes.c_longlong), ('ChangeTime', ctypes.c_longlong),
                ('EndOfFile', ctypes.c_longlong), ('AllocationSize', ctypes.c_longlong),
                ('FileAttributes', w.DWORD), ('FileNameLength', w.DWORD), ('EaSize', w.DWORD),
                ('ShortNameLength', ctypes.c_byte), ('ShortName', w.WCHAR * 12),
                ('FileId', ctypes.c_longlong), ('FileName', w.WCHAR * 1)]


class WindowsRoot:
    """Explicit held local root; list/read only, no implicit enrollment or writes.

    Callers must retain identity across lifetimes and supply protected native
    state/runtime paths before integrating this provider into the actual API.
    The root handle denies delete sharing to prevent its reparenting while held.
    Every traversed directory similarly denies delete sharing for path-race safety.
    """
    def __init__(self, path, *, expected_identity=None, excluded_paths=()):
        if os.name != 'nt':
            raise OSError('WindowsRoot requires an actual Windows kernel; no emulation fallback.')
        self.kernel = ctypes.WinDLL('kernel32', use_last_error=True)
        self.nt = ctypes.WinDLL('ntdll')
        self.kernel.CreateFileW.argtypes = [w.LPCWSTR, w.DWORD, w.DWORD, w.LPVOID, w.DWORD, w.DWORD, w.HANDLE]
        self.kernel.CreateFileW.restype = w.HANDLE
        self.kernel.CloseHandle.argtypes = [w.HANDLE]; self.kernel.CloseHandle.restype = w.BOOL
        self.kernel.GetFileInformationByHandleEx.argtypes = [w.HANDLE, ctypes.c_int, w.LPVOID, w.DWORD]
        self.kernel.GetFileInformationByHandleEx.restype = w.BOOL
        self.kernel.ReadFile.argtypes = [w.HANDLE, w.LPVOID, w.DWORD, ctypes.POINTER(w.DWORD), w.LPVOID]
        self.kernel.ReadFile.restype = w.BOOL
        self.nt.NtCreateFile.argtypes = [ctypes.POINTER(w.HANDLE), w.DWORD, ctypes.POINTER(_ObjectAttributes),
            ctypes.POINTER(_IOStatus), w.LPVOID, w.DWORD, w.DWORD, w.DWORD, w.DWORD, w.LPVOID, w.DWORD]
        self.nt.NtCreateFile.restype = ctypes.c_long
        self.nt.RtlNtStatusToDosError.argtypes = [ctypes.c_long]; self.nt.RtlNtStatusToDosError.restype = w.ULONG
        self.handle = None
        self._excluded = set()
        self._collecting_private_identities = False
        self.path = path
        try:
            self.handle = self._absolute(path)
            self.identity = self._identity(self.handle)
            if expected_identity is not None and tuple(expected_identity) != self.identity:
                raise WindowsBoundaryError('Granted root identity changed; explicit authorization required.')
            self._collecting_private_identities = True
            for private in excluded_paths:
                handle = self._absolute(private, directory=None)
                try:
                    self._excluded.add(self._identity(handle))
                finally:
                    self.kernel.CloseHandle(handle)
            self._collecting_private_identities = False
            self._check(self.handle)
        except BaseException:
            self.close()
            raise

    def _info(self, handle, cls, structure):
        result = structure()
        if not self.kernel.GetFileInformationByHandleEx(handle, cls, ctypes.byref(result), ctypes.sizeof(result)):
            raise ctypes.WinError(ctypes.get_last_error())
        return result

    def _identity(self, handle):
        data = self._info(handle, 18, _FileId)
        return data.VolumeSerialNumber, bytes(data.FileId).hex()

    def _check(self, handle):
        if self._info(handle, 9, _Tag).FileAttributes & 0x400:
            raise WindowsBoundaryError('Reparse points, symlinks and junctions are denied.')
        standard = self._info(handle, 1, _Standard)
        if not self._collecting_private_identities and not standard.Directory and standard.NumberOfLinks > 1:
            raise WindowsBoundaryError('Hard-linked files are conservatively denied.')
        if not self._collecting_private_identities and self._identity(handle) in self._excluded:
            raise WindowsBoundaryError('Private native state/runtime is excluded.')

    def _relative(self, parent, name, directory=None):
        components(name, False)
        text = ctypes.create_unicode_buffer(name)
        encoded_length = len(name.encode('utf-16-le'))
        u = _UnicodeString(encoded_length, encoded_length + 2, ctypes.cast(text, w.LPWSTR))
        obj = _ObjectAttributes(ctypes.sizeof(_ObjectAttributes), parent, ctypes.pointer(u), 0x40 | 0x1000, None, None)
        output = w.HANDLE(); status = _IOStatus()
        # FILE_READ_DATA/LIST_DIRECTORY | FILE_READ_ATTRIBUTES | SYNCHRONIZE.
        flags = 0x00200000 | 0x20 | (1 if directory is True else 0x40 if directory is False else 0)
        code = self.nt.NtCreateFile(ctypes.byref(output), 0x100081, ctypes.byref(obj), ctypes.byref(status),
                                   None, 0, 3, 1, flags, None, 0)
        if code < 0:
            raise ctypes.WinError(self.nt.RtlNtStatusToDosError(code))
        try:
            self._check(output)
            return output
        except BaseException:
            self.kernel.CloseHandle(output)
            raise

    def _absolute(self, path, directory=True):
        drive, names = root_components(path)
        handle = self.kernel.CreateFileW(drive, 0x100081, 3, None, 3, 0x02000000 | 0x00200000, None)
        if handle == ctypes.c_void_p(-1).value:
            raise ctypes.WinError(ctypes.get_last_error())
        try:
            self._check(handle)
            for index, name in enumerate(names):
                new = self._relative(handle, name, directory=True if index < len(names)-1 else directory)
                self.kernel.CloseHandle(handle)
                handle = new
            return handle
        except BaseException:
            self.kernel.CloseHandle(handle)
            raise

    @contextmanager
    def _open(self, path, directory):
        names = components(path)
        current = self.handle
        opened = []
        try:
            self._check(current)
            for index, name in enumerate(names):
                current = self._relative(current, name, True if index < len(names)-1 else directory)
                opened.append(current)
            yield current
        finally:
            for handle in reversed(opened):
                self.kernel.CloseHandle(handle)

    def list(self, path='', limit=20000):
        if type(limit) is not int or not 1 <= limit <= 20000:
            raise WindowsBoundaryError('List limit must be 1-20,000.')
        result = []
        with self._open(path, True) as handle:
            buffer = ctypes.create_string_buffer(65536)
            first = True
            scanned = 0
            while True:
                if not self.kernel.GetFileInformationByHandleEx(handle, 11 if first else 10, buffer, len(buffer)):
                    code = ctypes.get_last_error()
                    if code == 18:
                        break
                    raise ctypes.WinError(code)
                first = False
                offset = 0
                while True:
                    head = _DirectoryEntry.from_buffer(buffer, offset)
                    length = head.FileNameLength
                    if length % 2 or offset + _DirectoryEntry.FileName.offset + length > len(buffer):
                        raise WindowsBoundaryError('Invalid native directory entry.')
                    name = ctypes.wstring_at(ctypes.addressof(buffer) + offset + _DirectoryEntry.FileName.offset, length // 2)
                    if name not in ('.', '..'):
                        scanned += 1
                        if scanned > limit:
                            raise WindowsBoundaryError('Directory exceeds the configured listing limit.')
                        try:
                            components(name, False)
                            if not head.FileAttributes & 0x400:
                                # Reopen each candidate through the retained directory handle;
                                # filter protected identities and entries swapped to reparse points.
                                entry = self._relative(handle, name)
                                self.kernel.CloseHandle(entry)
                                result.append({'name': name, 'path': '/'.join(filter(None, [path, name])),
                                    'kind': 'directory' if head.FileAttributes & 0x10 else 'file', 'size': head.EndOfFile})
                        except (WindowsBoundaryError, OSError):
                            pass  # Inaccessible/changed entries confer no authority.
                    step = head.NextEntryOffset
                    if not step:
                        break
                    if step < _DirectoryEntry.FileName.offset or offset + step >= len(buffer):
                        raise WindowsBoundaryError('Invalid native directory offset.')
                    offset += step
        return sorted(result, key=lambda x: (x['kind'] != 'directory', x['name'].casefold()))

    def read(self, path, limit=2*1024*1024):
        components(path, False)
        if type(limit) is not int or not 0 <= limit <= 2*1024*1024:
            raise WindowsBoundaryError('Read limit must be 0-2 MiB.')
        with self._open(path, False) as handle:
            before = self._info(handle, 1, _Standard)
            basic = self._info(handle, 0, _Basic)
            if before.Directory or before.EndOfFile > limit:
                raise WindowsBoundaryError('Only bounded regular-file previews are supported.')
            chunks = []; total = 0
            while True:
                buffer = ctypes.create_string_buffer(min(65536, limit + 1 - total))
                amount = w.DWORD()
                if not self.kernel.ReadFile(handle, buffer, len(buffer), ctypes.byref(amount), None):
                    raise ctypes.WinError(ctypes.get_last_error())
                if not amount.value:
                    break
                total += amount.value
                if total > limit:
                    raise WindowsBoundaryError('File grew beyond preview limit.')
                chunks.append(buffer.raw[:amount.value])
            after = self._info(handle, 1, _Standard)
            final = self._info(handle, 0, _Basic)
            if (total != before.EndOfFile or after.EndOfFile != before.EndOfFile
                    or (basic.LastWriteTime, basic.ChangeTime) != (final.LastWriteTime, final.ChangeTime)):
                raise WindowsBoundaryError('File changed during read; no accepted preview returned.')
            return b''.join(chunks)

    def close(self):
        if self.handle is not None:
            self.kernel.CloseHandle(self.handle)
            self.handle = None

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.close()
