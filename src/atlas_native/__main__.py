"""Chrome-only bootstrap: no file operations, shell commands or root grants."""
import hashlib
import hmac
import http.client
import json
import os
from pathlib import Path
import secrets
import struct
import subprocess
import sys
import time

from atlas_companion.state import State

PORT = 17892
MAX_FRAME = 65536


def read_exact(stream, length):
    result = bytearray()
    while len(result) < length:
        chunk = stream.read(length - len(result))
        if not chunk:
            raise ValueError('Truncated native message')
        result.extend(chunk)
    return bytes(result)


def read_message(stream):
    length = struct.unpack('<I', read_exact(stream, 4))[0]
    if not 1 <= length <= MAX_FRAME:
        raise ValueError('Native message exceeds limit')
    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError('Duplicate key')
            result[key] = value
        return result
    message = json.loads(read_exact(stream, length), object_pairs_hook=unique)
    if message != {'action': 'connect'}:
        raise ValueError('Only connect is supported')
    return message


def write_message(stream, message):
    data = json.dumps(message, separators=(',', ':')).encode()
    stream.write(struct.pack('<I', len(data)) + data)
    stream.flush()


def request(origin, path, body=None, token=None, connection=None):
    owned = connection is None
    connection = connection or http.client.HTTPConnection('127.0.0.1', PORT, timeout=2)
    headers = {'Origin': origin}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    if body is not None:
        headers['Content-Type'] = 'application/json'
        body = json.dumps(body).encode()
    try:
        connection.request('POST' if body is not None else 'GET', path, body, headers)
        response = connection.getresponse()
        data = response.read(MAX_FRAME + 1)
        if response.status != 200 or len(data) > MAX_FRAME:
            raise ValueError('Companion rejected bootstrap')
        return json.loads(data)
    finally:
        if owned:
            connection.close()


def prove(state, origin, connection):
    nonce = secrets.token_hex(32)
    expected = hmac.new(state.bootstrap_key(), f'atlas.native.v1:{nonce}:{PORT}'.encode(), hashlib.sha256).hexdigest()
    response = request(origin, '/v1/bootstrap-proof', {'nonce': nonce}, connection=connection)
    if not isinstance(response.get('proof'), str) or not hmac.compare_digest(expected, response['proof']):
        raise ValueError('Companion identity could not be verified')
    if connection.sock is None:
        raise ValueError('Companion must keep proof connection open')


def connect(state, origin):
    if not state.known_origin(origin):
        raise ValueError('Extension has been revoked; explicitly reinstall to authorize')
    connection = http.client.HTTPConnection('127.0.0.1', PORT, timeout=2)
    try:
        try:
            prove(state, origin, connection)
        except (ConnectionRefusedError, TimeoutError, OSError):
            connection.close()
            subprocess.Popen([sys.executable, '-m', 'atlas_companion', '--state-dir', str(state.directory), 'serve', '--port', str(PORT)],
                             stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                             start_new_session=True, close_fds=True)
            for attempt in range(30):
                try:
                    prove(state, origin, connection)
                    break
                except (ConnectionRefusedError, TimeoutError, OSError):
                    connection.close()
                    time.sleep(0.1)
            else:
                raise ValueError('Companion did not start')
        # Reuse the proven TCP connection. Never reconnect while sending credentials.
        proven_socket = connection.sock
        token = state.pair(origin.removeprefix('chrome-extension://'))
        if connection.sock is not proven_socket or proven_socket is None:
            raise ValueError('Proven connection was lost')
        health = request(origin, '/v1/health', token=token, connection=connection)
        if health.get('protocol') != 'atlas.local.v1' or health.get('status') != 'ready':
            raise ValueError('Companion protocol is incompatible')
        return {'ok': True, 'protocol': 'atlas.local.v1', 'port': PORT, 'token': token}
    finally:
        connection.close()


def main():
    os.umask(0o077)
    try:
        # Launcher supplies private config path; Chrome appends its exact caller origin.
        if len(sys.argv) != 3:
            raise ValueError('Invalid native host invocation')
        config = json.loads(Path(sys.argv[1]).read_text())
        origin = 'chrome-extension://' + config['extension_id']
        if sys.argv[2] != origin + '/':
            raise ValueError('Unauthorized native caller')
        read_message(sys.stdin.buffer)
        response = connect(State(config['state_dir']), origin)
    except Exception:
        # Never echo exception details, tokens, config or caller data into native output.
        response = {'ok': False, 'error': 'Native bootstrap unavailable. Check installation, pairing and companion port.'}
    write_message(sys.stdout.buffer, response)
    return 0 if response['ok'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
