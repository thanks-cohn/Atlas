#!/usr/bin/env python3
"""Actual Windows standalone/native/HTTP acceptance with disposable authorized roots."""
import argparse
import http.client
import json
import os
from pathlib import Path
import socket
import struct
import subprocess
import sys
import tempfile
import time
import uuid

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'src'))


def main():
    if os.name != 'nt':
        raise SystemExit('Requires an actual Windows kernel.')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('binary', type=Path)
    args = parser.parse_args()
    from atlas_companion.windows_state import WindowsState
    from atlas_companion.windows_runtime import stop_attested_service
    from atlas_companion.windows_install import uninstall
    binary = args.binary.absolute()
    extension = 'e' * 32
    origin = 'chrome-extension://' + extension
    with socket.socket() as probe:
        probe.bind(('127.0.0.1', 17892))
    with tempfile.TemporaryDirectory(prefix='atlas-windows-installed-') as folder:
        base = Path(folder)
        app = base / 'installed app'; private = base / 'private state'
        source = base / 'source files'; target = base / 'destination files'
        source.mkdir(); target.mkdir(); content = bytes(range(256)) * 40
        (source / 'original.bin').write_bytes(content)
        env = dict(os.environ)
        for name in ('PYTHONPATH', 'PYTHONHOME', 'TCL_LIBRARY', 'TK_LIBRARY'):
            env.pop(name, None)
        env['PATH'] = str(Path(os.environ['SystemRoot']) / 'System32')
        install = subprocess.run([str(binary), 'install', '--extension-id', extension, '--consent',
                                  '--state-dir', str(private), '--install-dir', str(app)], env=env,
                                 capture_output=True, timeout=60)
        if install.returncode:
            raise AssertionError('Windows installer failed: ' + install.stderr.decode(errors='replace'))
        receipt = json.loads((app / 'installation.json').read_text())
        runtime = Path(receipt['runtime'])
        state = WindowsState(private)
        token = None
        try:
            assert state.grants() == [], 'Installation implicitly granted a root'
            src = state.grant(source, writable=True); dst = state.grant(target, writable=True)
            def connect():
                frame = b'{"action":"connect"}'
                proc = subprocess.run([str(app / 'atlas-native.exe'), origin + '/'],
                    input=struct.pack('<I', len(frame)) + frame, env=env, capture_output=True, timeout=35)
                assert proc.returncode == 0, 'Native host failed: ' + proc.stderr.decode(errors='replace')
                length = struct.unpack('<I', proc.stdout[:4])[0]
                value = json.loads(proc.stdout[4:4+length])
                assert value['ok'] and value['port'] == 17892, 'Native bootstrap did not succeed'
                return value['token']
            token = connect()
            def request(path, body=None, credential=None):
                connection = http.client.HTTPConnection('127.0.0.1', 17892, timeout=15)
                try:
                    connection.request('POST' if body is not None else 'GET', path,
                        json.dumps(body) if body is not None else None,
                        {'Origin':origin,'Authorization':'Bearer '+(credential or token),'Content-Type':'application/json'})
                    response = connection.getresponse(); data = json.loads(response.read())
                    return response.status, data
                finally:
                    connection.close()
            assert request('/v1/health')[1]['platform'] == 'windows'
            assert request('/v1/grants')[1]['grants'] and len(request('/v1/grants')[1]['grants']) == 2
            assert request('/v1/list', {'grant':src})[1]['entries'][0]['name'] == 'original.bin'
            operation = {'id':uuid.uuid4().hex,'action':'copy','sources':[{'grant':src,'path':'original.bin'}],
                         'destination':{'grant':dst,'path':''}}
            status, copied = request('/v1/operate', operation)
            assert status == 200 and copied['receipt']['status']=='completed', copied
            assert (target/'original.bin').read_bytes()==content and (source/'original.bin').read_bytes()==content
            assert request('/v1/operate', operation)[1]['replayed']
            print('PASS actual Windows installed .exe: native frame wakes helper, HTTP copy exact bytes, original intact, idempotent replay, no Python PATH.')
            previous = token
            stop_attested_service(state,17892)
            token = connect()
            assert request('/v1/health')[0] == 200
            assert request('/v1/health',credential=previous)[0] == 401
            assert len(request('/v1/grants')[1]['grants']) == 2
            assert request('/v1/operate',operation)[1]['replayed']
            print('PASS exact attested process restart, durable grants, credential rotation, no duplicate effect after recovery.')
            startup = subprocess.run([str(runtime),'supervise','--state-dir',str(private),'--extension-id',extension,'enable','--consent'],
                                     env=env,capture_output=True,timeout=30)
            assert startup.returncode == 0, startup.stderr.decode(errors='replace')
            disabled = subprocess.run([str(runtime),'supervise','--state-dir',str(private),'--extension-id',extension,'disable'],
                                      env=env,capture_output=True,timeout=30)
            assert disabled.returncode == 0, disabled.stderr.decode(errors='replace')
            state.revoke_grant(src)
            stop_attested_service(state,17892);token=connect()
            assert request('/v1/list',{'grant':src})[0] == 403
            print('PASS per-user Run opt-in/disable and revoked location remains denied after restart.')
            stop_attested_service(state,17892)
            removed=uninstall(app)
            assert removed['state_preserved'] and private.exists()
            assert not state.known_origin(origin)
            print('PASS owned uninstall removes registration, revokes enrollment and preserves user data.')
        finally:
            try:
                stop_attested_service(state,17892)
            except Exception:
                pass
            state.close()
    print('NOT_RUN actual Chrome callback, Windows10/11 desktop sleep/hibernate/reboot or publisher signing.')


if __name__=='__main__':
    main()
