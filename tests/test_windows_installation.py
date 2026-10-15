"""Installer tests on the real Windows registry and SID-restricted filesystem."""
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch


@unittest.skipUnless(sys.platform == 'win32', 'Requires actual Windows filesystem and registry')
class WindowsInstallationTests(unittest.TestCase):
    def setUp(self):
        from atlas_companion import windows_install as install
        self.install = install
        self.temp = tempfile.TemporaryDirectory(prefix='atlas install tests ')
        self.base = Path(self.temp.name)
        self.binary = self.base / 'test-runtime.exe'
        self.binary.write_bytes(b'MZ' + b'installer fixture; never executed')
        self.directory = self.base / 'program files'
        self.state = self.base / 'private state'
        # Disposable real HKCU namespace avoids touching a user's Chrome setup.
        self.registry = 'Software\\AtlasTests\\' + os.urandom(12).hex()
        self.key_patch = patch.object(install, '_registry', return_value=self.registry)
        self.key_patch.start()
        self.extension = 'a' * 32

    def tearDown(self):
        self.install._registration(self.registry, remove=True)
        self.key_patch.stop()
        self.temp.cleanup()

    def install_runtime(self, **kwargs):
        return self.install.install_runtime(self.extension, state_dir=self.state, install_dir=self.directory,
                                            binary=self.binary, **kwargs)

    def test_pair_without_roots_exact_manifest_and_owned_receipt(self):
        result = self.install_runtime()
        manifest = json.loads(Path(result['paths'][2]).read_text())
        self.assertEqual(manifest['allowed_origins'], ['chrome-extension://' + self.extension + '/'])
        self.assertEqual(manifest['path'], str(self.directory / 'atlas-native.exe'))
        self.assertEqual(self.install._registration(self.registry), result['paths'][2])
        from atlas_companion.windows_state import WindowsState
        state = WindowsState(self.state)
        self.assertEqual(state.grants(), [])
        self.assertTrue(state.known_origin('chrome-extension://' + self.extension))
        if hasattr(state, 'close'):
            state.close()
        receipt = json.loads(Path(result['receipt']).read_text())
        self.assertEqual(receipt['mode'], 'standalone-windows')
        for name, digest in receipt['owned'].items():
            self.assertEqual(self.install._digest(name), digest)

    def test_explicit_upgrade_and_modified_files_refused(self):
        self.install_runtime()
        with self.assertRaises(ValueError):
            self.install_runtime()
        self.install_runtime(upgrade=True)
        (self.directory / 'native.json').write_text('{}')
        with self.assertRaises(ValueError):
            self.install_runtime(upgrade=True)

    def test_uninstall_retains_modified_file_and_state_revokes_pairing(self):
        self.install_runtime()
        config = self.directory / 'native.json'
        config.write_text('user modified')
        result = self.install.uninstall(self.directory)
        self.assertIn(str(config), result['retained_modified'])
        self.assertTrue(config.exists())
        self.assertTrue(self.state.exists())
        self.assertTrue(Path(result['runtime_preserved']).exists())
        self.assertIsNone(self.install._registration(self.registry))
        from atlas_companion.windows_state import WindowsState
        state = WindowsState(self.state)
        self.assertFalse(state.known_origin('chrome-extension://' + self.extension))
        if hasattr(state, 'close'):
            state.close()

    def test_invalid_identity_and_non_pe_refused(self):
        with self.assertRaises(ValueError):
            self.install.install_runtime('https://evil.invalid', binary=self.binary, install_dir=self.directory)
        self.binary.write_bytes(b'not PE')
        with self.assertRaises(ValueError):
            self.install_runtime()


if __name__ == '__main__':
    unittest.main()
