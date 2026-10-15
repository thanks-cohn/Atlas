"""On-demand SHA-256 proofs over scoped, stable real filesystem bytes."""
import hashlib
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from atlas_companion.filesystem import Provider
from atlas_companion.security import APIError
from atlas_companion.state import State


@unittest.skipUnless(sys.platform.startswith('linux'), 'Linux descriptor provider')
class FileHashTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.root = self.base / 'root'
        self.root.mkdir()
        self.path = self.root / 'proof.bin'
        self.content = bytes(range(256)) * 4096
        self.path.write_bytes(self.content)
        self.state = State(self.base / 'state')
        self.grant = self.state.grant(str(self.root), writable=False)
        self.provider = Provider(self.state)
        self.request = {'grant': self.grant, 'path': 'proof.bin'}

    def test_known_bytes_readonly_grant_and_empty_file(self):
        result = self.provider.hash(self.request)
        self.assertEqual(result['sha256'], hashlib.sha256(self.content).hexdigest())
        self.assertEqual(result['size'], len(self.content))
        self.assertEqual(result['modified'], self.path.stat().st_mtime)
        self.assertEqual(self.path.read_bytes(), self.content)
        self.path.write_bytes(b'')
        self.assertEqual(self.provider.hash(self.request)['sha256'], hashlib.sha256(b'').hexdigest())

    def test_symlink_directory_and_ungranted_access_denied(self):
        outside = self.base / 'outside.txt'
        outside.write_text('not authorized')
        (self.root / 'escape').symlink_to(outside)
        with self.assertRaises(OSError):
            self.provider.hash({'grant': self.grant, 'path': 'escape'})
        with self.assertRaises(APIError):
            self.provider.hash({'grant': self.grant, 'path': '../outside.txt'})
        with self.assertRaises(APIError):
            self.provider.hash({'grant': 'unknown', 'path': 'proof.bin'})
        (self.root / 'folder').mkdir()
        with self.assertRaisesRegex(APIError, 'Only regular files'):
            self.provider.hash({'grant': self.grant, 'path': 'folder'})
        self.assertEqual(outside.read_text(), 'not authorized')

    def test_size_limit_rejects_before_reading(self):
        with patch('atlas_companion.filesystem.MAX_HASH_BYTES', 16), patch('atlas_companion.filesystem.os.read') as read:
            with self.assertRaisesRegex(APIError, 'limited'):
                self.provider.hash(self.request)
            read.assert_not_called()

    def test_file_changed_during_read_has_no_accepted_digest(self):
        real_read = os.read
        changed = False
        def altering_read(fd, size):
            nonlocal changed
            result = real_read(fd, size)
            if result and not changed:
                changed = True
                with self.path.open('ab') as stream:
                    stream.write(b'changed concurrently')
            return result
        with patch('atlas_companion.filesystem.os.read', side_effect=altering_read):
            with self.assertRaises(APIError) as caught:
                self.provider.hash(self.request)
        self.assertEqual(caught.exception.code, 'CHANGED_DURING_READ')

    def test_hash_route_authenticates_and_returns_real_digest(self):
        import http.client
        import json
        import threading
        from atlas_companion.server import Server
        token = self.state.pair('a' * 32)
        server = Server(self.state, port=0)
        thread = threading.Thread(target=server.serve_forever, kwargs={'poll_interval': 0.01}, daemon=True)
        thread.start()
        try:
            for authorization, expected in ((None, 401), ('Bearer ' + token, 200)):
                connection = http.client.HTTPConnection('127.0.0.1', server.server_port, timeout=3)
                headers = {'Origin': 'chrome-extension://' + 'a' * 32, 'Content-Type': 'application/json'}
                if authorization:
                    headers['Authorization'] = authorization
                try:
                    connection.request('POST', '/v1/hash', json.dumps(self.request), headers)
                    response = connection.getresponse()
                    result = json.loads(response.read())
                    self.assertEqual(response.status, expected)
                    if expected == 200:
                        self.assertEqual(result['sha256'], hashlib.sha256(self.content).hexdigest())
                        self.assertEqual(result['size'], len(self.content))
                    else:
                        self.assertNotIn('sha256', result)
                finally:
                    connection.close()
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)
