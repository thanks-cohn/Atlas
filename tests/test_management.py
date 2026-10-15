"""Trusted local consent controller: no browser-side grant creation."""
import http.client
import tempfile
import threading
import unittest
from pathlib import Path
from atlas_companion.desktop import Management, diagnose
from atlas_companion.security import APIError
from atlas_companion.server import Server
from atlas_companion.state import State


class ManagementTests(unittest.TestCase):
    def test_manual_pairing_consent_identity_rotation_and_no_grants(self):
        with tempfile.TemporaryDirectory() as folder:
            state = State(folder); model = Management(state)
            ident = 'a' * 32; origin = 'chrome-extension://' + ident
            old = state.pair(ident)
            with self.assertRaises(APIError):
                model.pairing_token(ident)
            self.assertTrue(state.authenticate(origin, old))
            with self.assertRaises(APIError):
                model.pairing_token('invalid', consent=True)
            token = model.pairing_token(ident, consent=True)
            self.assertTrue(state.authenticate(origin, token))
            self.assertFalse(state.authenticate(origin, old))
            self.assertFalse(state.authenticate('chrome-extension://' + 'b' * 32, token))
            self.assertEqual(state.grants(), [])
            with state.connect() as db:
                self.assertNotEqual(db.execute('SELECT digest FROM clients WHERE origin=?', (origin,)).fetchone()['digest'], token)

    def test_grants_require_consent_and_survive_restart_without_new_prompts(self):
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder); root = base / 'files'; root.mkdir()
            state = State(base / 'private'); model = Management(state)
            with self.assertRaises(APIError):
                model.authorize(str(root), writable=True)
            self.assertEqual(state.grants(), [])
            ident = model.authorize(str(root), consent=True)
            self.assertFalse(state.get_grant(ident)['writable'])
            self.assertEqual(model.authorize(str(root), writable=True, consent=True), ident)
            reopened = State(base / 'private')
            self.assertTrue(reopened.get_grant(ident)['writable'])
            with self.assertRaises(APIError):
                model.revoke(ident)
            model.revoke(ident, consent=True)
            with self.assertRaises(APIError):
                State(base / 'private').get_grant(ident)

    def test_broad_consent_cannot_authorize_private_state(self):
        with tempfile.TemporaryDirectory() as folder:
            state = State(Path(folder) / 'private'); model = Management(state)
            with self.assertRaises(APIError) as caught:
                model.authorize(folder, consent=True)
            self.assertEqual(caught.exception.code, 'BROAD_CONSENT_REQUIRED')
            ident = model.authorize(folder, allow_broad=True, consent=True)
            self.assertEqual(state.get_grant(ident)['root'], folder)
            with self.assertRaises(APIError):
                model.authorize(str(state.directory), writable=True, allow_broad=True, consent=True)

    def test_diagnostics_use_proof_without_rotating_or_disclosing_tokens(self):
        with tempfile.TemporaryDirectory() as folder:
            state = State(folder)
            self.assertEqual(diagnose(state)['state'], 'NEEDS_PAIRING')
            origin = 'chrome-extension://' + 'a' * 32
            token = state.pair('a' * 32)
            server = Server(state, 0)
            thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
            try:
                result = diagnose(state, server.server_port)
                self.assertEqual(result['state'], 'READY')
                self.assertNotIn(token, str(result))
                self.assertTrue(state.authenticate(origin, token))
            finally:
                server.shutdown(); server.server_close(); thread.join()
