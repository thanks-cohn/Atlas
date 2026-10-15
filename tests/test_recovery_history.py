"""Durable authorized history and actual reopened trash recovery."""
import json
import tempfile
import unittest
import uuid
from pathlib import Path

from atlas_companion.filesystem import Provider
from atlas_companion.security import APIError
from atlas_companion.state import State
import test_companion_http


class HistoryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        base = Path(self.temp.name)
        self.root = base / 'files'
        self.root.mkdir()
        self.state_dir = base / 'state'
        self.state = State(self.state_dir)
        self.grant = self.state.grant(self.root, writable=True)

    def request(self, action, **args):
        return {'id': uuid.uuid4().hex, 'action': action, **args}

    def test_restart_history_and_restore_original_bytes(self):
        (self.root / 'nested').mkdir()
        (self.root / 'nested' / 'proof.txt').write_bytes(b'original\x00bytes')
        request = self.request('trash', sources=[{'grant': self.grant, 'path': 'nested/proof.txt'}])
        Provider(self.state).operate(request)
        reopened = State(self.state_dir)
        history = reopened.receipts()
        self.assertEqual(history[0]['status'], 'completed')
        result = history[0]['results'][0]
        outcome = Provider(reopened).operate(self.request('restore', sources=[{'grant': self.grant, 'path': result['trash_id']}], destination={'grant': self.grant, 'path': 'nested'}))
        self.assertEqual(outcome['receipt']['status'], 'completed')
        self.assertEqual((self.root / 'nested' / 'proof.txt').read_bytes(), b'original\x00bytes')
        self.assertEqual(reopened.receipts()[0]['action'], 'restore')

    def test_pending_failed_partial_no_secret_and_revocation(self):
        pending = self.request('copy', sources=[{'grant': self.grant, 'path': 'private.txt'}], secret='NEVER_RETURN_THIS')
        self.state.begin(pending['id'], pending)
        history = self.state.receipts()
        self.assertEqual(history[0]['error']['code'], 'OUTCOME_UNKNOWN')
        self.assertNotIn('NEVER_RETURN_THIS', json.dumps(history))
        (self.root / 'exists.txt').write_text('test')
        result = Provider(self.state).operate(self.request('trash', sources=[{'grant': self.grant, 'path': 'exists.txt'}, {'grant': self.grant, 'path': 'absent.txt'}]))
        self.assertEqual(result['receipt']['status'], 'partial')
        history = self.state.receipts()
        self.assertEqual(history[0]['status'], 'partial')
        self.assertNotIn('message', history[0]['results'][1]['error'])
        self.state.revoke_grant(self.grant)
        self.assertEqual(self.state.receipts(), [])

    def test_multi_grant_receipt_fully_hidden_on_revocation_and_limit(self):
        other = self.root.parent / 'other'
        other.mkdir()
        grant2 = self.state.grant(other, writable=True)
        for i in range(110):
            request = self.request('copy', sources=[{'grant': self.grant, 'path': str(i)}], destination={'grant': grant2, 'path': ''})
            self.state.begin(request['id'], request)
        self.assertEqual(len(self.state.receipts()), 100)
        self.assertEqual(len(self.state.receipts(3)), 3)
        with self.assertRaises(APIError):
            self.state.receipts(101)
        self.state.revoke_grant(grant2)
        self.assertEqual(self.state.receipts(), [])


class HistoryHTTPTests(unittest.TestCase):
    setUp = test_companion_http.CompanionHTTPTests.setUp
    start = test_companion_http.CompanionHTTPTests.start
    stop = test_companion_http.CompanionHTTPTests.stop
    request = test_companion_http.CompanionHTTPTests.request

    def test_history_auth_and_exact_origin(self):
        request = {'id': uuid.uuid4().hex, 'action': 'trash', 'sources': [{'grant': self.grant, 'path': 'real.txt'}]}
        self.request('POST', '/v1/operate', request)
        status, _, value = self.request('GET', '/v1/receipts')
        self.assertEqual(status, 200)
        self.assertEqual(value['receipts'][0]['id'], request['id'])
        for overrides in ({'Authorization': None}, {'Origin': 'https://evil.example'}):
            status, _, value = self.request('GET', '/v1/receipts', overrides=overrides)
            self.assertNotEqual(status, 200)
            self.assertNotIn('receipts', value)
        self.state.revoke_grant(self.grant)
        self.assertEqual(self.request('GET', '/v1/receipts')[2]['receipts'], [])
