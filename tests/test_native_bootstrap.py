"""Native framing and Linux explicit-install proof; no real user installation."""
import importlib.util
import io
import json
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch

from atlas_companion.server import Server
from atlas_companion.state import State
from atlas_native import __main__ as native


class NativeTests(unittest.TestCase):
    def test_framing_partial_reads_and_denials(self):
        class Short(io.BytesIO):
            def read(self, size=-1):
                return super().read(min(size, 2))
        raw = b'{"action":"connect"}'
        self.assertEqual(native.read_message(Short(struct.pack('<I', len(raw)) + raw)), {'action': 'connect'})
        for raw in (b'{"action":"shell"}', b'{"action":"connect","action":"connect"}', b'{}'):
            with self.assertRaises(ValueError):
                native.read_message(io.BytesIO(struct.pack('<I', len(raw)) + raw))
        for raw in (struct.pack('<I', 65537), b'\x01\x00', struct.pack('<I', 20) + b'{}'):
            with self.assertRaises(ValueError):
                native.read_message(io.BytesIO(raw))

    def test_real_proven_connection_and_revocation(self):
        with tempfile.TemporaryDirectory() as folder:
            state = State(folder)
            extension = 'a' * 32
            state.pair(extension)
            server = Server(state, 0)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                with patch.object(native, 'PORT', server.server_port):
                    response = native.connect(state, 'chrome-extension://' + extension)
                    self.assertTrue(state.authenticate('chrome-extension://' + extension, response['token']))
                    state.revoke_client(extension)
                    with self.assertRaises(ValueError):
                        native.connect(state, 'chrome-extension://' + extension)
            finally:
                server.shutdown()
                server.server_close()
                thread.join()

    def test_private_key_tampering_fails_closed(self):
        import os
        from atlas_companion.security import APIError
        with tempfile.TemporaryDirectory() as folder:
            state = State(folder)
            key = Path(folder) / 'bootstrap.key'
            original = state.bootstrap_key()
            key.chmod(0o644)
            with self.assertRaises(APIError):
                state.bootstrap_key()
            key.chmod(0o600)
            key.write_bytes(b'short')
            with self.assertRaises(APIError):
                state.bootstrap_key()
            key.unlink()
            target = Path(folder) / 'outside-key'
            target.write_bytes(original)
            key.symlink_to(target)
            with self.assertRaises(OSError):
                state.bootstrap_key()
            self.assertEqual(target.read_bytes(), original)

    def test_actual_process_wake_and_valid_native_frame(self):
        import os
        import socket
        from contextlib import closing
        with closing(socket.socket()) as probe:
            probe.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                probe.bind(('127.0.0.1', native.PORT))
            except OSError:
                self.skipTest('Fixed companion port already occupied')
        with tempfile.TemporaryDirectory() as folder:
            state = State(folder)
            extension = 'd' * 32
            origin = 'chrome-extension://' + extension
            state.pair(extension)
            children = []
            real_popen = subprocess.Popen
            def launch(*args, **kwargs):
                child = real_popen(*args, **kwargs)
                children.append(child)
                return child
            try:
                with patch.object(native.subprocess, 'Popen', side_effect=launch):
                    response = native.connect(state, origin)
                self.assertTrue(response['ok'])
                self.assertEqual(len(children), 1)
                self.assertIsNone(children[0].poll())
                config = Path(folder) / 'native-test.json'
                config.write_text(json.dumps({'extension_id': extension, 'state_dir': folder}))
                data = b'{"action":"connect"}'
                env = dict(os.environ)
                env['PYTHONPATH'] = str(Path(__file__).resolve().parents[1] / 'src')
                result = subprocess.run([sys.executable, '-m', 'atlas_native', str(config), origin + '/'],
                                        input=struct.pack('<I', len(data)) + data,
                                        capture_output=True, timeout=10, env=env)
                self.assertEqual(result.returncode, 0, result.stderr)
                size = struct.unpack('<I', result.stdout[:4])[0]
                answer = json.loads(result.stdout[4:4 + size])
                self.assertTrue(state.authenticate(origin, answer['token']))
                self.assertFalse(state.authenticate(origin, response['token']))
                self.assertEqual(state.grants(), [])
            finally:
                for child in children:
                    child.terminate()
                    child.wait(timeout=5)

    def test_imposter_listener_never_receives_bearer(self):
        from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
        seen = []
        class Imposter(BaseHTTPRequestHandler):
            protocol_version = 'HTTP/1.1'
            def do_POST(self):
                seen.append(self.headers.get('Authorization'))
                self.rfile.read(int(self.headers['Content-Length']))
                body = b'{"ok":true,"proof":"wrong"}'
                self.send_response(200)
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            def log_message(self, *args):
                pass
        server = ThreadingHTTPServer(('127.0.0.1', 0), Imposter)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with tempfile.TemporaryDirectory() as folder:
                state = State(folder)
                previous = state.pair('a' * 32)
                with patch.object(native, 'PORT', server.server_port):
                    with self.assertRaises(ValueError):
                        native.connect(state, 'chrome-extension://' + 'a' * 32)
                self.assertTrue(state.authenticate('chrome-extension://' + 'a' * 32, previous))
                self.assertEqual(seen, [None])
        finally:
            server.shutdown()
            server.server_close()
            thread.join()

    def test_installer_scopes_and_executable_frame(self):
        spec = importlib.util.spec_from_file_location('atlas_installer', Path(__file__).resolve().parents[1] / 'scripts/install_native_host.py')
        installer = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(installer)
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            paths = installer.install('b' * 32, root / 'native', root / 'manifests', root / 'state')
            manifest = json.loads(paths[2].read_text())
            self.assertEqual(manifest['allowed_origins'], ['chrome-extension://' + 'b' * 32 + '/'])
            self.assertEqual(State(root / 'state').grants(), [])
            unsafe = root / 'unsafe-install'
            unsafe.mkdir(mode=0o777)
            unsafe.chmod(0o777)
            with self.assertRaises(ValueError):
                installer.install('b' * 32, unsafe, root / 'other-manifests', root / 'other-state')
            self.assertFalse((root / 'other-state').exists())
            symlink = root / 'symlink-install'
            symlink.symlink_to(unsafe, target_is_directory=True)
            with self.assertRaises(ValueError):
                installer.install('b' * 32, symlink, root / 'other-manifests', root / 'other-state')
            frame = b'{"action":"connect"}'
            # Unauthorized argv must fail before network, without changing any pairing.
            proc = subprocess.run([str(paths[1]), 'chrome-extension://' + 'c' * 32 + '/'],
                                  input=struct.pack('<I', len(frame)) + frame, capture_output=True, timeout=5)
            size = struct.unpack('<I', proc.stdout[:4])[0]
            response = json.loads(proc.stdout[4:4 + size])
            self.assertFalse(response['ok'])
            self.assertNotIn('token', response)
            for malformed in (b'\x05\x00', struct.pack('<I', 70000), struct.pack('<I', 2) + b'{}'):
                bad = subprocess.run([str(paths[1]), 'chrome-extension://' + 'b' * 32 + '/'],
                                     input=malformed, capture_output=True, timeout=5)
                length = struct.unpack('<I', bad.stdout[:4])[0]
                failure = json.loads(bad.stdout[4:4 + length])
                self.assertFalse(failure['ok'])
                self.assertNotIn('token', failure)
                self.assertEqual(bad.stderr, b'')
            with self.assertRaises(ValueError):
                installer.install('b' * 32, root / 'native', root / 'manifests', root / 'state')


if __name__ == '__main__':
    unittest.main()
