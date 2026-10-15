"""Real Windows mutation tests; Linux skips confer no Windows runtime proof."""
import base64
import hashlib
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
import uuid

from atlas_companion.security import APIError
from atlas_companion.windows_filesystem import Provider, path_parts
from atlas_companion.windows_provider import WindowsBoundaryError, WindowsRoot


class WindowsOperationGrammarTests(unittest.TestCase):
    def test_windows_grammar_is_checked_before_any_grant_lookup(self):
        provider = Provider(None)
        for name in ('CON.txt', 'file:stream', 'a/b', '.atlas-trash', '.ATLAS-trash', 'ending.'):
            with self.subTest(name=name), self.assertRaises(APIError):
                provider.operate({'action': 'mkdir', 'name': name})
        for path in ('../escape', 'C:/outside', r'a\b', '.atlas-trash/token'):
            with self.subTest(path=path), self.assertRaises(APIError):
                path_parts(path)


@unittest.skipUnless(os.name == 'nt', 'Requires actual Windows NT handles and private DACL state')
class WindowsOperationsTests(unittest.TestCase):
    def setUp(self):
        from atlas_companion.windows_state import WindowsState
        self.temp = tempfile.TemporaryDirectory()
        base = Path(self.temp.name)
        self.root = base / 'files'
        self.root.mkdir()
        self.state = WindowsState(str(base / 'private'))
        self.grant = self.state.grant(str(self.root), writable=True)
        self.provider = Provider(self.state)

    def tearDown(self):
        self.state.close()
        self.temp.cleanup()

    def operate(self, action, path=None, name=None, destination='', ident=None):
        request = {'id': ident or uuid.uuid4().hex, 'action': action}
        if path is not None:
            request['sources'] = [{'grant': self.grant, 'path': path}]
        if name is not None:
            request['name'] = name
        if action in ('mkdir', 'copy', 'move', 'restore'):
            request['destination'] = {'grant': self.grant, 'path': destination}
        return self.provider.operate(request)

    def ok(self, response):
        receipt = response['receipt']
        self.assertEqual(receipt['status'], 'completed', receipt)
        return receipt['results'][0]

    def test_real_mkdir_copy_rename_move_hash_read(self):
        data = bytes(range(256)) * 8192 + b'bounded-copy-end'
        (self.root / 'source.bin').write_bytes(data)
        self.ok(self.operate('mkdir', name='destination'))
        self.ok(self.operate('copy', 'source.bin', name='copied.bin'))
        self.assertEqual((self.root / 'copied.bin').read_bytes(), data)
        self.ok(self.operate('rename', 'copied.bin', name='renamed.bin'))
        self.ok(self.operate('move', 'renamed.bin', destination='destination'))
        self.assertFalse((self.root / 'renamed.bin').exists())
        target = 'destination/renamed.bin'
        digest = self.provider.hash({'grant': self.grant, 'path': target})
        self.assertEqual(digest['sha256'], hashlib.sha256(data).hexdigest())
        self.assertEqual(digest['size'], len(data))
        (self.root / 'small.txt').write_bytes(b'actual bytes')
        preview = self.provider.read({'grant': self.grant, 'path': 'small.txt'})
        self.assertEqual(base64.b64decode(preview['data']), b'actual bytes')

    def test_no_overwrite_and_exact_idempotent_replay(self):
        (self.root / 'source').write_bytes(b'source')
        (self.root / 'occupied').write_bytes(b'never replace')
        for action in ('copy', 'rename'):
            result = self.operate(action, 'source', name='occupied')['receipt']
            self.assertEqual(result['status'], 'failed', result)
            self.assertEqual((self.root / 'occupied').read_bytes(), b'never replace')
            self.assertEqual((self.root / 'source').read_bytes(), b'source')
        ident = uuid.uuid4().hex
        self.ok(self.operate('rename', 'source', name='once', ident=ident))
        response = self.operate('rename', 'source', name='once', ident=ident)
        self.assertTrue(response['replayed'])
        self.assertEqual((self.root / 'once').read_bytes(), b'source')
        self.assertFalse(any(p.name.startswith('.atlas-copy-') for p in self.root.iterdir()))

    def test_file_and_directory_trash_restore_receipts(self):
        (self.root / 'folder').mkdir()
        (self.root / 'folder' / 'keep').write_bytes(b'recover me')
        trashed = self.ok(self.operate('trash', 'folder'))
        self.assertTrue(trashed['recoverable'])
        self.assertFalse((self.root / 'folder').exists())
        self.assertEqual(self.provider.list({'grant': self.grant})['entries'], [])
        (self.root / 'folder').mkdir()
        conflict = self.operate('restore', trashed['trash_id'])['receipt']
        self.assertEqual(conflict['status'], 'failed', conflict)
        self.assertEqual(list((self.root / 'folder').iterdir()), [])
        (self.root / 'folder').rmdir()
        self.ok(self.operate('restore', trashed['trash_id']))
        self.assertEqual((self.root / 'folder' / 'keep').read_bytes(), b'recover me')
        failed = self.operate('restore', trashed['trash_id'])['receipt']
        self.assertEqual(failed['status'], 'failed')
        with self.assertRaises(APIError):
            self.provider.read({'grant': self.grant, 'path': '.atlas-trash/' + trashed['trash_id']})

    def test_directory_copy_fails_closed_and_move_is_real(self):
        (self.root / 'folder').mkdir()
        (self.root / 'folder' / 'keep').write_bytes(b'not copied')
        result = self.operate('copy', 'folder', name='copied')['receipt']
        self.assertEqual(result['status'], 'failed', result)
        self.assertEqual(result['results'][0]['error']['code'], 'UNSUPPORTED_ENTRY')
        self.assertFalse((self.root / 'copied').exists())
        self.ok(self.operate('mkdir', name='destination'))
        self.ok(self.operate('move', 'folder', destination='destination'))
        self.assertEqual((self.root / 'destination' / 'folder' / 'keep').read_bytes(), b'not copied')

    def test_reparse_and_hardlink_sources_never_mutated(self):
        outside = Path(self.temp.name) / 'outside'
        outside.mkdir()
        (outside / 'keep').write_bytes(b'outside')
        result = subprocess.run(['cmd', '/c', 'mklink', '/J', str(self.root / 'escape'), str(outside)], capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr.decode(errors='replace'))
        for action in ('trash', 'rename', 'copy'):
            receipt = self.operate(action, 'escape', name='moved' if action != 'trash' else None)['receipt']
            self.assertEqual(receipt['status'], 'failed', receipt)
        self.assertEqual((outside / 'keep').read_bytes(), b'outside')
        os.link(outside / 'keep', self.root / 'hardlink')
        receipt = self.operate('rename', 'hardlink', name='renamed')['receipt']
        self.assertEqual(receipt['status'], 'failed', receipt)
        self.assertEqual((outside / 'keep').read_bytes(), b'outside')

    def test_revocation_during_copy_prevents_publication(self):
        (self.root / 'source').write_bytes(b'x' * (3 * 1024 * 1024))
        original = self.provider._authority
        count = [0]
        def authority(grant, path, write=False, recursive=False):
            if write and path == 'copy':
                count[0] += 1
                if count[0] >= 5:
                    raise APIError('REVOKED', 'Test revocation during streaming.', 403)
            return original(grant, path, write, recursive)
        self.provider._authority = authority
        receipt = self.operate('copy', 'source', name='copy')['receipt']
        self.assertEqual(receipt['status'], 'failed', receipt)
        self.assertFalse((self.root / 'copy').exists())
        self.assertFalse(any(p.name.startswith('.atlas-copy-') for p in self.root.iterdir()))

    def test_unreceipted_restore_and_readonly_grant_denied(self):
        receipt = self.operate('restore', uuid.uuid4().hex)['receipt']
        self.assertEqual(receipt['status'], 'failed', receipt)
        (self.root / 'source').write_bytes(b'unchanged')
        self.state.grant(str(self.root), writable=False)
        with self.assertRaises(APIError):
            self.operate('trash', 'source')
        self.assertEqual((self.root / 'source').read_bytes(), b'unchanged')

    def test_unprotected_existing_recovery_folder_denied(self):
        (self.root / '.atlas-trash').mkdir()
        (self.root / 'source').write_bytes(b'must remain')
        receipt = self.operate('trash', 'source')['receipt']
        self.assertEqual(receipt['status'], 'failed', receipt)
        self.assertEqual((self.root / 'source').read_bytes(), b'must remain')

    def test_recovery_receipt_rejects_replaced_entry(self):
        (self.root / 'source').write_bytes(b'original')
        trashed = self.ok(self.operate('trash', 'source'))
        entry = self.root / '.atlas-trash' / trashed['trash_id']
        entry.rename(entry.with_name('original-held'))
        entry.write_bytes(b'forged replacement')
        receipt = self.operate('restore', trashed['trash_id'])['receipt']
        self.assertEqual(receipt['status'], 'failed', receipt)
        self.assertEqual(receipt['results'][0]['error']['code'], 'RECOVERY_CHANGED')
        self.assertFalse((self.root / 'source').exists())

    def test_copy_source_handle_excludes_writers_and_native_create_is_exclusive(self):
        (self.root / 'source').write_bytes(b'unchanged')
        grant = self.state.get_grant(self.grant)
        with self.provider._root(grant) as root:
            with self.provider._source(root, 'source', write=False):
                with self.assertRaises(OSError):
                    (self.root / 'source').write_bytes(b'race')
            handle = root._relative(root.handle, 'new-file', False, access=0x100082, disposition=2)
            root.kernel.CloseHandle(handle)
            with self.assertRaises(OSError):
                root._relative(root.handle, 'new-file', False, access=0x100082, disposition=2)
        self.assertEqual((self.root / 'source').read_bytes(), b'unchanged')
