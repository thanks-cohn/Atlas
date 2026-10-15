"""Independent negative oracles for explicit local authority boundaries."""
import concurrent.futures
import os
import tempfile
import unittest
from pathlib import Path
from atlas_companion.security import APIError, parts, name, open_absolute_directory, root_fd, parent, regular_stat, rename_no_replace
from atlas_companion.state import State


@unittest.skipUnless(os.name == 'posix', 'Linux descriptor boundary')
class CompanionSecurityTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.root = self.base / 'granted'
        self.root.mkdir()
        self.outside = self.base / 'ungranted'
        self.outside.mkdir()
        (self.outside / 'secret.txt').write_bytes(b'private outside grant')
        (self.root / 'authorized.txt').write_bytes(b'authorized')
        self.state = State(self.base / 'state')
        self.ident = self.state.grant(str(self.root))

    def test_path_spellings_denied_before_access(self):
        for value in ('../ungranted/secret.txt', '/etc/passwd', 'sub/../file', './file', 'a//b', 'a\\b', 'nul\x00x', '.atlas-trash/deleted', ''):
            with self.subTest(value=value), self.assertRaises(APIError):
                parts(value, False)
        for value in ('a/b', '../bad', '/bad'):
            with self.subTest(name=value), self.assertRaises(APIError):
                name(value)

    def test_symlink_root_and_intermediate_escape_denied(self):
        link = self.base / 'root-link'
        link.symlink_to(self.root, target_is_directory=True)
        with self.assertRaises(OSError):
            self.state.grant(str(link))
        (self.root / 'escape').symlink_to(self.outside, target_is_directory=True)
        grant = self.state.get_grant(self.ident)
        with root_fd(grant) as fd:
            with self.assertRaises(OSError):
                with parent(fd, 'escape/secret.txt'):
                    self.fail('Followed symlink outside grant')
            with self.assertRaises(APIError):
                regular_stat(fd, 'escape')
        self.assertEqual((self.outside / 'secret.txt').read_bytes(), b'private outside grant')

    def test_replaced_granted_directory_denied(self):
        grant = self.state.get_grant(self.ident)
        self.root.rename(self.base / 'original-grant')
        self.root.mkdir()
        with self.assertRaisesRegex(APIError, 'identity changed'):
            with root_fd(grant):
                self.fail('Granted path was replaced')

    def test_auth_binds_exact_origin_token_pair_and_revocation(self):
        extension = 'a' * 32
        token = self.state.pair(extension)
        origin = 'chrome-extension://' + extension
        self.assertTrue(self.state.authenticate(origin, token))
        for hostile_origin in ('http://localhost', 'https://evil.example', 'chrome-extension://' + 'b' * 32, origin + '.evil'):
            self.assertFalse(self.state.authenticate(hostile_origin, token))
        for hostile_token in ('', token + 'x', 'wrong', None):
            self.assertFalse(self.state.authenticate(origin, hostile_token))
        replacement = self.state.pair(extension)
        self.assertFalse(self.state.authenticate(origin, token))
        self.assertTrue(self.state.authenticate(origin, replacement))
        self.state.revoke_client(extension)
        self.assertFalse(self.state.authenticate(origin, replacement))
        self.assertNotIn(replacement.encode(), self.state.path.read_bytes())

    def test_readonly_and_revoked_grants_deny_mutation(self):
        with self.assertRaisesRegex(APIError, 'read-only'):
            self.state.get_grant(self.ident, write=True)
        self.state.revoke_grant(self.ident)
        with self.assertRaisesRegex(APIError, 'revoked'):
            self.state.get_grant(self.ident)

    def test_atomic_rename_never_overwrites_conflict(self):
        (self.root / 'existing.txt').write_bytes(b'original target')
        with root_fd(self.state.get_grant(self.ident)) as fd:
            with self.assertRaises(FileExistsError):
                rename_no_replace(fd, 'authorized.txt', fd, 'existing.txt')
        self.assertEqual((self.root / 'authorized.txt').read_bytes(), b'authorized')
        self.assertEqual((self.root / 'existing.txt').read_bytes(), b'original target')

    def test_idempotent_receipts_bind_arguments_and_unknown_outcome(self):
        ident = 'operation_123456789'
        request = {'action': 'copy', 'path': 'authorized.txt'}
        self.assertIsNone(self.state.begin(ident, request))
        with self.assertRaisesRegex(APIError, 'Interrupted operation'):
            self.state.begin(ident, request)
        self.state.finish(ident, {'copied': True})
        self.assertEqual(self.state.begin(ident, request), {'copied': True})
        with self.assertRaisesRegex(APIError, 'different arguments'):
            self.state.begin(ident, {'action': 'delete', 'path': 'authorized.txt'})


