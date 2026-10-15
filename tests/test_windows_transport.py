"""Actual Windows exclusive loopback ownership and authenticated native handshake."""
import os
from pathlib import Path
import socket
import tempfile
import threading
import unittest
from unittest import mock


@unittest.skipUnless(os.name == 'nt', 'Requires actual Windows sockets and filesystem')
class WindowsTransportTests(unittest.TestCase):
    def setUp(self):
        from atlas_companion.windows_state import WindowsState
        from atlas_companion.windows_filesystem import WindowsProvider
        from atlas_companion.server import Server
        from atlas_native import __main__ as native
        self.native = native
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.state = WindowsState(Path(self.temp.name) / 'private')
        self.addCleanup(self.state.close)
        self.origin = 'chrome-extension://' + 'a' * 32
        self.state.pair('a' * 32)
        self.server = Server(self.state, port=0, provider_factory=WindowsProvider)
        self.thread = threading.Thread(target=self.server.serve_forever,
            kwargs={'poll_interval': 0.02}, daemon=True)
        self.thread.start()
        self.addCleanup(self.stop)
        patch = mock.patch.object(native, 'PORT', self.server.server_port)
        patch.start()
        self.addCleanup(patch.stop)

    def stop(self):
        if self.server is not None:
            self.server.shutdown()
            self.server.server_close()
            self.thread.join(timeout=3)
            self.assertFalse(self.thread.is_alive())
            self.server = None

    def test_exclusive_listener_cannot_be_stolen_or_misclassified_missing(self):
        self.assertFalse(self.native.windows_port_unbound())
        with socket.socket() as attacker:
            attacker.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            with self.assertRaises(OSError):
                attacker.bind(('127.0.0.1', self.server.server_port))
        self.assertFalse(self.native.windows_port_unbound())
        self.stop()
        self.assertTrue(self.native.windows_port_unbound())

    def test_real_native_handshake_proves_before_bearer_and_reports_windows(self):
        request = self.native.request
        calls = []
        proven_socket = []

        def observed(origin, path, body=None, token=None, connection=None):
            if path == '/v1/bootstrap-proof':
                self.assertIsNone(token)
            elif path == '/v1/health':
                self.assertTrue(calls and calls[-1][0] == '/v1/bootstrap-proof')
                self.assertIs(connection.sock, proven_socket[0])
                self.assertTrue(token)
            result = request(origin, path, body, token, connection)
            calls.append((path, result))
            if path == '/v1/bootstrap-proof':
                proven_socket.append(connection.sock)
                self.assertIsNotNone(connection.sock)
            return result

        with mock.patch.object(self.native, 'request', side_effect=observed), \
                mock.patch.object(self.native.subprocess, 'Popen') as spawn:
            result = self.native.connect(self.state, self.origin)
        spawn.assert_not_called()
        self.assertTrue(result['ok'])
        self.assertTrue(self.state.authenticate(self.origin, result['token']))
        self.assertEqual([path for path, _ in calls], ['/v1/bootstrap-proof', '/v1/health'])
        self.assertEqual(calls[-1][1]['platform'], 'windows')
        self.assertEqual(calls[-1][1]['status'], 'ready')
        with self.assertRaises(ValueError):
            request(self.origin, '/v1/health')

    def test_real_server_with_wrong_client_key_never_receives_new_bearer(self):
        from atlas_companion.windows_state import WindowsState
        client = WindowsState(self.state.directory)
        try:
            with mock.patch.object(client, 'bootstrap_key', return_value=b'X' * 32), \
                    mock.patch.object(client, 'pair', wraps=client.pair) as pairing, \
                    mock.patch.object(self.native.subprocess, 'Popen') as spawn, \
                    mock.patch.object(self.native, 'stop_attested_service') as terminate:
                with self.assertRaisesRegex(ValueError, 'identity could not be verified'):
                    self.native.connect(client, self.origin)
                pairing.assert_not_called()
                spawn.assert_not_called()
                terminate.assert_not_called()
        finally:
            client.close()


if __name__ == '__main__':
    unittest.main()
