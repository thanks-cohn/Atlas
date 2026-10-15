"""Small, fail-closed Linux filesystem authority boundary.

All path traversal is relative to held directory descriptors. Symlinks are never
followed, including at grant roots. Unsupported platforms fail closed.
"""
import ctypes
import errno
import os
import re
import stat
from contextlib import contextmanager


class APIError(Exception):
    def __init__(self, code, message, status=400):
        self.code, self.message, self.status = code, message, status
        super().__init__(message)


def require_platform():
    if not hasattr(os, 'O_NOFOLLOW') or not os.supports_dir_fd or os.name != 'posix':
        raise APIError('UNSUPPORTED', 'Descriptor-safe filesystem operations require Linux.', 501)
    import sys
    if not sys.platform.startswith('linux'):
        raise APIError('UNSUPPORTED', 'This provider has only been implemented for Linux.', 501)


def parts(path, allow_empty=True):
    if not isinstance(path, str) or len(path) > 4096 or '\x00' in path or '\\' in path:
        raise APIError('INVALID_PATH', 'Use a relative slash-separated path.')
    if path == '' and allow_empty:
        return []
    split = path.split('/')
    if any((p in ('', '.', '..') or p.startswith('.atlas-')) or len(p.encode()) > 255 for p in split):
        raise APIError('INVALID_PATH', 'Absolute, traversal and reserved paths are denied.')
    return split


def name(value):
    components = parts(value, False)
    if len(components) != 1:
        raise APIError('INVALID_NAME', 'Enter a single file or folder name.')
    return components[0]


def open_absolute_directory(path):
    require_platform()
    if not isinstance(path, str) or not path.startswith('/'):
        raise APIError('INVALID_ROOT', 'Root must be an absolute directory.')
    fd = os.open('/', os.O_RDONLY | os.O_DIRECTORY)
    try:
        for part in path.split('/'):
            if not part:
                continue
            if part in ('.', '..'):
                raise APIError('INVALID_ROOT', 'Root cannot contain dot components.')
            new = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=fd)
            os.close(fd)
            fd = new
        return fd
    except BaseException:
        os.close(fd)
        raise


@contextmanager
def root_fd(grant):
    fd = open_absolute_directory(grant['root'])
    try:
        s = os.fstat(fd)
        if (s.st_dev, s.st_ino) != (grant['device'], grant['inode']):
            raise APIError('GRANT_CHANGED', 'Granted root identity changed; grant it again.', 403)
        yield fd
    finally:
        os.close(fd)


@contextmanager
def directory(root, components):
    fd = os.dup(root)
    try:
        for component in components:
            new = os.open(component, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=fd)
            os.close(fd)
            fd = new
        yield fd
    finally:
        os.close(fd)


@contextmanager
def parent(root, path):
    p = parts(path, False)
    with directory(root, p[:-1]) as fd:
        yield fd, p[-1]


def regular_stat(fd, entry):
    s = os.stat(entry, dir_fd=fd, follow_symlinks=False)
    if not (stat.S_ISDIR(s.st_mode) or stat.S_ISREG(s.st_mode)):
        raise APIError('UNSUPPORTED_ENTRY', 'Symlinks and special files are not accessible.', 403)
    return s


def rename_no_replace(src_fd, src, dst_fd, dst):
    # Linux renameat2(RENAME_NOREPLACE) avoids a check-then-overwrite race.
    libc = ctypes.CDLL(None, use_errno=True)
    fn = getattr(libc, 'renameat2', None)
    if fn is None:
        raise APIError('UNSUPPORTED', 'Atomic no-replace rename is unavailable.', 501)
    fn.argtypes = [ctypes.c_int, ctypes.c_char_p, ctypes.c_int, ctypes.c_char_p, ctypes.c_uint]
    fn.restype = ctypes.c_int
    if fn(src_fd, os.fsencode(src), dst_fd, os.fsencode(dst), 1):
        e = ctypes.get_errno()
        raise OSError(e, os.strerror(e))
