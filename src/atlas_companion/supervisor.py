"""Optional Linux per-user recovery. Never pairs, grants, or kills unknown processes."""
import argparse
import hashlib
import hmac
import http.client
import json
import os
from pathlib import Path
import re
import secrets
import signal
import subprocess
import sys
import threading
import time

from .runtime import RuntimeLock, child_environment
from .entrypoint import command
from .security import APIError, require_platform, open_absolute_directory
from .state import State

UNIT = 'atlas-supervisor.service'


def health(state, origin, port):
    """No bearer credentials: fresh private-key proof authenticates the server."""
    nonce = secrets.token_hex(32)
    expected = hmac.new(state.bootstrap_key(), f'atlas.native.v1:{nonce}:{port}'.encode(), hashlib.sha256).hexdigest()
    connection = http.client.HTTPConnection('127.0.0.1', port, timeout=2)
    try:
        data = json.dumps({'nonce': nonce}).encode()
        connection.request('POST', '/v1/bootstrap-proof', data, {'Origin': origin, 'Content-Type': 'application/json'})
        response = connection.getresponse()
        body = response.read(4097)
        if response.status != 200 or len(body) > 4096:
            return False
        result = json.loads(body)
        return isinstance(result.get('proof'), str) and hmac.compare_digest(expected, result['proof'])
    finally:
        connection.close()


class Supervisor:
    """One bounded probe per tick; owns only children returned by its own Popen."""
    def __init__(self, state, extension_id, port=17892, interval=10):
        if not re.fullmatch('[a-p]{32}', extension_id):
            raise ValueError('Expected exact Chrome extension ID')
        if not 1 <= port <= 65535 or interval < 0.1:
            raise ValueError('Invalid supervisor limits')
        self.state, self.origin, self.port = state, 'chrome-extension://' + extension_id, port
        self.interval = interval
        self.child = None
        self.failures = 0
        self.last_status = 'STARTING'
        self.next_start = 0
        self.child_started = 0

    def _spawn(self):
        # These arguments are fixed from trusted CLI configuration; no shell, no user content.
        env = child_environment()
        self.child = subprocess.Popen(command('--state-dir', str(self.state.directory), 'serve', '--port', str(self.port)),
                                      stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                      close_fds=True, env=env)
        self.child_started = time.monotonic()

    def step(self):
        if self.child is not None and self.child.poll() is not None:
            self.child.wait()
            self.child = None
        if not self.state.known_origin(self.origin):
            self.last_status = 'NEEDS_PAIRING'
            return self.last_status
        try:
            ready = health(self.state, self.origin, self.port)
            missing = False
        except ConnectionRefusedError:
            ready, missing = False, True
        except (OSError, ValueError, http.client.HTTPException):
            ready, missing = False, False
        if ready:
            self.failures = 0
            self.next_start = 0
            self.last_status = 'READY'
            return self.last_status
        self.failures = min(self.failures + 1, 6)
        now = time.monotonic()
        # Only reap/terminate a still-owned direct child. Popen prevents PID reuse via waitpid.
        if self.child is not None and self.failures >= 3 and now - self.child_started >= 5:
            self.child.terminate()
            try:
                self.child.wait(timeout=2)
            except subprocess.TimeoutExpired:
                self.child.kill()
                self.child.wait(timeout=2)
            self.child = None
            missing = True
        if missing and self.child is None and now >= self.next_start:
            self._spawn()
            self.next_start = now + min(60, 2 ** self.failures)
            self.last_status = 'STARTING'
        else:
            self.last_status = 'STARTING' if self.child is not None else 'NEEDS_REPAIR'
        return self.last_status

    def run(self, stop=None):
        stop = stop or threading.Event()
        with RuntimeLock(self.state, 'supervisor'):
            observed = None
            while not stop.is_set():
                self.step()
                if self.last_status != observed:
                    print(json.dumps({'component': 'atlas.supervisor', 'state': self.last_status}), flush=True)
                    observed = self.last_status
                delay = 1 if self.last_status == 'STARTING' and self.child is not None else min(60, self.interval * (2 ** min(self.failures, 3)))
                stop.wait(delay)
        # Intentionally leave the file companion alive: turning supervision off must not break use.