class ProviderBehaviorTests(unittest.TestCase):
    """Real byte-level provider oracles, including failed operation effects."""
    def setUp(self):
        CompanionSecurityTests.setUp(self)
        from atlas_companion.filesystem import Provider
        from atlas_core import GraphStore
        self.ident = self.state.grant(str(self.root), writable=True)
        self.graph = GraphStore(self.base / 'graph.sqlite3')
        self.provider = Provider(self.state, self.graph)

    def operation(self, action, path=None, **extra):
        import uuid
        request = {'id': uuid.uuid4().hex, 'action': action,
                   'sources': [{'grant': self.ident, 'path': path}] if path is not None else []}
        request.update(extra)
        return self.provider.operate(request)

    def test_actual_copy_move_trash_restore_and_replay_bytes(self):
        (self.root / 'target').mkdir()
        destination = {'grant': self.ident, 'path': 'target'}
        copied = self.operation('copy', 'authorized.txt', destination=destination)
        self.assertEqual(copied['receipt']['status'], 'completed')
        self.assertEqual((self.root / 'target/authorized.txt').read_bytes(), b'authorized')
        self.assertEqual((self.root / 'authorized.txt').read_bytes(), b'authorized')
        renamed = self.operation('rename', 'target/authorized.txt', name='renamed.txt')
        self.assertEqual(renamed['receipt']['status'], 'completed')
        trashed = self.operation('trash', 'target/renamed.txt')
        self.assertFalse((self.root / 'target/renamed.txt').exists())
        trash_id = trashed['receipt']['results'][0]['trash_id']
        restored = self.operation('restore', trash_id, destination=destination)
        self.assertEqual(restored['receipt']['status'], 'completed')
        self.assertEqual((self.root / 'target/renamed.txt').read_bytes(), b'authorized')
        import uuid
        request = {'id': uuid.uuid4().hex, 'action': 'rename', 'name': 'moved.txt',
                   'sources': [{'grant': self.ident, 'path': 'target/renamed.txt'}]}
        first = self.provider.operate(request)
        replay = self.provider.operate(request)
        self.assertTrue(replay['replayed'])
        self.assertEqual(first['receipt'], replay['receipt'])
        self.assertEqual((self.root / 'target/moved.txt').read_bytes(), b'authorized')

    def test_copy_symlink_fails_without_publishing_partial_tree(self):
        source = self.root / 'source'
        source.mkdir()
        (source / 'safe.txt').write_bytes(b'safe')
        (source / 'escape').symlink_to(self.outside, target_is_directory=True)
        (self.root / 'target').mkdir()
        result = self.operation('copy', 'source', destination={'grant': self.ident, 'path': 'target'})
        self.assertEqual(result['receipt']['status'], 'failed')
        self.assertFalse((self.root / 'target/source').exists())
        self.assertEqual(list((self.root / 'target').iterdir()), [])
        self.assertEqual((self.outside / 'secret.txt').read_bytes(), b'private outside grant')

    def test_preview_is_byte_exact_and_symlink_denied(self):
        import base64
        (self.root / 'escape').symlink_to(self.outside / 'secret.txt')
        result = self.provider.read({'grant': self.ident, 'path': 'authorized.txt'})
        self.assertEqual(base64.b64decode(result['data']), b'authorized')
        with self.assertRaises(OSError):
            self.provider.read({'grant': self.ident, 'path': 'escape'})
        listing = self.provider.list({'grant': self.ident, 'path': ''})
        self.assertNotIn('escape', [entry['name'] for entry in listing['entries']])

    def test_folder_move_reconciles_resource_ids(self):
        resource = self.graph.mutate('add_resource', {'kind': 'file', 'title': 'Authorized',
            'locators': [{'provider': 'local', 'reference': self.ident + '/authorized.txt'}]})['result']
        self.graph.mutate('tag', {'resource': resource, 'tag': 'retained'})
        result = self.operation('rename', 'authorized.txt', name='new.txt')
        self.assertEqual(result['receipt']['status'], 'completed')
        data = self.graph.read().data
        self.assertEqual(data['resources'][resource]['locators'][0]['reference'], self.ident + '/new.txt')
        self.assertEqual(data['tags'][resource], ['retained'])

    def test_mkdir_move_conflict_partial_and_recursive_denial(self):
        import uuid
        created = self.operation('mkdir', destination={'grant': self.ident, 'path': ''}, name='target')
        self.assertEqual(created['receipt']['status'], 'completed')
        (self.root / 'second.txt').write_bytes(b'second content')
        (self.root / 'target/authorized.txt').write_bytes(b'keep destination')
        request = {'id': uuid.uuid4().hex, 'action': 'copy', 'sources': [
            {'grant': self.ident, 'path': 'authorized.txt'}, {'grant': self.ident, 'path': 'second.txt'}],
            'destination': {'grant': self.ident, 'path': 'target'}}
        result = self.provider.operate(request)
        self.assertEqual(result['receipt']['status'], 'partial')
        self.assertEqual(result['receipt']['results'][0]['error']['code'], 'CONFLICT')
        self.assertEqual((self.root / 'target/authorized.txt').read_bytes(), b'keep destination')
        self.assertEqual((self.root / 'target/second.txt').read_bytes(), b'second content')
        moved = self.operation('move', 'second.txt', destination={'grant': self.ident, 'path': ''})
        self.assertEqual(moved['receipt']['status'], 'failed')
        self.assertTrue((self.root / 'second.txt').exists())
        (self.root / 'target/second.txt').unlink()
        moved = self.operation('move', 'second.txt', destination={'grant': self.ident, 'path': 'target'})
        self.assertEqual(moved['receipt']['status'], 'completed')
        self.assertFalse((self.root / 'second.txt').exists())
        self.assertEqual((self.root / 'target/second.txt').read_bytes(), b'second content')
        (self.root / 'target/inner').mkdir()
        recursive = self.operation('copy', 'target', destination={'grant': self.ident, 'path': 'target/inner'})
        self.assertEqual(recursive['receipt']['status'], 'failed')
        self.assertEqual(recursive['receipt']['results'][0]['error']['code'], 'RECURSIVE_DESTINATION')
        self.assertEqual(list((self.root / 'target/inner').iterdir()), [])

    def test_symlink_write_and_restore_scope_denied(self):
        (self.root / 'escape').symlink_to(self.outside, target_is_directory=True)
        destination = {'grant': self.ident, 'path': 'escape'}
        result = self.operation('copy', 'authorized.txt', destination=destination)
        self.assertEqual(result['receipt']['status'], 'failed')
        self.assertFalse((self.outside / 'authorized.txt').exists())
        escaped = self.operation('rename', 'escape/secret.txt', name='stolen.txt')
        self.assertEqual(escaped['receipt']['status'], 'failed')
        self.assertTrue((self.outside / 'secret.txt').exists())
        self.assertFalse((self.outside / 'stolen.txt').exists())
        result = self.operation('restore', 'a' * 32, destination={'grant': self.ident, 'path': ''})
        self.assertEqual(result['receipt']['status'], 'failed')
        self.assertEqual(result['receipt']['results'][0]['error']['code'], 'NOT_FOUND')
