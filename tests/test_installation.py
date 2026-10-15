"""Installation independence, preservation and explicit upgrade behavior."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
import uuid
from unittest.mock import patch

from atlas_companion.install import install, install_runtime, uninstall
from atlas_companion.state import State
from atlas_companion.filesystem import Provider
from atlas_companion.security import APIError


class InstallationTests(unittest.TestCase):
    def test_source_snapshot_runs_from_spaced_path_without_checkout_pythonpath(self):
        with tempfile.TemporaryDirectory(prefix='atlas installation ') as folder:
            base = Path(folder)
            paths = install('a' * 32, base / 'app files', base / 'manifests', base / 'private state')
            manifest = json.loads(paths[2].read_text())
            self.assertEqual(manifest['allowed_origins'], ['chrome-extension://' + 'a' * 32 + '/'])
            env = {k: v for k, v in os.environ.items() if k not in ('PYTHONPATH', 'PYTHONHOME')}
            run = subprocess.run([str(base / 'app files/atlas'), 'grants'], capture_output=True, text=True,
                                 cwd='/tmp', env=env, timeout=10)
            self.assertEqual(run.returncode, 0, run.stderr)
            self.assertEqual(json.loads(run.stdout), {'grants': []})
            receipt = json.loads((base / 'app files/installation.json').read_text())
            self.assertEqual(receipt['mode'], 'source-snapshot-requires-python')
            self.assertNotIn(str(Path(__file__).resolve().parents[1]), paths[1].read_text())
            self.assertTrue(Path(receipt['runtime']).is_dir())
            self.assertEqual(State(base / 'private state').grants(), [])
            state = State(base / 'private state')
            broad = state.grant(str(base), writable=True, allow_broad=True)
            with self.assertRaises(APIError) as denied:
                Provider(state).operate({'id': uuid.uuid4().hex, 'action': 'rename',
                        'sources': [{'grant': broad, 'path': 'app files/atlas'}], 'name': 'hijacked'})
            self.assertEqual(denied.exception.code, 'PRIVATE_STATE')
            self.assertTrue((base / 'app files/atlas').exists())

    def test_xdg_manifest_desktop_and_modified_file_preservation(self):
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder)
            with patch.dict(os.environ, {'XDG_DATA_HOME': str(base / 'user data'), 'XDG_CONFIG_HOME': str(base / 'user config')}):
                result = install_runtime('b' * 32, browser='chromium')
            manifest = base / 'user config/chromium/NativeMessagingHosts/org.atlas.companion.json'
            self.assertIn(str(manifest), result['paths'])
            desktop = base / 'user data/applications/org.atlas.Companion.desktop'
            self.assertIn('Exec="', desktop.read_text())
            launcher = Path(result['launcher'])
            launcher.write_text('user changed this file')
            with self.assertRaises(ValueError):
                install('b' * 32, launcher.parent, manifest.parent, base / 'user data/atlas', upgrade=True)
            answer = uninstall(launcher.parent)
            self.assertIn(str(launcher), answer['retained_modified'])
            self.assertEqual(launcher.read_text(), 'user changed this file')
            self.assertTrue((base / 'user data/atlas/state.sqlite3').exists())
            self.assertFalse(manifest.exists())
            self.assertFalse(State(base / 'user data/atlas').known_origin('chrome-extension://' + 'b' * 32))

    def test_upgrade_retains_runtime_and_rejects_identity_change(self):
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder)
            args = ('c' * 32, base / 'app', base / 'manifest', base / 'state')
            install(*args)
            old = json.loads((base / 'app/installation.json').read_text())
            with self.assertRaises(ValueError):
                install(*args)
            install(*args, upgrade=True)
            new = json.loads((base / 'app/installation.json').read_text())
            self.assertEqual(new['previous_runtime'], old['runtime'])
            self.assertTrue(Path(old['runtime']).exists())
            with self.assertRaisesRegex(ValueError, 'registered browser'):
                install(args[0], args[1], base / 'another browser', args[3], upgrade=True)
            with self.assertRaises(ValueError):
                install('d' * 32, *args[1:], upgrade=True)


class UpgradeStartupTests(unittest.TestCase):
    def test_upgrade_refuses_existing_startup_unit_without_modifying_it(self):
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder)
            with patch.dict(os.environ, {'XDG_CONFIG_HOME': str(base / 'config')}):
                args = ('a' * 32, base / 'app', base / 'manifest', base / 'state')
                install(*args)
                original = (base / 'app/installation.json').read_bytes()
                unit = base / 'config/systemd/user/atlas-supervisor.service'
                unit.parent.mkdir(parents=True)
                unit.write_text('preserve unknown or prior unit')
                with self.assertRaisesRegex(ValueError, 'previous installed companion'):
                    install(*args, upgrade=True)
                self.assertEqual(unit.read_text(), 'preserve unknown or prior unit')
                self.assertEqual((base / 'app/installation.json').read_bytes(), original)
