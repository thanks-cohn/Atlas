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


def startup(state, extension_id, port, action, consent=False):
    if not re.fullmatch('[a-p]{32}', extension_id) or not 1 <= port <= 65535:
        raise ValueError('Invalid extension identity or port')
    from .windows_install import installation_directory
    receipt = installation_directory() / 'installation.json'
    # Use the installed immutable runtime, never the downloaded/setup path.
    if receipt.is_file():
        data = json.loads(receipt.read_text(encoding='utf-8'))
        argv = [data['runtime'], 'supervise', '--state-dir', str(state.directory), '--extension-id', extension_id, '--port', str(port), 'run']
    else:
        argv = command('supervise', '--state-dir', str(state.directory), '--extension-id', extension_id, '--port', str(port), 'run')
    text = subprocess.list2cmdline(argv)
    current = _run_value()
    if action == 'enable':
        if not consent:
            raise ValueError('Explicit --consent required for login startup')
        if not receipt.is_file() or not state.known_origin('chrome-extension://' + extension_id):
            raise ValueError('Install and pair the exact extension first')
        if current is not None and current != text:
            raise ValueError('Existing login startup differs; refusing to replace it')
        _run_value(text)
        return {'status': 'ENABLED_AT_NEXT_LOGON', 'demand_wake': 'independent'}
    if action in ('disable', 'uninstall'):
        if current is not None and current != text:
            raise ValueError('Existing login startup differs; refusing to remove it')
        if current is not None:
            _run_value(remove=True)
        # Cooperative private stop marker; no PID/name based process killing.
        (Path(state.directory) / 'supervisor.stop').touch()
        return {'status': 'DISABLED', 'state_preserved': True, 'demand_wake': 'independent'}
    return {'status': 'ENABLED' if current == text else 'DISABLED', 'running': 'UNKNOWN'}


class Supervisor(BaseSupervisor):
    def _spawn(self):
        from .windows_runtime import child_environment
        self.child = subprocess.Popen(command('--state-dir', str(self.state.directory), 'serve', '--port', str(self.port)),
                                      stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                      env=child_environment(), creationflags=subprocess.CREATE_NO_WINDOW)
        import time
        self.child_started = time.monotonic()

    def run(self, stop=None):
        from .windows_runtime import RuntimeLock
        stop = stop or threading.Event()
        marker = Path(self.state.directory) / 'supervisor.stop'
        with RuntimeLock(self.state, 'supervisor'):
            marker.unlink(missing_ok=True)
            while not stop.is_set() and not marker.exists():
                self.step()
                stop.wait(1 if self.last_status == 'STARTING' else min(60, self.interval * 2 ** min(self.failures, 3)))


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
    if args.action == 'run':
        Supervisor(state, args.extension_id, args.port, args.interval).run()
    else:
        print(json.dumps(startup(state, args.extension_id, args.port, args.action, args.consent)))
    return 0
