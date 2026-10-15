"""Real loopback HTTP probes; transport authorization cannot rely on CORS."""
import http.client
import json
import tempfile
import threading
import unittest
import uuid
from pathlib import Path
from atlas_companion.server import Server
from atlas_companion.state import State


class CompanionHTTPTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        base = Path(self.temp.name)
        self.root = base / 'root'
        self.root.mkdir()
        (self.root / 'real.txt').write_bytes(b'real filesystem bytes')
        self.state = State(base / 'state')
        self.origin = 'chrome-extension://' + 'a' * 32
        self.token = self.state.pair('a' * 32)
        self.grant = self.state.grant(str(self.root), writable=True)
        self.start()
        self.addCleanup(self.stop)

    def start(self):
        self.server = Server(self.state, port=0)
        self.thread = threading.Thread(target=self.server.serve_forever, kwargs={'poll_interval': 0.02}, daemon=True)
        self.thread.start()

    def stop(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)

    def request(self, method, path, data=None, overrides=None):
        headers = {'Host': '127.0.0.1:' + str(self.server.server_port), 'Origin': self.origin,
                   'Authorization': 'Bearer ' + self.token, 'Content-Type': 'application/json'}
        for key, value in (overrides or {}).items():
            if value is None:
                headers.pop(key, None)
            else:
                headers[key] = value
        body = json.dumps(data) if data is not None else None
        conn = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=3)
        try:
            conn.request(method, path, body=body, headers=headers)
            response = conn.getresponse()
            payload = response.read()
            return response.status, dict(response.getheaders()), json.loads(payload) if payload else None
        finally:
            conn.close()

    def test_auth_origin_host_csrf_and_content_type_negative(self):
        for changes, status in (({'Authorization': None}, 401), ({'Authorization': 'Bearer wrong'}, 401),
                                ({'Origin': 'https://attacker.example'}, 403), ({'Origin': None}, 403),
                                ({'Host': 'attacker.example'}, 403), ({'Host': 'localhost:' + str(self.server.server_port)}, 403),
                                ({'Sec-Fetch-Site': 'same-origin'}, 403)):
            with self.subTest(changes=changes):
                actual, headers, body = self.request('GET', '/v1/grants', overrides=changes)
                self.assertEqual(actual, status)
                self.assertFalse(body['ok'])
                self.assertNotIn('grants', body)
                self.assertNotEqual(headers.get('Access-Control-Allow-Origin'), '*')
        status, _, body = self.request('POST', '/v1/list', {'grant': self.grant}, {'Content-Type': 'text/plain'})
        self.assertEqual(status, 415)
        self.assertFalse(body['ok'])

    def test_chrome_worker_without_origin_requires_bound_bearer(self):
        headers = {'Origin': None, 'X-Atlas-Extension-Origin': self.origin, 'Sec-Fetch-Site': 'none'}
        status, _, body = self.request('GET', '/v1/health', overrides=headers)
        self.assertEqual(status, 200)
        self.assertEqual(body['status'], 'ready')
        status, _, body = self.request('GET', '/v1/grants', overrides=headers)
        self.assertEqual(status, 200)
        self.assertEqual(body['grants'][0]['id'], self.grant)
        for changes, expected in (({'Authorization': None}, 401),
                                  ({'Authorization': 'Bearer wrong'}, 401),
                                  ({'X-Atlas-Extension-Origin': 'chrome-extension://' + 'b' * 32}, 403),
                                  ({'Origin': 'https://attacker.example'}, 403),
                                  ({'Origin': 'null'}, 403),
                                  ({'Sec-Fetch-Site': 'cross-site'}, 403)):
            status, _, body = self.request('GET', '/v1/grants', overrides={**headers, **changes})
            self.assertEqual(status, expected)
            self.assertNotIn('grants', body)
        self.state.revoke_client('a' * 32)
        status, _, _ = self.request('GET', '/v1/grants', overrides=headers)
        self.assertEqual(status, 403)

    def test_real_list_read_and_path_escape_denial(self):
        status, _, body = self.request('POST', '/v1/list', {'grant': self.grant})
        self.assertEqual(status, 200)
        self.assertEqual(body['entries'][0]['name'], 'real.txt')
        import base64
        status, _, body = self.request('POST', '/v1/read', {'grant': self.grant, 'path': 'real.txt'})
        self.assertEqual(base64.b64decode(body['data']), b'real filesystem bytes')
        for path in ('../secret', '/etc/passwd', 'sub/../real.txt'):
            with self.subTest(path=path):
                status, _, body = self.request('POST', '/v1/read', {'grant': self.grant, 'path': path})
                self.assertNotEqual(status, 200)
                self.assertFalse(body['ok'])
        status, _, body = self.request('POST', '/v1/list', {'grant': 'unknown'})
        self.assertEqual(status, 403)

    def test_actual_http_mutation_and_restart_graph(self):
        request = {'id': uuid.uuid4().hex, 'action': 'rename', 'sources': [{'grant': self.grant, 'path': 'real.txt'}], 'name': 'renamed.txt'}
        status, _, body = self.request('POST', '/v1/operate', request)
        self.assertEqual(status, 200)
        self.assertEqual(body['receipt']['status'], 'completed')
        self.assertEqual((self.root / 'renamed.txt').read_bytes(), b'real filesystem bytes')
        _, _, replay = self.request('POST', '/v1/operate', request)
        self.assertTrue(replay['replayed'])
        status, _, graph = self.request('POST', '/v1/catalog', {'action': 'add_resource', 'args': {'kind': 'bookmark', 'title': 'Persisted'}})
        resource = graph['result']
        self.stop()
        self.start()
        status, _, restored = self.request('GET', '/v1/catalog')
        self.assertEqual(status, 200)
        self.assertIn(resource, restored['data']['resources'])
        self.assertEqual(restored['revision'], graph['revision'])

    def test_revocation_and_readonly_enforced_over_http(self):
        self.state.grant(str(self.root), writable=False)
        request = {'id': uuid.uuid4().hex, 'action': 'rename', 'sources': [{'grant': self.grant, 'path': 'real.txt'}], 'name': 'denied.txt'}
        status, _, body = self.request('POST', '/v1/operate', request)
        self.assertEqual(status, 403)
        self.assertTrue((self.root / 'real.txt').exists())
        self.state.revoke_grant(self.grant)
        status, _, body = self.request('POST', '/v1/list', {'grant': self.grant})
        self.assertEqual(status, 403)
        self.state.revoke_client('a' * 32)
        status, _, body = self.request('GET', '/v1/health')
        self.assertEqual(status, 403)

    def test_preflight_does_not_authorize_effects(self):
        status, headers, body = self.request('OPTIONS', '/v1/operate', overrides={
            'Authorization': None, 'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'authorization, content-type'})
        self.assertEqual(status, 204)
        self.assertEqual(headers['Access-Control-Allow-Origin'], self.origin)
        status, _, body = self.request('POST', '/v1/operate', {'action': 'trash'}, {'Authorization': None})
        self.assertEqual(status, 401)
        self.assertTrue((self.root / 'real.txt').exists())
