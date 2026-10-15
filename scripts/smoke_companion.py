#!/usr/bin/env python3
"""Independent Linux CLI + real HTTP + byte-level filesystem acceptance smoke.

Uses only disposable temporary fixtures; no existing grants or personal files.
Does not claim a browser, installer, or Windows runtime test.
"""
import json
from pathlib import Path
import subprocess
import tempfile
import urllib.error
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]
EXTENSION = 'a' * 32
ORIGIN = 'chrome-extension://' + EXTENSION


def main():
    with tempfile.TemporaryDirectory(prefix='atlas-smoke-') as temporary:
        base = Path(temporary)
        root = base / 'files'
        root.mkdir()
        (root / 'destination').mkdir()
        (root / 'original.txt').write_bytes(b'ATLAS\x00real file bytes\n')
        outside = base / 'outside.txt'
        outside.write_bytes(b'not authorized')
        (root / 'escape').symlink_to(outside)
        launcher = [str(ROOT / 'scripts/run_companion.sh'), '--state-dir', str(base / 'state')]
        grant = json.loads(subprocess.check_output(launcher + ['grant', str(root), '--write'], text=True))['grant']
        token = subprocess.check_output(launcher + ['pair', '--extension-id', EXTENSION], text=True).strip().splitlines()[-1]
        process = subprocess.Popen(launcher + ['serve', '--port', '0'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        try:
            line = process.stdout.readline()
            port = int(line.split('127.0.0.1:')[1].split(';')[0])

            def request(route, body=None, origin=ORIGIN, credential=token, expected=200):
                headers = {'Origin': origin, 'Authorization': 'Bearer ' + credential}
                data = None
                if body is not None:
                    data = json.dumps(body).encode()
                    headers['Content-Type'] = 'application/json'
                req = urllib.request.Request(f'http://127.0.0.1:{port}/v1/{route}', data=data, headers=headers)
                try:
                    with urllib.request.urlopen(req, timeout=10) as response:
                        status, value = response.status, json.load(response)
                except urllib.error.HTTPError as exc:
                    status, value = exc.code, json.load(exc)
                assert status == expected, (route, status, value)
                return value

            assert request('health')['protocol'] == 'atlas.local.v1'
            request('health', origin='https://malicious.example', expected=403)
            request('health', credential='wrong-token', expected=401)
            listing = request('list', {'grant': grant, 'path': ''})
            assert 'original.txt' in {e['name'] for e in listing['entries']}
            assert 'escape' not in {e['name'] for e in listing['entries']}
            request('read', {'grant': grant, 'path': '../outside.txt'}, expected=400)
            request('read', {'grant': grant, 'path': 'escape'}, expected=400)
            source = {'grant': grant, 'path': 'original.txt'}
            destination = {'grant': grant, 'path': 'destination'}
            operation = {'id': str(uuid.uuid4()), 'action': 'copy', 'sources': [source], 'destination': destination}
            copied = request('operate', operation)
            assert copied['receipt']['status'] == 'completed', copied
            assert (root / 'destination/original.txt').read_bytes() == (root / 'original.txt').read_bytes()
            assert request('operate', operation)['replayed'] is True
            renamed = request('operate', {'id': str(uuid.uuid4()), 'action': 'rename',
                                           'sources': [{'grant': grant, 'path': 'destination/original.txt'}], 'name': 'renamed.txt'})
            assert renamed['receipt']['status'] == 'completed'
            assert (root / 'destination/renamed.txt').is_file()
            trash = request('operate', {'id': str(uuid.uuid4()), 'action': 'trash',
                                        'sources': [{'grant': grant, 'path': 'destination/renamed.txt'}]})
            ident = trash['receipt']['results'][0]['trash_id']
            assert not (root / 'destination/renamed.txt').exists()
            restored = request('operate', {'id': str(uuid.uuid4()), 'action': 'restore',
                                           'sources': [{'grant': grant, 'path': ident}], 'destination': destination})
            assert restored['receipt']['status'] == 'completed'
            assert (root / 'destination/renamed.txt').read_bytes() == (root / 'original.txt').read_bytes()
            assert outside.read_bytes() == b'not authorized'
            subprocess.run(launcher + ['revoke', '--grant', grant], check=True, stdout=subprocess.DEVNULL)
            request('list', {'grant': grant, 'path': ''}, expected=403)
            print('PASS: Linux CLI + real HTTP; exact-origin/token denial; grant listing; traversal/symlink denial; byte-exact copy; idempotent retry; rename; recoverable trash/restore; grant revocation.')
            print('NOT_RUN: Chrome runtime, native messaging/wake, Windows, installers, external security audit.')
        finally:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)


if __name__ == '__main__':
    main()
