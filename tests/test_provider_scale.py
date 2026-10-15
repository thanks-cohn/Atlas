"""Observable pagination and explicit filesystem-authority boundaries at scale."""
import tempfile
import unittest
from pathlib import Path
from atlas_companion.filesystem import Provider
from atlas_companion.security import APIError
from atlas_companion.state import State


class ProviderScaleTests(unittest.TestCase):
    def test_thousand_real_entries_paginate_without_loss_or_duplicates(self):
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder)
            root = base / 'root'
            root.mkdir()
            expected = set()
            for i in range(1005):
                name = f'asset-{i:04}.txt'
                (root / name).write_bytes(str(i).encode())
                expected.add(name)
            for i in range(12):
                name = f'folder-{i:02}'
                (root / name).mkdir()
                expected.add(name)
            (root / '.atlas-trash').mkdir()
            (root / '.atlas-copy-unpublished').mkdir()
            (root / 'escape').symlink_to(base, target_is_directory=True)
            state = State(base / 'state')
            grant = state.grant(str(root))
            provider = Provider(state)
            rows = []
            for offset in range(0, 1017, 137):
                page = provider.list({'grant': grant, 'offset': offset, 'limit': 137})
                self.assertEqual(page['total'], 1017)
                rows.extend(page['entries'])
            self.assertEqual(len(rows), 1017)
            self.assertEqual({row['name'] for row in rows}, expected)
            self.assertEqual([row['kind'] for row in rows[:12]], ['directory'] * 12)
            self.assertEqual(len({row['path'] for row in rows}), len(rows))

    def test_private_state_never_can_become_a_browser_file_grant(self):
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder)
            state = State(base / 'private')
            nested = state.directory / 'nested'
            nested.mkdir()
            for root in (base, state.directory, nested):
                with self.subTest(root=root):
                    with self.assertRaises(APIError) as caught:
                        state.grant(str(root), writable=True)
                    self.assertEqual(caught.exception.code, 'BROAD_CONSENT_REQUIRED' if root == base else 'PRIVATE_STATE')
            state.bootstrap_key()
            self.assertEqual(state.grants(), [])

    def test_newer_authority_store_version_is_rejected_without_downgrade(self):
        import sqlite3
        with tempfile.TemporaryDirectory() as folder:
            state = State(folder)
            with sqlite3.connect(state.path) as db:
                db.execute('PRAGMA user_version=99')
            with self.assertRaises(APIError) as caught:
                State(folder)
            self.assertEqual(caught.exception.code, 'UNSUPPORTED_STATE_VERSION')
            with sqlite3.connect(state.path) as db:
                self.assertEqual(db.execute('PRAGMA user_version').fetchone()[0], 99)
