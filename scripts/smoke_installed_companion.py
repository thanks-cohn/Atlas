#!/usr/bin/env python3
"""Verify frozen user installation outside checkout with Python absent from PATH.

Creates only disposable user data. Native process framing is real; this is not
an actual Chrome or systemd/user-login lifecycle test. Fixed port must be free.
"""
import argparse
import http.client
import json
import os
from pathlib import Path
import socket
import signal
import struct
import subprocess
import tempfile
import time
import uuid


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('binary', type=Path)
    parser.add_argument('--wake', action='store_true', help='Let the installed native host start the companion; prove survival after native parent exits')
    args = parser.parse_args()
    binary = args.binary.absolute()
    with socket.socket() as probe:
        probe.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        probe.bind(('127.0.0.1', 17892))
    with tempfile.TemporaryDirectory(prefix='atlas frozen installation ') as folder:
        base = Path(folder)
        state = base / 'private state'
        app = base / 'installed app'
        env = {k: v for k, v in os.environ.items() if k not in
               ('PYTHONPATH', 'PYTHONHOME', 'LD_LIBRARY_PATH', 'TCL_LIBRARY', 'TK_LIBRARY') and not k.startswith('_PYI')}
        env.update({'PATH': '/no-python-or-tools', 'XDG_DATA_HOME': str(base / 'xdg data'),
                    'XDG_CONFIG_HOME': str(base / 'xdg config'), 'PYINSTALLER_RESET_ENVIRONMENT': '1'})
        extension = 'e' * 32
        origin = 'chrome-extension://' + extension
        result = subprocess.run([str(binary), 'install', '--extension-id', extension, '--consent',
                                 '--state-dir', str(state), '--install-dir', str(app)],
                                cwd='/tmp', env=env, capture_output=True, text=True, timeout=30)
        assert result.returncode == 0, result.stderr
        receipt = json.loads((app / 'installation.json').read_text())
        assert receipt['mode'] == 'standalone-linux'
        assert str(binary.parent) not in (app / 'atlas-native').read_text()
        launcher = str(app / 'atlas')
        initial = subprocess.run([launcher, 'grants'], env=env, cwd='/tmp', capture_output=True, text=True, timeout=15)
        assert initial.returncode == 0 and json.loads(initial.stdout) == {'grants': []}
        granted = base / 'authorized files'
        granted.mkdir()
        (granted / 'source.txt').write_bytes(b'installed binary filesystem proof\x00\n')
        (granted / 'destination').mkdir()
        grant_run = subprocess.run([launcher, 'grant', str(granted), '--write'], env=env, cwd='/tmp',
                                   capture_output=True, text=True, timeout=15)
        assert grant_run.returncode == 0, grant_run.stderr
        grant = json.loads(grant_run.stdout)['grant']
        server = None if args.wake else subprocess.Popen([launcher, 'serve'], env=env, cwd='/tmp', stdout=subprocess.PIPE,
                                  stderr=subprocess.PIPE, text=True)
        owned_pidfds = []
        try:
            deadline = time.monotonic() + 15
            while server is not None:
                if server.poll() is not None:
                    raise AssertionError(server.stderr.read())
                try:
                    with socket.create_connection(('127.0.0.1', 17892), timeout=.2):
                        break
                except OSError:
                    if time.monotonic() > deadline:
                        raise AssertionError('Installed server failed to start')
                    time.sleep(.1)
            message = b'{"action":"connect"}'
            native = subprocess.run([str(app / 'atlas-native'), origin + '/'],
                                    input=struct.pack('<I', len(message)) + message,
                                    env=env, cwd='/tmp', capture_output=True, timeout=20)
            assert native.returncode == 0, native.stderr
            size = struct.unpack('<I', native.stdout[:4])[0]
            response = json.loads(native.stdout[4:4 + size])
            assert response['ok'] and response['protocol'] == 'atlas.local.v1', response
            if args.wake:
                # Only this fixture's unique immutable executable AND private state
                # identify children. pidfds pin identity against PID reuse.
                for process in Path('/proc').iterdir():
                    if not process.name.isdigit():
                        continue
                    try:
                        commandline = (process / 'cmdline').read_bytes().split(b'\0')
                        if str(state).encode() in commandline and b'serve' in commandline and os.path.samefile(process / 'exe', receipt['runtime']):
                            owned_pidfds.append(os.pidfd_open(int(process.name)))
                    except (OSError, ValueError):
                        pass
                assert owned_pidfds, 'Native child did not survive parent exit'
            token = response['token']
            def request(path, body):
                connection = http.client.HTTPConnection('127.0.0.1', 17892, timeout=5)
                try:
                    connection.request('POST', path, json.dumps(body),
                                       {'Origin': origin, 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'})
                    result = connection.getresponse()
                    value = json.loads(result.read())
                    assert result.status == 200, value
                    return value
                finally:
                    connection.close()
            listing = request('/v1/list', {'grant': grant})
            assert 'source.txt' in {e['name'] for e in listing['entries']}
            copied = request('/v1/operate', {'id': uuid.uuid4().hex, 'action': 'copy',
                             'sources': [{'grant': grant, 'path': 'source.txt'}],
                             'destination': {'grant': grant, 'path': 'destination'}})
            assert copied['receipt']['status'] == 'completed', copied
            assert (granted / 'destination/source.txt').read_bytes() == (granted / 'source.txt').read_bytes()
            print(json.dumps({'status': 'PASS', 'runtime': 'standalone-linux', 'checkout_independent': True,
                              'python_absent_from_PATH': True, 'spaced_install_path': True,
                              'real_native_frame': True, 'real_http_byte_exact_copy': True,
                              'native_wake_survives_parent_exit': args.wake,
                              'no_implicit_root_grants': True,
                              'not_run': ['Chrome runtime', 'cold-machine ABI compatibility', 'OS login/systemd', 'Windows']}, indent=2))
        finally:
            if server is not None:
                server.terminate()
                try:
                    server.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    server.kill()
                    server.wait(timeout=5)
            if args.wake and not owned_pidfds:
                # Failure paths still reap only this fixture's uniquely named runtime.
                for process in Path('/proc').iterdir():
                    if not process.name.isdigit():
                        continue
                    try:
                        commandline = (process / 'cmdline').read_bytes().split(b'\0')
                        if str(state).encode() in commandline and b'serve' in commandline and os.path.samefile(process / 'exe', receipt['runtime']):
                            owned_pidfds.append(os.pidfd_open(int(process.name)))
                    except (OSError, ValueError):
                        pass
            for descriptor in owned_pidfds:
                try:
                    signal.pidfd_send_signal(descriptor, signal.SIGTERM)
                except ProcessLookupError:
                    pass
                finally:
                    os.close(descriptor)


if __name__ == '__main__':
    main()
