"""Windows named-mutex ownership and handle-attested stale service recovery."""
import ctypes
from ctypes import wintypes as w
import hashlib
import hmac
import json
import os
from pathlib import Path
import secrets
import sys

from .security import APIError
from .windows_state import windows_api, token_sid, security_descriptor, create_private_file


class _SecurityAttributes(ctypes.Structure):
    _fields_ = [('length', w.DWORD), ('descriptor', w.LPVOID), ('inherit', w.BOOL)]


class RuntimeLock:
    def __init__(self, state, name):
        if name not in ('service', 'supervisor', 'wake', 'desktop'):
            raise ValueError('Unknown runtime lock')
        digest = hashlib.sha256(json.dumps(state.identity).encode()).hexdigest()
        self.name = f'Local\\Atlas.{state.sid}.{digest}.{name}'
        self.sid = state.sid
        self.handle = None

    def __enter__(self):
        kernel, _ = windows_api()
        kernel.CreateMutexW.argtypes = [ctypes.POINTER(_SecurityAttributes), w.BOOL, w.LPCWSTR]
        kernel.CreateMutexW.restype = w.HANDLE
        kernel.WaitForSingleObject.argtypes = [w.HANDLE, w.DWORD]
        kernel.WaitForSingleObject.restype = w.DWORD
        descriptor = security_descriptor(self.sid)
        try:
            attributes = _SecurityAttributes(ctypes.sizeof(_SecurityAttributes), descriptor, False)
            handle = kernel.CreateMutexW(ctypes.byref(attributes), False, self.name)
            if not handle:
                raise ctypes.WinError(ctypes.get_last_error())
        finally:
            kernel.LocalFree(descriptor)
        result = kernel.WaitForSingleObject(handle, 0)
        if result not in (0, 0x80):
            kernel.CloseHandle(handle)
            raise APIError('ALREADY_RUNNING', 'Another instance owns this private runtime lock.', 409)
        self.handle = handle
        return self

    def __exit__(self, *_):
        if self.handle is not None:
            kernel, _ = windows_api()
            kernel.ReleaseMutex.argtypes = [w.HANDLE]
            kernel.ReleaseMutex(self.handle)
            kernel.CloseHandle(self.handle)
            self.handle = None


def child_environment():
    environment = dict(os.environ)
    if getattr(sys, 'frozen', False):
        environment['PYINSTALLER_RESET_ENVIRONMENT'] = '1'
    else:
        environment['PYTHONPATH'] = str(Path(__file__).resolve().parents[1])
    return environment


def _process_identity(handle, pid):
    kernel, _ = windows_api()
    kernel.GetProcessTimes.argtypes = [w.HANDLE] + [ctypes.POINTER(w.FILETIME)] * 4
    creation, exit_time, system, user = (w.FILETIME() for _ in range(4))
    if not kernel.GetProcessTimes(handle, ctypes.byref(creation), ctypes.byref(exit_time), ctypes.byref(system), ctypes.byref(user)):
        raise ctypes.WinError(ctypes.get_last_error())
    kernel.QueryFullProcessImageNameW.argtypes = [w.HANDLE, w.DWORD, w.LPWSTR, ctypes.POINTER(w.DWORD)]
    name = ctypes.create_unicode_buffer(32768)
    size = w.DWORD(len(name))
    if not kernel.QueryFullProcessImageNameW(handle, 0, name, ctypes.byref(size)):
        raise ctypes.WinError(ctypes.get_last_error())
    return {'pid': pid, 'creation_filetime': (creation.dwHighDateTime << 32) | creation.dwLowDateTime,
            'exe': name.value, 'sid': token_sid(handle)}


def _encoded(identity):
    return json.dumps(identity, sort_keys=True, separators=(',', ':')).encode()


def write_service_identity(state, port):
    kernel, _ = windows_api()
    identity = _process_identity(kernel.GetCurrentProcess(), os.getpid())
    identity.update(port=port, state_identity=list(state.identity))
    signed = {'identity': identity, 'mac': hmac.new(state.bootstrap_key(), b'atlas.windows.service.v1:' + _encoded(identity), hashlib.sha256).hexdigest()}
    target = state.directory / ('service.identity.' + secrets.token_hex(8))
    try:
        with os.fdopen(create_private_file(target, state.sid), 'w', encoding='utf-8') as stream:
            json.dump(signed, stream)
            stream.flush()
            os.fsync(stream.fileno())
        destination = state.directory / 'service.identity'
        if destination.exists():
            state._validate_file(destination.name)
        os.replace(target, destination)
    finally:
        target.unlink(missing_ok=True)


def stop_attested_service(state, port):
    kernel, _ = windows_api()
    try:
        raw = state._guard.read('service.identity', 4096)
        signed = json.loads(raw)
        identity = signed['identity']
        expected = hmac.new(state.bootstrap_key(), b'atlas.windows.service.v1:' + _encoded(identity), hashlib.sha256).hexdigest()
        if (not hmac.compare_digest(expected, signed['mac']) or identity['sid'] != state.sid
                or identity['port'] != port or identity['state_identity'] != list(state.identity)):
            raise ValueError('Identity attestation mismatch')
        pid = identity['pid']
        if type(pid) is not int or pid <= 1 or pid == os.getpid():
            raise ValueError('Invalid service PID')
        kernel.OpenProcess.argtypes = [w.DWORD, w.BOOL, w.DWORD]
        kernel.OpenProcess.restype = w.HANDLE
        # Retain one process HANDLE from verification through termination. A reused
        # numeric PID cannot retarget this kernel object.
        handle = kernel.OpenProcess(0x1000 | 0x100000 | 1, False, pid)
        if not handle:
            raise ctypes.WinError(ctypes.get_last_error())
        try:
            current = _process_identity(handle, pid)
            if any(identity[k] != current[k] for k in current):
                raise ValueError('Process incarnation mismatch')
            kernel.TerminateProcess.argtypes = [w.HANDLE, w.UINT]
            if not kernel.TerminateProcess(handle, 1):
                raise ctypes.WinError(ctypes.get_last_error())
            kernel.WaitForSingleObject.argtypes = [w.HANDLE, w.DWORD]
            kernel.WaitForSingleObject.restype = w.DWORD
            if kernel.WaitForSingleObject(handle, 3000) != 0:
                raise ValueError('Attested service did not exit')
        finally:
            kernel.CloseHandle(handle)
    except (OSError, KeyError, TypeError, ValueError) as exc:
        raise APIError('NEEDS_REPAIR', 'Service identity is invalid or does not match the live process.') from exc
