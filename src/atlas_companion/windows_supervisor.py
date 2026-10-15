"""Opt-in per-user Windows recovery; demand wake remains independent."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import threading

from .entrypoint import command
from .supervisor import Supervisor as BaseSupervisor

RUN_KEY = r'Software\Microsoft\Windows\CurrentVersion\Run'
RUN_VALUE = 'AtlasCompanionSupervisor'


def _run_value(value=None, remove=False):
    import winreg
    with winreg.CreateKeyEx(winreg.HKEY_CURRENT_USER, RUN_KEY, 0, winreg.KEY_READ | winreg.KEY_SET_VALUE) as key:
        if remove:
            try:
                winreg.DeleteValue(key, RUN_VALUE)
            except FileNotFoundError:
                pass
        elif value is not None:
            winreg.SetValueEx(key, RUN_VALUE, 0, winreg.REG_SZ, value)
        else:
            try:
                return winreg.QueryValueEx(key, RUN_VALUE)[0]
            except FileNotFoundError:
                return None


def _installed_runtime(state, extension_id, install_dir=None):
    from .windows_install import installation_directory, _registration, _registry, _digest
    candidates = [Path(install_dir)] if install_dir else [installation_directory()]
    if install_dir is None:
        for browser in ('chrome', 'chromium'):
            manifest = _registration(_registry(browser))
            if manifest:
                candidates.append(Path(manifest).parent)
    for directory in dict.fromkeys(path.absolute() for path in candidates):
        receipt = directory / 'installation.json'
        if receipt.is_symlink() or not receipt.is_file():
            continue
        data = json.loads(receipt.read_text(encoding='utf-8'))
        if data.get('extension_id') != extension_id or os.path.normcase(os.path.abspath(data.get('state_dir', ''))) != os.path.normcase(os.path.abspath(state.directory)):
            continue
        runtime = Path(data['runtime'])
        if runtime.parent != directory or runtime.is_symlink() or not runtime.is_file() or _digest(runtime) != data.get('runtime_sha256'):
            raise ValueError('Installed supervisor runtime failed receipt verification')
        return runtime
    raise ValueError('No matching installed runtime for this state and extension')


def startup(state, extension_id, port, action, consent=False, install_dir=None):
    if not re.fullmatch('[a-p]{32}', extension_id) or port != 17892:
        raise ValueError('Invalid extension identity or port')
    if action not in ('enable', 'disable', 'uninstall', 'status'):
        raise ValueError('Invalid startup action')
    if action == 'enable' and not consent:
        raise ValueError('Explicit --consent required for login startup')
    current = _run_value()
    if current is None and action in ('disable', 'uninstall', 'status'):
        if action != 'status':
            (Path(state.directory) / 'supervisor.stop').touch()
        return {'status': 'DISABLED', 'state_preserved': True, 'demand_wake': 'independent'}
    runtime = _installed_runtime(state, extension_id, install_dir)
    argv = [str(runtime), 'supervise', '--state-dir', str(state.directory), '--extension-id', extension_id, '--port', str(port), 'run']
    text = subprocess.list2cmdline(argv)
    if action == 'enable':
        if not state.known_origin('chrome-extension://' + extension_id):
            raise ValueError('Pair the exact extension first')
        if current is not None and current != text:
            raise ValueError('Existing login startup differs; refusing to replace it')
        from .windows_runtime import child_environment
        # The child arbitrates using its private Windows mutex. A second enable
        # cannot create a second worker; launch never uses a shell.
        marker = Path(state.directory) / 'supervisor.stop'
        marker.unlink(missing_ok=True)
        _run_value(text)
        try:
            subprocess.Popen(argv, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                             env=child_environment(), creationflags=subprocess.CREATE_NO_WINDOW)
        except Exception:
            _run_value(remove=True) if current is None else _run_value(current)
            raise
        return {'status': 'ENABLED', 'startup': 'LAUNCHED', 'demand_wake': 'independent'}
    if current != text:
        raise ValueError('Existing login startup differs; refusing to change it')
    if action in ('disable', 'uninstall'):
        _run_value(remove=True)
        (Path(state.directory) / 'supervisor.stop').touch()
        return {'status': 'DISABLED', 'state_preserved': True, 'demand_wake': 'independent'}
    return {'status': 'ENABLED', 'running': 'UNKNOWN'}


class Supervisor(BaseSupervisor):
    def step(self):
        import http.client
        import time
        from .supervisor import health
        from .security import APIError
        if self.port != 17892:
            raise ValueError('Windows native recovery uses the fixed companion port 17892')
        if not self.state.known_origin(self.origin):
            self.last_status = 'NEEDS_PAIRING'
            return self.last_status
        try:
            ready = health(self.state, self.origin, self.port)
        except (OSError, ValueError, http.client.HTTPException):
            ready = False
        if ready:
            self.failures = 0
            self.next_start = 0
            self.last_status = 'READY'
            return self.last_status
        self.failures = min(self.failures + 1, 6)
        self.last_status = 'NEEDS_REPAIR'
        now = time.monotonic()
        if now >= self.next_start:
            self.next_start = now + min(60, 2 ** self.failures)
            from atlas_native.__main__ import connect
            try:
                # Shared wake arbitration and handle-attested recovery account for
                # frozen bootloader children. Discard bootstrap credentials.
                connect(self.state, self.origin)
                self.last_status = 'READY'
                self.failures = 0
            except (APIError, OSError, ValueError, http.client.HTTPException):
                pass
        return self.last_status

    def run(self, stop=None):
        from .windows_runtime import RuntimeLock
        stop = stop or threading.Event()
        marker = Path(self.state.directory) / 'supervisor.stop'
        with RuntimeLock(self.state, 'supervisor'):
            while not stop.is_set() and not marker.exists():
                self.step()
                delay = 1 if self.last_status == 'STARTING' else min(60, self.interval * 2 ** min(self.failures, 3))
                import time
                deadline = time.monotonic() + delay
                while not marker.exists() and not stop.is_set() and time.monotonic() < deadline:
                    stop.wait(min(0.25, max(0, deadline - time.monotonic())))


def main(argv=None):
    from .windows_state import WindowsState
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state-dir', default=str(Path(os.environ['LOCALAPPDATA']) / 'Atlas'))
    parser.add_argument('--extension-id', required=True)
    parser.add_argument('--port', type=int, default=17892)
    parser.add_argument('--interval', type=float, default=10)
    parser.add_argument('--consent', action='store_true')
    parser.add_argument('action', choices=['run', 'enable', 'disable', 'uninstall', 'status'])
    args = parser.parse_args(argv)
    state = WindowsState(args.state_dir)
    try:
        if args.action == 'run':
            Supervisor(state, args.extension_id, args.port, args.interval).run()
        else:
            print(json.dumps(startup(state, args.extension_id, args.port, args.action, args.consent)))
    finally:
        state.close()
    return 0
