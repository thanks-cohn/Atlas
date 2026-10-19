"""Chrome-only bootstrap: no file operations, shell commands or root grants."""
import hashlib
import hmac
import http.client
import json
import os
from pathlib import Path
import secrets
import socket
import struct
import subprocess
import sys
import time

if os.name == 'nt':
    from atlas_companion.windows_state import WindowsState as State
else:
    from atlas_companion.state import State
from atlas_companion.runtime import launch_options, RuntimeLock, child_environment, stop_attested_service
from atlas_companion.entrypoint import command
from atlas_companion.security import APIError
from atlas_companion.diagnostics import record, error_code

PORT = 17892
MAX_FRAME = 65536


def windows_port_unbound():
    """Windows can time out instead of refusing an unused loopback port.

    Exclusive bind observes availability without contacting an unknown listener.
    It authorizes only attempting our fixed command, never trust or termination;
    fresh possession proof is still required before any bearer is disclosed.
    """
    if os.name != 'nt':
        return False
    try:
        with socket.socket() as probe:
            probe.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
            probe.bind(('127.0.0.1', PORT))
        return True
    except OSError:
        return False


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
    if message not in ({'action': 'connect'}, {'action': 'manage'}):
        raise ValueError('Only connect or manage is supported')
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
    record(state, 'NATIVE_PROOF', 'PROOF_STARTED')
    nonce = secrets.token_hex(32)
    expected = hmac.new(state.bootstrap_key(), f'atlas.native.v1:{nonce}:{PORT}'.encode(), hashlib.sha256).hexdigest()
    response = request(origin, '/v1/bootstrap-proof', {'nonce': nonce}, connection=connection)
    if not isinstance(response.get('proof'), str) or not hmac.compare_digest(expected, response['proof']):
        record(state, 'NATIVE_PROOF', 'PROOF_MISMATCH')
        raise ValueError('Companion identity could not be verified')
    if connection.sock is None:
        raise ValueError('Companion must keep proof connection open')


def _connect(state, origin, *, issue_token=True):
    record(state, 'NATIVE_CONNECT', 'CONNECT_STARTED')
    if not state.known_origin(origin):
        raise ValueError('Extension has been revoked; explicitly reinstall to authorize')
    connection = http.client.HTTPConnection('127.0.0.1', PORT, timeout=2)
    try:
        try:
            prove(state, origin, connection)
        except (ConnectionRefusedError, TimeoutError, OSError, http.client.HTTPException) as exc:
            record(state, 'NATIVE_PROOF', 'PROOF_TRANSPORT_FAILED')
            connection.close()
            missing = isinstance(exc, ConnectionRefusedError) or windows_port_unbound()
            if not missing:
                # Confirm a timeout on a fresh connection before considering a
                # precisely attested stale process. Invalid HMAC never triggers a kill.
                time.sleep(0.2)
                try:
                    prove(state, origin, connection)
                except ConnectionRefusedError:
                    missing = True
                except (TimeoutError, OSError, http.client.HTTPException):
                    connection.close()
                    if not (state.directory / 'service.identity').exists():
                        record(state, 'NATIVE_WAKE', 'NO_ATTESTED_SERVICE')
                        raise
                    stop_attested_service(state, PORT)
                    missing = True
            if missing:
                record(state, 'NATIVE_WAKE', 'SERVICE_SPAWN_STARTED')
                connection.close()
                subprocess.Popen(command('--state-dir', str(state.directory), 'serve', '--port', str(PORT)),
                                 stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                 close_fds=True, env=child_environment(), **launch_options())
                # A freshly extracted Windows onefile runtime can take longer
                # than three seconds under normal antivirus scanning. Keep wake
                # bounded by elapsed time, rather than assuming a warm process.
                startup_deadline = time.monotonic() + 20
                while time.monotonic() < startup_deadline:
                    try:
                        prove(state, origin, connection)
                        break
                    except (ConnectionRefusedError, TimeoutError, OSError):
                        connection.close()
                        time.sleep(0.1)
                else:
                    record(state, 'NATIVE_WAKE', 'SERVICE_START_TIMEOUT')
                    raise ValueError('Companion did not start')
        # Recovery supervision only needs fresh possession proof. It must not
        # rotate a browser credential issued by a concurrent native connection.
        if not issue_token:
            record(state, 'NATIVE_CONNECT', 'CONNECT_READY')
            return {'ok': True, 'protocol': 'atlas.local.v1', 'port': PORT}
        # Reuse the proven TCP connection. Never reconnect while sending credentials.
        proven_socket = connection.sock
        record(state, 'NATIVE_PROOF', 'PROOF_OK')
        token = state.pair(origin.removeprefix('chrome-extension://'))
        record(state, 'NATIVE_PAIR', 'TOKEN_ROTATED')
        if connection.sock is not proven_socket or proven_socket is None:
            raise ValueError('Proven connection was lost')
        record(state, 'NATIVE_HEALTH', 'HEALTH_CHECK_STARTED')
        health = request(origin, '/v1/health', token=token, connection=connection)
        if health.get('protocol') != 'atlas.local.v1' or health.get('status') != 'ready':
            raise ValueError('Companion protocol is incompatible')
        record(state, 'NATIVE_CONNECT', 'CONNECT_READY')
        return {'ok': True, 'protocol': 'atlas.local.v1', 'port': PORT, 'token': token}
    finally:
        connection.close()


def connect(state, origin, *, issue_token=True):
    # Serialize demand-wake and token rotation across concurrent native hosts.
    record(state, 'NATIVE_WAKE_LOCK', 'LOCK_WAIT_STARTED')
    deadline = time.monotonic() + 8
    while True:
        try:
            with RuntimeLock(state, 'wake'):
                try:
                    return _connect(state, origin, issue_token=issue_token)
                except Exception as exc:
                    record(state, 'NATIVE_CONNECT', error_code(exc))
                    raise
        except APIError as exc:
            if exc.code != 'ALREADY_RUNNING' or time.monotonic() >= deadline:
                raise
            time.sleep(0.1)


def main():
    if os.name == 'nt':
        import msvcrt
        msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
        msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    os.umask(0o077)
    try:
        # Launcher supplies private config path; Chrome appends its exact caller origin.
        if len(sys.argv) != 3:
            raise ValueError('Invalid native host invocation')
        config = json.loads(Path(sys.argv[1]).read_text())
        origin = 'chrome-extension://' + config['extension_id']
        if sys.argv[2] != origin + '/':
            raise APIError('NEEDS_PAIRING', 'Native caller identity changed.')
        message = read_message(sys.stdin.buffer)
        state = State(config['state_dir'])
        if not state.known_origin(origin):
            raise APIError('NEEDS_PAIRING', 'Extension is not enrolled.')
        if message['action'] == 'manage':
            subprocess.Popen(command('--desktop', *(['--advanced'] if os.name == 'nt' else []), '--state-dir', str(state.directory)),
                             stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                             close_fds=True, env=child_environment(), **launch_options())
            response = {'ok': True, 'state': 'MANAGE_OPENED'}
        else:
            response = connect(state, origin)
    except Exception as exc:
        # Never echo exception details, tokens, config or caller data into native output.
        code = 'NEEDS_PAIRING' if isinstance(exc, APIError) and exc.code == 'NEEDS_PAIRING' else 'OFFLINE' if isinstance(exc, (ConnectionError, TimeoutError)) else 'NEEDS_REPAIR'
        response = {'ok': False, 'code': code, 'state': code, 'error': 'Native bootstrap unavailable. Check installation, pairing and companion port.'}
    write_message(sys.stdout.buffer, response)
    return 0 if response['ok'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
