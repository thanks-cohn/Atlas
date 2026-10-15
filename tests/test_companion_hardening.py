"""Independent raw-header/JSON and bootstrap proof negative probes."""
import hashlib
import hmac
import http.client
import json
import unittest

import test_companion_http as fixtures


class CompanionHardeningTests(unittest.TestCase):
    setUp = fixtures.CompanionHTTPTests.setUp
    start = fixtures.CompanionHTTPTests.start
    stop = fixtures.CompanionHTTPTests.stop
    request = fixtures.CompanionHTTPTests.request

    def raw(self, body=None, extra=None, omit=None):
        headers = [('Host', f'127.0.0.1:{self.server.server_port}'), ('Origin', self.origin),
                   ('Authorization', 'Bearer ' + self.token)]
        if body is not None:
            headers += [('Content-Type', 'application/json'), ('Content-Length', str(len(body)))]
        headers = [(k, v) for k, v in headers if k != omit]
        connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=3)
        try:
            connection.putrequest('POST' if body is not None else 'GET', '/v1/list' if body is not None else '/v1/health', skip_host=True)
            for key, value in headers + (extra or []):
                connection.putheader(key, value)
            connection.endheaders(body)
            response = connection.getresponse()
            return response.status, json.loads(response.read())
        finally:
            connection.close()

    def test_duplicate_authority_headers_rejected(self):
        for key, value in [('Host', f'127.0.0.1:{self.server.server_port}'),
                           ('Origin', self.origin), ('Authorization', 'Bearer ' + self.token)]:
            with self.subTest(header=key):
                status, body = self.raw(extra=[(key, value)])
                self.assertIn(status, (401, 403))
                self.assertFalse(body['ok'])

    def test_duplicate_length_and_transfer_encoding_rejected(self):
        for extra in [[('Content-Length', '2')], [('Transfer-Encoding', 'chunked')]]:
            status, body = self.raw(b'{}', extra=extra)
            self.assertEqual(status, 411)
            self.assertFalse(body['ok'])

    def test_ambiguous_json_is_denied_before_provider(self):
        for data in [b'{"grant":"x","grant":"y"}', b'{"offset":NaN}', b'[]', b'null', b'{']:
            with self.subTest(data=data):
                status, body = self.raw(data)
                self.assertEqual(status, 400)
                self.assertFalse(body['ok'])

    def test_bootstrap_proof_never_returns_authority_or_accepts_invalid_nonce(self):
        for nonce in ['', '0' * 63, 'g' * 64, 42, None]:
            status, _, body = self.request('POST', '/v1/bootstrap-proof', {'nonce': nonce}, {'Authorization': None})
            self.assertEqual(status, 400)
            self.assertEqual(body['error']['code'], 'INVALID_NONCE')
        proofs = []
        for nonce in ['0' * 64, '1' * 64]:
            status, _, body = self.request('POST', '/v1/bootstrap-proof', {'nonce': nonce}, {'Authorization': None})
            self.assertEqual(status, 200)
            self.assertEqual(set(body), {'ok', 'proof'})
            expected = hmac.new(self.state.bootstrap_key(), f'atlas.native.v1:{nonce}:{self.server.server_port}'.encode(), hashlib.sha256).hexdigest()
            self.assertEqual(body['proof'], expected)
            proofs.append(body['proof'])
        self.assertNotEqual(*proofs)
        status, _, body = self.request('GET', '/v1/grants', overrides={'Authorization': 'Bearer ' + proofs[0]})
        self.assertEqual(status, 401)
        status, _, body = self.request('POST', '/v1/bootstrap-proof', {'nonce': '0' * 64},
                                       {'Authorization': None, 'Origin': 'https://attacker.example'})
        self.assertEqual(status, 403)
        self.state.revoke_client('a' * 32)
        status, _, body = self.request('POST', '/v1/bootstrap-proof', {'nonce': '0' * 64}, {'Authorization': None})
        self.assertEqual(status, 403)
