"""Windows kernel boundary tests: must execute on Windows, never inferred from Linux."""
import ctypes
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

from atlas_companion.windows_provider import WindowsBoundaryError, WindowsRoot, components, root_components, _DirectoryEntry


class WindowsPathContractTests(unittest.TestCase):
    def test_reject_ambiguous_device_and_stream_names(self):
        for value in ('../secret', '/absolute', r'a\b', 'C:/secret', 'file:stream', 'CON', 'nul.txt', 'COM1', 'LPT².txt',
                      'trailing.', 'space ', 'a//b', '.', 'a/..', 'a\x00b', '.atlas-private', 'bad?name', '\ud800'):
            with self.subTest(value=repr(value)):
                with self.assertRaises(WindowsBoundaryError):
                    components(value, False)
        self.assertEqual(components('Research/wing.png'), ['Research', 'wing.png'])

    def test_only_explicit_local_drive_roots(self):
        self.assertEqual(root_components('c:\\Users\\Person'), ('C:\\', ['Users', 'Person']))
        for value in ('relative', 'C:relative', r'\rooted', r'\\server\share', r'\\?\C:\path', r'\\.\PhysicalDrive0'):
            with self.assertRaises(WindowsBoundaryError):
                root_components(value)

    @unittest.skipIf(os.name == 'nt', 'Non-Windows fail-closed check')
    def test_linux_cannot_emulate_windows_authority(self):
        with self.assertRaises(OSError):
            WindowsRoot('C:\\')


@unittest.skipUnless(os.name == 'nt', 'Requires actual Windows kernel/file handles')
class WindowsKernelProviderTests(unittest.TestCase):
    def test_native_directory_structure_layout(self):
        self.assertEqual(_DirectoryEntry.FileName.offset, 104)

    def test_real_list_read_identity_and_bounded_bytes(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / 'sub').mkdir()
            content = bytes(range(256)) * 20
            (root / 'sub' / 'bytes.bin').write_bytes(content)
            (root / 'empty').write_bytes(b'')
            with WindowsRoot(folder) as granted:
                self.assertEqual({e['name'] for e in granted.list()}, {'sub', 'empty'})
                self.assertEqual(granted.read('sub/bytes.bin'), content)
                self.assertEqual(granted.read('empty'), b'')
                identity = granted.identity
                with self.assertRaises(WindowsBoundaryError):
                    granted.read('sub/bytes.bin', limit=8)
                with self.assertRaises((OSError, WindowsBoundaryError)):
                    granted.read('../outside')
            with WindowsRoot(folder, expected_identity=identity) as reopened:
                self.assertEqual(reopened.read('sub/bytes.bin'), content)
            with self.assertRaises(WindowsBoundaryError):
                WindowsRoot(folder, expected_identity=(0, 'not-the-root'))

    def test_protected_directory_and_hardlink_alias_denied(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder); private = root / 'native-private'; private.mkdir()
            key = private / 'bootstrap.key'; key.write_bytes(b'not-for-browser')
            os.link(key, root / 'alias.bin')
            with WindowsRoot(folder, excluded_paths=(str(private), str(key))) as granted:
                self.assertEqual(granted.list(), [])
                for path in ('native-private/bootstrap.key', 'alias.bin'):
                    with self.assertRaises((OSError, WindowsBoundaryError)):
                        granted.read(path)

    def test_real_directory_junction_denied_without_elevation(self):
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder); root = base / 'root'; outside = base / 'outside'
            root.mkdir(); outside.mkdir(); (outside / 'secret.txt').write_bytes(b'outside')
            result = subprocess.run(['cmd', '/c', 'mklink', '/J', str(root / 'escape'), str(outside)], capture_output=True)
            self.assertEqual(result.returncode, 0, result.stderr.decode(errors='replace'))
            with WindowsRoot(str(root)) as granted:
                self.assertEqual(granted.list(), [])
                with self.assertRaises((OSError, WindowsBoundaryError)):
                    granted.read('escape/secret.txt')
            with self.assertRaises((OSError, WindowsBoundaryError)):
                WindowsRoot(str(root / 'escape'))
            self.assertEqual((outside / 'secret.txt').read_bytes(), b'outside')

    def test_held_directory_cannot_be_reparented_during_access(self):
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder); root = base / 'root'; root.mkdir(); (root / 'file').write_bytes(b'stable')
            with WindowsRoot(str(root)) as granted:
                with self.assertRaises(OSError):
                    root.rename(base / 'moved')
                self.assertEqual(granted.read('file'), b'stable')
            root.rename(base / 'moved')
