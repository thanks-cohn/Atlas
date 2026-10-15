"""Linux advisory ownership locks; no PID files and no process-name killing."""
import os
if os.name != 'nt':
    import fcntl
import stat
import sys
from pathlib import Path

from .security import APIError


class RuntimeLock:
    def __init__(self, state, name):
        if name not in ('service', 'supervisor', 'wake', 'desktop'):
            raise ValueError('Unknown runtime lock')
        self.path = state.directory / (name + '.lock')
        self.fd = None

    def __enter__(self):
        fd = os.open(self.path, os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW | os.O_NONBLOCK, 0o600)
        try:
            info = os.fstat(fd)
            if not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid() or info.st_mode & 0o077:
                raise APIError('INVALID_STATE', 'Runtime lock must be a private regular file owned by this user.')
            try:
                fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError:
                raise APIError('ALREADY_RUNNING', 'Another instance owns this private runtime lock.', 409)
            self.fd = fd
            return self
        except BaseException:
            os.close(fd)
            raise

    def __exit__(self, *args):
        if self.fd is not None:
            os.close(self.fd)
            self.fd = None
        # Never unlink: another waiter could hold the original inode.


def child_environment():
    """Independent frozen children own their extraction; source children use this checkout."""
    environment = dict(os.environ)
    if getattr(sys, 'frozen', False):
        environment['PYINSTALLER_RESET_ENVIRONMENT'] = '1'
    else:
        environment['PYTHONPATH'] = str(Path(__file__).resolve().parents[1])
    return environment


def _process_identity(pid):
    """Linux process incarnation, read only after pidfd acquisition by signal callers."""
    base = Path('/proc') / str(pid)
    text = (base / 'stat').read_text()
    ticks = text[text.rfind(')') + 2:].split()[19]
    return {'pid': pid, 'start_ticks': ticks, 'uid': base.stat().st_uid,
            'exe': os.readlink(base / 'exe')}


def write_service_identity(state, port):
    """Called only by the serving process while holding its exclusive service lock."""
    import hashlib
    import hmac
    import json
    import secrets
    identity = _process_identity(os.getpid())
    directory = state.directory.stat()
    identity.update(port=port, state_device=directory.st_dev, state_inode=directory.st_ino)
    encoded = json.dumps(identity, sort_keys=True, separators=(',', ':')).encode()
    signed = {'identity': identity, 'mac': hmac.new(state.bootstrap_key(), b'atlas.service.v1:' + encoded, hashlib.sha256).hexdigest()}
    target = state.directory / ('service.identity.' + secrets.token_hex(8))
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    try:
        with os.fdopen(fd, 'w') as stream:
            json.dump(signed, stream)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(target, state.directory / 'service.identity')
    finally:
        target.unlink(missing_ok=True)


def stop_attested_service(state, port):
    """Signal only the exact HMAC-attested process incarnation via Linux pidfd."""
    import hashlib
    import hmac
    import json
    import select
    import signal
    if not hasattr(os, 'pidfd_open') or not hasattr(signal, 'pidfd_send_signal'):
        raise APIError('NEEDS_REPAIR', 'Safe stale recovery requires Linux pidfd support.')
    fd = os.open(state.directory / 'service.identity', os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    try:
        info = os.fstat(fd)
        if not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid() or info.st_mode & 0o077:
            raise APIError('NEEDS_REPAIR', 'Service identity is not a private regular file.')
        raw = os.read(fd, 4097)
    finally:
        os.close(fd)
    if len(raw) > 4096:
        raise APIError('NEEDS_REPAIR', 'Invalid service identity size.')
    try:
        signed = json.loads(raw)
        identity = signed['identity']
        encoded = json.dumps(identity, sort_keys=True, separators=(',', ':')).encode()
        expected = hmac.new(state.bootstrap_key(), b'atlas.service.v1:' + encoded, hashlib.sha256).hexdigest()
        directory = state.directory.stat()
        if not hmac.compare_digest(expected, signed['mac']) or identity['uid'] != os.getuid() or identity['port'] != port or identity['state_device'] != directory.st_dev or identity['state_inode'] != directory.st_ino:
            raise ValueError('Invalid signed identity')
        pid = identity['pid']
        if not isinstance(pid, int) or isinstance(pid, bool) or pid <= 1 or pid == os.getpid():
            raise ValueError('Invalid process identity')
        process = os.pidfd_open(pid, 0)
        try:
            current = _process_identity(pid)
            if any(current[key] != identity[key] for key in ('pid', 'start_ticks', 'uid', 'exe')):
                raise ValueError('Process incarnation changed')
            # A pidfd never retargets a reused numeric PID. No process-name lookup or kill().
            signal.pidfd_send_signal(process, signal.SIGTERM)
            poller = select.poll()
            poller.register(process, select.POLLIN)
            if not poller.poll(1000):
                signal.pidfd_send_signal(process, signal.SIGKILL)
                if not poller.poll(2000):
                    raise ValueError('Attested service did not exit')
        finally:
            os.close(process)
    except (KeyError, TypeError, ValueError, ProcessLookupError) as exc:
        raise APIError('NEEDS_REPAIR', 'Service identity is invalid or no longer matches a live process.') from exc


def launch_options():
    if os.name == 'nt':
        import subprocess
        return {'creationflags': subprocess.CREATE_NO_WINDOW | subprocess.CREATE_NEW_PROCESS_GROUP}
    return {'start_new_session': True}


if os.name == 'nt':
    from .windows_runtime import RuntimeLock, write_service_identity, stop_attested_service
