"""Deliberate broad scopes never confer authority over companion secrets."""
import os
import sys
import tempfile
import unittest
import uuid
from pathlib import Path
from unittest.mock import patch
from atlas_companion.filesystem import Provider
from atlas_companion.security import APIError, directory, root_fd
from atlas_companion.state import State


@unittest.skipUnless(sys.platform.startswith('linux'), 'Linux descriptor authority')
class BroadGrantTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.volume = Path(self.temp.name)
        self.home = self.volume / 'home'
        self.home.mkdir()
        self.private = self.home / 'native-state'
        self.state = State(self.private)
        self.state.bootstrap_key()
        self.public = self.home / 'public'
        self.public.mkdir()
        (self.public / 'real.txt').write_bytes(b'public bytes')
        self.destination = self.volume / 'destination'
        self.destination.mkdir()
        self.ident = self.state.grant(self.volume, writable=True, allow_broad=True)
        self.provider = Provider(self.state)

    def operation(self, action, path, **extra):
        request = {'id': uuid.uuid4().hex, 'action': action,
                   'sources': [{'grant': self.ident, 'path': path}]}
        request.update(extra)
        return self.provider.operate(request)

    def test_broad_consent_required_private_grants_never_allowed(self):
        for root in (self.volume, self.home):
            with self.assertRaises(APIError) as caught:
                self.state.grant(root)
            self.assertEqual(caught.exception.code, 'BROAD_CONSENT_REQUIRED')
        for root in (self.private, self.private / 'nested'):
            with self.assertRaises(APIError) as caught:
                self.state.grant(root, allow_broad=True)
            self.assertEqual(caught.exception.code, 'PRIVATE_STATE')
        with patch('atlas_companion.state.Path.home', return_value=self.public):
            self.assertTrue(self.state.requires_broad(self.public))
            with self.assertRaises(APIError):
                self.state.grant(self.public)
        with patch('atlas_companion.state.os.path.ismount', return_value=True):
            with self.assertRaises(APIError):
                self.state.grant(self.public)
        with self.assertRaises(APIError):
            self.state.grant('/')

    def test_broad_metadata_and_exclusions_persist_across_restart(self):
        restarted = State(self.private)
        grant = restarted.get_grant(self.ident)
        self.assertEqual(grant['broad'], 1)
        self.assertEqual(len(restarted._exclusions()), 1)
        result = Provider(restarted).list({'grant': self.ident, 'path': 'home'})
        self.assertEqual([entry['name'] for entry in result['entries']], ['public'])
        self.assertEqual(self.provider.read({'grant': self.ident, 'path': 'home/public/real.txt'})['size'], 12)

    def test_private_list_read_hash_and_mutations_are_denied(self):
        for method, path in (('list', 'home/native-state'), ('read', 'home/native-state/bootstrap.key'),
                             ('hash', 'home/native-state/state.sqlite3')):
            with self.subTest(method=method), self.assertRaises(APIError) as caught:
                getattr(self.provider, method)({'grant': self.ident, 'path': path})
            self.assertEqual(caught.exception.code, 'PRIVATE_STATE')
        for action in ('copy', 'move', 'rename', 'trash'):
            for path in ('home', 'home/native-state', 'home/native-state/bootstrap.key'):
                extra = {'name': 'renamed'} if action == 'rename' else {}
                if action in ('copy', 'move'):
                    extra['destination'] = {'grant': self.ident, 'path': 'destination'}
                with self.subTest(action=action, path=path), self.assertRaises(APIError) as caught:
                    self.operation(action, path, **extra)
                self.assertEqual(caught.exception.code, 'PRIVATE_STATE')
        with self.assertRaises(APIError):
            self.provider.operate({'id': uuid.uuid4().hex, 'action': 'mkdir', 'sources': [], 'name': 'bad',
                                  'destination': {'grant': self.ident, 'path': 'home/native-state'}})
        self.assertEqual(list(self.destination.iterdir()), [])
        self.assertEqual(len(self.state.bootstrap_key()), 32)

    def test_public_copy_and_move_still_work_under_broad_scope(self):
        result = self.operation('copy', 'home/public/real.txt', destination={'grant': self.ident, 'path': 'destination'})
        self.assertEqual(result['receipt']['status'], 'completed')
        self.assertEqual((self.destination / 'real.txt').read_bytes(), b'public bytes')
        result = self.operation('rename', 'home/public/real.txt', name='renamed.txt')
        self.assertEqual(result['receipt']['status'], 'completed')
        self.assertEqual((self.public / 'renamed.txt').read_bytes(), b'public bytes')

    def test_symlink_and_hardlink_aliases_cannot_expose_private_files(self):
        (self.public / 'alias').symlink_to(self.private, target_is_directory=True)
        with self.assertRaises(OSError):
            self.provider.read({'grant': self.ident, 'path': 'home/public/alias/bootstrap.key'})
        os.link(self.private / 'bootstrap.key', self.public / 'key-alias')
        with self.assertRaises(APIError) as caught:
            self.provider.read({'grant': self.ident, 'path': 'home/public/key-alias'})
        self.assertEqual(caught.exception.code, 'HARDLINK_DENIED')
        result = self.provider.list({'grant': self.ident, 'path': 'home/public'})
        self.assertEqual([entry['name'] for entry in result['entries']], ['real.txt'])

    def test_held_directory_moved_into_private_subtree_is_denied(self):
        grant = self.state.get_grant(self.ident)
        with root_fd(grant) as root, directory(root, ['home', 'public']) as fd:
            self.public.rename(self.private / 'hidden')
            with self.assertRaises(APIError) as caught:
                self.state.check_fd(fd)
            self.assertEqual(caught.exception.code, 'PRIVATE_STATE')

    def test_replaced_root_and_revocation_still_fail_closed(self):
        # A separate root can be replaced without moving the active SQLite state.
        narrow = self.state.grant(self.destination, writable=True)
        self.destination.rename(self.volume / 'old-destination')
        self.destination.mkdir()
        with self.assertRaises(APIError) as caught:
            self.provider.list({'grant': narrow})
        self.assertEqual(caught.exception.code, 'GRANT_CHANGED')
        self.state.revoke_grant(self.ident)
        with self.assertRaises(APIError):
            self.provider.list({'grant': self.ident})
        with self.assertRaises(APIError):
            State(self.private).get_grant(self.ident)

    def test_runtime_and_manifest_protection_is_persistent_and_live(self):
        runtime = self.home / 'installed-runtime'
        runtime.mkdir()
        (runtime / 'launcher.py').write_text('trusted code')
        manifest = self.home / 'org.atlas.json'
        manifest.write_text('trusted native host manifest')
        # A separate trusted installer updates exclusions while provider remains live.
        installer_state = State(self.private)
        installer_state.protect_path(runtime)
        installer_state.protect_path(manifest)
        self.assertEqual([entry['name'] for entry in self.provider.list({'grant': self.ident, 'path': 'home'})['entries']], ['public'])
        for method, path in (('read', 'home/installed-runtime/launcher.py'), ('read', 'home/org.atlas.json')):
            with self.assertRaises(APIError):
                getattr(self.provider, method)({'grant': self.ident, 'path': path})
        self.assertEqual(len(State(self.private)._exclusions()), 3)
        with self.assertRaises(APIError):
            self.operation('trash', 'home/installed-runtime')
        # A renamed protected file still has its persisted inode exclusion.
        manifest.rename(self.home / 'disguised.json')
        with self.assertRaises(APIError) as caught:
            self.provider.read({'grant': self.ident, 'path': 'home/disguised.json'})
        self.assertEqual(caught.exception.code, 'PRIVATE_STATE')

    def test_revoking_during_copy_cleans_staging_without_publishing(self):
        source = self.public / 'large.bin'
        source.write_bytes(b'a' * (2 * 1024 * 1024))
        original_check = self.provider._copy_authority
        calls = 0
        def revoke_mid_copy(budget):
            nonlocal calls
            calls += 1
            if calls == 2:
                self.state.revoke_grant(self.ident)
            return original_check(budget)
        with patch.object(self.provider, '_copy_authority', side_effect=revoke_mid_copy):
            result = self.operation('copy', 'home/public/large.bin', destination={'grant': self.ident, 'path': 'destination'})
        self.assertEqual(result['receipt']['status'], 'failed')
        self.assertEqual(result['receipt']['results'][0]['error']['code'], 'UNAUTHORIZED')
        self.assertEqual(list(self.destination.iterdir()), [])
        self.assertEqual(source.stat().st_size, 2 * 1024 * 1024)

    def test_deliberate_filesystem_root_read_excludes_private_state(self):
        ident = self.state.grant('/', allow_broad=True)
        path = str(self.public / 'real.txt').lstrip('/')
        self.assertEqual(self.provider.read({'grant': ident, 'path': path})['size'], 12)
        with self.assertRaises(APIError) as caught:
            self.provider.read({'grant': ident, 'path': str(self.private / 'bootstrap.key').lstrip('/')})
        self.assertEqual(caught.exception.code, 'PRIVATE_STATE')

    def test_v1_migration_preserves_clients_grants_receipts_and_marks_v2(self):
        import hashlib
        import json
        import sqlite3
        old_dir = self.volume / 'old-authority-state'
        old_dir.mkdir()
        info = self.public.stat()
        with sqlite3.connect(old_dir / 'state.sqlite3') as database:
            database.executescript('''
                CREATE TABLE clients(origin TEXT PRIMARY KEY,digest TEXT NOT NULL);
                CREATE TABLE grants(id TEXT PRIMARY KEY,root TEXT UNIQUE NOT NULL,label TEXT NOT NULL,
                    device INTEGER NOT NULL,inode INTEGER NOT NULL,writable INTEGER NOT NULL);
                CREATE TABLE receipts(id TEXT PRIMARY KEY,request TEXT NOT NULL,result TEXT,created REAL NOT NULL);
                PRAGMA user_version=1;
            ''')
            database.execute('INSERT INTO grants VALUES (?,?,?,?,?,?)', ('preserved-grant', str(self.public), 'Public', info.st_dev, info.st_ino, 1))
            database.execute('INSERT INTO clients VALUES (?,?)', ('chrome-extension://' + 'a' * 32, hashlib.sha256(b'preserved-token').hexdigest()))
            database.execute('INSERT INTO receipts VALUES (?,?,NULL,?)', ('preserved-receipt', json.dumps({'action': 'copy'}), 1))
        migrated = State(old_dir)
        self.assertTrue(migrated.authenticate('chrome-extension://' + 'a' * 32, 'preserved-token'))
        self.assertEqual(migrated.get_grant('preserved-grant')['broad'], 0)
        with migrated.connect() as database:
            self.assertEqual(database.execute('PRAGMA user_version').fetchone()[0], 2)
            self.assertEqual(database.execute('SELECT id FROM receipts').fetchone()[0], 'preserved-receipt')
        self.assertEqual(Provider(migrated).read({'grant': 'preserved-grant', 'path': 'real.txt'})['size'], 12)

    def test_future_state_v3_is_rejected_without_downgrade(self):
        with self.state.connect() as database:
            database.execute('PRAGMA user_version=3')
        with self.assertRaises(APIError) as caught:
            State(self.private)
        self.assertEqual(caught.exception.code, 'UNSUPPORTED_STATE_VERSION')
        with self.state.connect() as database:
            self.assertEqual(database.execute('PRAGMA user_version').fetchone()[0], 3)
