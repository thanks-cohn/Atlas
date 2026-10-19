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
    parser.add_argument('--tagging-fixtures', type=Path, help='Explicit pinned source benchmark JSON; evaluate photos through the installed EXE')
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
                proc = subprocess.run([json.loads(Path(receipt['manifest']).read_text())['path'], origin + '/'],
                    input=struct.pack('<I', len(frame)) + frame, env=env, capture_output=True, timeout=35)
                if proc.returncode:
                    # Only diagnostics for this disposable installed fixture. Never
                    # print native credentials, even when a malformed host fails.
                    details = {'returncode': proc.returncode, 'stderr': proc.stderr.decode(errors='replace')}
                    if len(proc.stdout) >= 4:
                        response_length = struct.unpack('<I', proc.stdout[:4])[0]
                        try:
                            response = json.loads(proc.stdout[4:4 + response_length])
                            details['native_state'] = response.get('state')
                        except (ValueError, AttributeError):
                            pass
                    # Files avoid an unbounded pipe-EOF wait if the onefile
                    # bootloader exits before its diagnostic service child.
                    with tempfile.TemporaryFile() as diagnostic_log:
                        diagnostic = subprocess.Popen([str(runtime), '--state-dir', str(private), 'serve'],
                            env=env, stdin=subprocess.DEVNULL, stdout=diagnostic_log, stderr=diagnostic_log)
                        try:
                            details['serve_exit'] = diagnostic.wait(timeout=8)
                        except subprocess.TimeoutExpired:
                            details['serve'] = 'Direct fixture remained running beyond eight seconds'
                            try:
                                stop_attested_service(state, 17892)
                            except Exception:
                                pass
                            if diagnostic.poll() is None:
                                diagnostic.terminate()
                                diagnostic.wait(timeout=3)
                        diagnostic_log.seek(0)
                        details['serve_diagnostic'] = diagnostic_log.read(8192).decode(errors='replace')
                    raise AssertionError('Native host failed: ' + json.dumps(details))
                length = struct.unpack('<I', proc.stdout[:4])[0]
                value = json.loads(proc.stdout[4:4+length])
                assert value['ok'] and value['port'] == 17892, 'Native bootstrap did not succeed'
                return value['token']
            token = connect()
            def request(path, body=None, credential=None):
                connection = http.client.HTTPConnection('127.0.0.1', 17892, timeout=120 if path == '/v1/tag-image' else 15)
                try:
                    connection.request('POST' if body is not None else 'GET', path,
                        json.dumps(body) if body is not None else None,
                        {'Origin':origin,'Authorization':'Bearer '+(credential or token),'Content-Type':'application/json'})
                    response = connection.getresponse(); data = json.loads(response.read())
                    return response.status, data
                finally:
                    connection.close()
            assert request('/v1/health')[1]['platform'] == 'windows'
            # Prove installed inference owns reusable copies; no dependency on
            # the original download directory or system Python/PATH.
            bundle_folders=[binary.parent/'tagging-engine',binary.parent/'tagging-models']
            hidden=[]
            try:
                for folder in bundle_folders:
                    held=folder.with_name(folder.name+'.hidden-probe')
                    folder.rename(held);hidden.append((folder,held))
                import base64,zlib
                def png_chunk(kind,data):
                    return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
                png=b'\x89PNG\r\n\x1a\n'+png_chunk(b'IHDR',struct.pack('>IIBBBBB',32,32,8,2,0,0,0))+png_chunk(b'IDAT',zlib.compress((b'\0'+b'\xff'*96)*32))+png_chunk(b'IEND',b'')
                code,predictions=request('/v1/tag-image',{'model':'objects','item_id':'synthetic-installed-probe',
                    'image':'data:image/png;base64,'+base64.b64encode(png).decode()})
                assert code==200 and predictions['run_id'],predictions
                assert predictions['resources']['peak_working_set_bytes']>0
                assert (private/'evidence/tagging-runs.jsonl').exists()
                cache_stamp=(private/'tagging-models/joytag.onnx').stat().st_mtime_ns
                print('PASS installed ONNX HTTP works with download folders unavailable, no Python PATH; worker peak bytes:',predictions['resources'])
                if args.tagging_fixtures:
                    import hashlib, io, urllib.request
                    from PIL import Image, ImageOps
                    fixtures=json.loads(args.tagging_fixtures.read_text())['fixtures']
                    photo_report={'schema':'atlas.windows.rich-photos.v1','transport':'installed EXE, authenticated HTTP, no Python PATH, original bundle folders unavailable','fixtures':[]}
                    report_path=binary.parent/'PHOTO_BENCHMARK.json'
                    for fixture in fixtures:
                        url=fixture['url'].replace('https://github.com/','https://raw.githubusercontent.com/').replace('/blob/','/')
                        with urllib.request.urlopen(url,timeout=30) as download:
                            raw=download.read(8*1024*1024+1)
                        assert len(raw)<=8*1024*1024 and hashlib.sha256(raw).hexdigest()==fixture['sha256'],'Fixture hash changed'
                        with Image.open(io.BytesIO(raw)) as opened:
                            photo=ImageOps.exif_transpose(opened).convert('RGB');photo.thumbnail((1280,1280))
                            buffer=io.BytesIO();photo.save(buffer,format='JPEG',quality=90)
                        image='data:image/jpeg;base64,'+base64.b64encode(buffer.getvalue()).decode()
                        sample={'id':fixture['id'],'url':fixture['url'],'sha256':fixture['sha256'],'runs':[]}
                        photo_report['fixtures'].append(sample)
                        for model in ('objects','people','anime'):
                            started=time.perf_counter()
                            code,result=request('/v1/tag-image',{'model':model,'item_id':'windows-photo:'+fixture['id'],'image':image})
                            assert code==200 and result['run_id'],(code,result)
                            sample['runs'].append({**{k:result[k] for k in ('source','model','model_version','model_sha256','run_id','suggestions','person_count','people','aggregation','policy','resources','components') if k in result},'seconds':time.perf_counter()-started})
                            report_path.write_text(json.dumps(photo_report,indent=2)+'\n')
                            if model=='objects':
                                assert len(result['predictions'])==4585 and len(result['suggestions'])>=5
                            if model=='people' and fixture.get('expected_people') is not None:
                                assert result['person_count']==fixture['expected_people'],(fixture['id'],result['person_count'])
                            if model=='anime':
                                baseline=next(x for x in fixture['runs'] if x['profile']=='legacy' and x['requested_model']=='anime')
                                expected={x['tag']:x['score'] for x in baseline['suggestions']}
                                actual={x['tag']:x['score'] for x in result['suggestions']}
                                assert expected.keys()==actual.keys() and all(abs(expected[k]-actual[k])<=.001 for k in expected),'JoyTag Windows/source parity changed'
                            print('PASS installed Windows photo HTTP:',fixture['id'],model,len(result['suggestions']),'tags',flush=True)
            finally:
                for folder,held in reversed(hidden):held.rename(folder)

            assert request('/v1/grants')[1]['grants'] and len(request('/v1/grants')[1]['grants']) == 2
            assert request('/v1/list', {'grant':src})[1]['entries'][0]['name'] == 'original.bin'
            operation = {'id':uuid.uuid4().hex,'action':'copy','sources':[{'grant':src,'path':'original.bin'}],
                         'destination':{'grant':dst,'path':''}}
            status, copied = request('/v1/operate', operation)
            assert status == 200 and copied['receipt']['status']=='completed', copied
            assert (target/'original.bin').read_bytes()==content and (source/'original.bin').read_bytes()==content
            assert request('/v1/operate', operation)[1]['replayed']
            print('PASS actual Windows installed .exe: native frame wakes helper, HTTP copy exact bytes, original intact, idempotent replay, no Python PATH.')
            def mutate(action, path=None, name=None, destination=None):
                body = {'id': uuid.uuid4().hex, 'action': action}
                if path is not None:
                    body['sources'] = [{'grant': dst, 'path': path}]
                if name is not None:
                    body['name'] = name
                if destination is not None:
                    body['destination'] = {'grant': dst, 'path': destination}
                status, result = request('/v1/operate', body)
                assert status == 200 and result['receipt']['status'] == 'completed', result
                return result['receipt']['results'][0]
            mutate('mkdir', name='organized', destination='')
            mutate('rename', 'original.bin', name='renamed.bin')
            mutate('move', 'renamed.bin', destination='organized')
            trash = mutate('trash', 'organized')
            assert not (target / 'organized').exists()
            mutate('restore', trash['trash_id'], destination='')
            assert (target / 'organized' / 'renamed.bin').read_bytes() == content
            # Preserve the initial copy receipt's target for subsequent replay checks.
            mutate('move', 'organized/renamed.bin', destination='')
            mutate('rename', 'renamed.bin', name='original.bin')
            print('PASS frozen HTTP mkdir, rename, move, recoverable directory trash and identity-bound restore.')
            previous = token
            stop_attested_service(state,17892)
            token = connect()
            assert request('/v1/health')[0] == 200
            assert request('/v1/health',credential=previous)[0] == 401
            assert len(request('/v1/grants')[1]['grants']) == 2
            assert request('/v1/operate',operation)[1]['replayed']
            print('PASS exact attested process restart, durable grants, credential rotation, no duplicate effect after recovery.')
            # Suspend only this disposable, identity-attested helper. This tests a
            # genuinely unresponsive Windows process, not a simulated HTTP error.
            import ctypes
            from ctypes import wintypes as w
            from atlas_companion.windows_runtime import _process_identity
            from atlas_companion.windows_state import windows_api
            signed = json.loads(state._guard.read('service.identity', 4096))
            identity = signed['identity']
            kernel, _ = windows_api()
            kernel.OpenProcess.argtypes = [w.DWORD, w.BOOL, w.DWORD]
            kernel.OpenProcess.restype = w.HANDLE
            handle = kernel.OpenProcess(0x1000 | 0x0800, False, identity['pid'])
            assert handle, 'Could not open disposable helper for suspension'
            try:
                actual = _process_identity(handle, identity['pid'])
                assert all(identity[k] == actual[k] for k in actual)
                ntdll = ctypes.WinDLL('ntdll', use_last_error=True)
                ntdll.NtSuspendProcess.argtypes = [w.HANDLE]
                ntdll.NtSuspendProcess.restype = w.LONG
                assert ntdll.NtSuspendProcess(handle) >= 0
            finally:
                kernel.CloseHandle(handle)
            token = connect()
            assert request('/v1/health')[0] == 200
            assert request('/v1/operate', operation)[1]['replayed']
            assert (target / 'original.bin').read_bytes() == content
            print('PASS real suspended Windows helper recovered by native demand wake; durable receipt prevents duplicate copy.')
            upgraded = subprocess.run([str(binary), 'install', '--extension-id', extension, '--consent', '--upgrade',
                '--state-dir', str(private), '--install-dir', str(app)], env=env, capture_output=True, timeout=45)
            assert upgraded.returncode == 0, upgraded.stderr.decode(errors='replace')
            assert (private/'tagging-models/joytag.onnx').stat().st_mtime_ns==cache_stamp, 'Repair recopied unchanged model data'
            token = connect()
            assert len(request('/v1/grants')[1]['grants']) == 2
            assert request('/v1/operate', operation)[1]['replayed']
            print('PASS live installed native executable upgrade safely stops its attested helper and preserves grants and receipts.')
            startup = subprocess.run([str(runtime),'supervise','--state-dir',str(private),'--extension-id',extension,'enable','--consent'],
                                     env=env,capture_output=True,timeout=30)
            assert startup.returncode == 0, startup.stderr.decode(errors='replace')
            from atlas_companion.windows_runtime import RuntimeLock
            from atlas_companion.security import APIError
            from atlas_companion.supervisor import health
            deadline = time.monotonic() + 20
            while True:
                try:
                    with RuntimeLock(state, 'supervisor'):
                        pass
                except APIError as exc:
                    assert exc.code == 'ALREADY_RUNNING'
                    break
                assert time.monotonic() < deadline, 'Enabled supervisor never acquired its private mutex'
                time.sleep(0.2)
            stop_attested_service(state, 17892)
            deadline = time.monotonic() + 40
            while True:
                try:
                    if health(state, origin, 17892):
                        break
                except (OSError, ValueError, http.client.HTTPException):
                    pass
                if time.monotonic() >= deadline:
                    from atlas_companion.diagnostics import snapshot
                    raise AssertionError('Supervisor did not restore the failed helper: ' + json.dumps(snapshot(state)))
                time.sleep(0.3)
            token = connect()
            # Reproduce the recovery race deterministically: a supervisor can
            # have observed failed health before a browser finishes reconnecting.
            # Its later proof/wake must leave that browser credential usable.
            from atlas_native.__main__ import connect as recovery_connect
            recovered = recovery_connect(state, origin, issue_token=False)
            assert recovered['ok'] and 'token' not in recovered
            code, grants = request('/v1/grants')
            assert code == 200 and len(grants['grants']) == 2, (code, grants)
            print('PASS opt-in installed supervisor immediately starts and automatically restores an attested failed helper.')
            disabled = subprocess.run([str(runtime),'supervise','--state-dir',str(private),'--extension-id',extension,'disable'],
                                      env=env,capture_output=True,timeout=30)
            assert disabled.returncode == 0, disabled.stderr.decode(errors='replace')
            deadline = time.monotonic() + 15
            while True:
                try:
                    with RuntimeLock(state, 'supervisor'):
                        break
                except APIError as exc:
                    assert exc.code == 'ALREADY_RUNNING'
                assert time.monotonic() < deadline, 'Disabled supervisor did not release its private mutex'
                time.sleep(0.2)
            state.revoke_grant(src)
            stop_attested_service(state,17892);token=connect()
            assert request('/v1/list',{'grant':src})[0] == 403
            print('PASS per-user Run opt-in/disable and revoked location remains denied after restart.')
            removed=uninstall(app)
            assert removed['state_preserved'] and private.exists()
            assert not state.known_origin(origin)
            print('PASS owned uninstall removes registration, revokes enrollment and preserves user data.')
        finally:
            from atlas_companion.diagnostics import snapshot
            (binary.parent/'SUPERVISOR_DIAGNOSTICS.json').write_text(json.dumps(snapshot(state),indent=2)+'\n')
            try:
                from atlas_companion.windows_supervisor import startup as supervision
                supervision(state, extension, 17892, 'disable', install_dir=app)
            except Exception:
                pass
            try:
                stop_attested_service(state,17892)
            except Exception:
                pass
            state.close()
    print('NOT_RUN actual Chrome callback, Windows10/11 desktop sleep/hibernate/reboot or publisher signing.')


if __name__=='__main__':
    main()