def unit_text(state, extension_id, port):
    def quoted(value, expand_dollars=True):
        # systemd ExecStart quoting, including literal percent specifiers and dollar expansion.
        value = str(value)
        if '\n' in value or '\r' in value or '\x00' in value:
            raise ValueError('Unsupported newline in startup path')
        escaped = value.replace('\\', '\\\\').replace('"', '\\"').replace('%', '%%')
        if expand_dollars:
            escaped = escaped.replace('$', '$$')
        return '"' + escaped + '"'
    source = Path(__file__).resolve().parents[1]
    argv = command('supervise', '--state-dir', str(state.directory),
                   '--extension-id', extension_id, '--port', str(port), 'run')
    return ('[Unit]\nDescription=ATLAS optional per-user recovery supervisor\n\n[Service]\nType=simple\n'
            + 'Environment=' + quoted('PYTHONPATH=' + str(source), False) + '\nExecStart=' + ' '.join(quoted(x) for x in argv)
            + '\nRestart=on-failure\nRestartSec=15\nKillMode=process\nUMask=0077\nNoNewPrivileges=true\n\n[Install]\nWantedBy=default.target\n')


def systemctl(*args):
    result = subprocess.run(['systemctl', '--user', *args], stdin=subprocess.DEVNULL, capture_output=True, timeout=15)
    if result.returncode:
        raise ValueError('Per-user systemd unavailable or operation failed; inspect systemctl --user status atlas-supervisor.service')
    return result


def startup(state, extension_id, port, action, consent=False, unit_dir=None):
    if not isinstance(extension_id, str) or not re.fullmatch('[a-p]{32}', extension_id):
        raise ValueError('Expected exact Chrome extension ID')
    if not isinstance(port, int) or not 1 <= port <= 65535:
        raise ValueError('Invalid companion port')
    directory = unit_dir or Path(os.environ.get('XDG_CONFIG_HOME', str(Path.home() / '.config'))) / 'systemd/user'
    path = directory / UNIT
    if action == 'enable':
        if not consent:
            raise ValueError('Explicit --consent required for per-user login startup')
        if not state.known_origin('chrome-extension://' + extension_id):
            raise ValueError('Pair the exact extension before enabling supervision')
        directory.mkdir(parents=True, exist_ok=True, mode=0o700)
        descriptor = open_absolute_directory(str(directory.absolute()))
        try:
            info = os.fstat(descriptor)
            if info.st_uid != os.getuid() or info.st_mode & 0o022:
                raise ValueError('Startup directory must be owned by this user and not writable by others')
        finally:
            os.close(descriptor)
        if path.is_symlink():
            raise ValueError('Startup unit cannot be a symlink')
        text = unit_text(state, extension_id, port)
        if path.exists() and path.read_text() != text:
            raise ValueError('Existing startup unit differs; inspect and uninstall it explicitly first')
        if not path.exists():
            fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
            with os.fdopen(fd, 'w') as stream:
                stream.write(text)
        systemctl('daemon-reload')
        systemctl('enable', '--now', UNIT)
        return {'status': 'ENABLED', 'unit': str(path)}
    if action in ('disable', 'uninstall'):
        if not path.exists() and not path.is_symlink():
            return {'status': 'DISABLED', 'state_preserved': True, 'demand_wake': 'independent'}
        if path.is_symlink():
            raise ValueError('Startup unit cannot be a symlink')
        if path.exists() and path.read_text() != unit_text(state, extension_id, port):
            raise ValueError('Startup unit does not match this installation; refusing to change it')
        systemctl('disable', '--now', UNIT)
        if action == 'uninstall' and path.exists():
            path.unlink()
            systemctl('daemon-reload')
        return {'status': 'DISABLED', 'state_preserved': True, 'demand_wake': 'independent'}
    result = subprocess.run(['systemctl', '--user', 'is-active', UNIT], capture_output=True, timeout=15)
    return {'status': 'ACTIVE' if result.returncode == 0 else 'INACTIVE', 'unit_installed': path.is_file()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state-dir', default=str(Path(os.environ.get('XDG_DATA_HOME', str(Path.home() / '.local/share'))) / 'atlas'))
    parser.add_argument('--extension-id', required=True)
    parser.add_argument('--port', type=int, default=17892)
    parser.add_argument('--interval', type=float, default=10)
    parser.add_argument('action', choices=['run', 'enable', 'disable', 'status', 'uninstall'])
    parser.add_argument('--consent', action='store_true')
    args = parser.parse_args()
    try:
        require_platform()
        state = State(args.state_dir)
        worker = Supervisor(state, args.extension_id, args.port, args.interval)
        if args.action == 'run':
            stop = threading.Event()
            for sig in (signal.SIGTERM, signal.SIGINT):
                signal.signal(sig, lambda *_: stop.set())
            worker.run(stop)
        else:
            print(json.dumps(startup(state, args.extension_id, args.port, args.action, args.consent)))
        return 0
    except (APIError, OSError, ValueError, subprocess.SubprocessError) as exc:
        print('ATLAS supervisor: ' + str(exc), file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
