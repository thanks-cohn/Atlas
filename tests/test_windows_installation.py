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
        self.assertEqual(manifest['path'], str(self.directory / ('atlas-native-' + self.install._digest(self.binary)[:20] + '.exe')))
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


class WindowsImageUpdateDecisionTests(unittest.TestCase):
    """Portable installer decisions only; Windows image locks need Windows CI."""
    def test_repair_keeps_identical_native_image_and_upgrade_uses_a_new_path(self):
        from types import SimpleNamespace
        from atlas_companion import windows_install as install
        from unittest.mock import Mock
        with tempfile.TemporaryDirectory() as temporary:
            root=Path(temporary);binary=root/'source.exe';binary.write_bytes(b'MZfirst')
            app=root/'app';state=root/'state';registration=[None]
            def secure(path): Path(path).mkdir(parents=True,exist_ok=True)
            def registry(key,value=None,remove=False):
                if value is not None: registration[0]=str(value)
                return registration[0]
            fake_state=Mock(return_value=SimpleNamespace(protect_path=lambda path:None,pair=lambda identity:None,close=lambda:None))
            with patch.object(install.sys,'platform','win32'), patch.object(install,'_state_api',return_value=(fake_state,secure)), patch.object(install,'_registration',side_effect=registry), patch.object(install,'_quiesce'):
                result=install.install_runtime('a'*32,state_dir=state,install_dir=app,binary=binary)
                manifest=Path(result['paths'][2]);first=Path(json.loads(manifest.read_text())['path'])
                original_unlink=install._unlink
                def forbid_running(path,**kwargs):
                    if Path(path)==first: raise PermissionError('simulated running image')
                    return original_unlink(path,**kwargs)
                with patch.object(install,'_unlink',side_effect=forbid_running):
                    install.install_runtime('a'*32,state_dir=state,install_dir=app,binary=binary,upgrade=True)
                    binary.write_bytes(b'MZsecond')
                    install.install_runtime('a'*32,state_dir=state,install_dir=app,binary=binary,upgrade=True)
                second=Path(json.loads(manifest.read_text())['path'])
                self.assertNotEqual(first,second);self.assertEqual(first.read_bytes(),b'MZfirst');self.assertEqual(second.read_bytes(),b'MZsecond')


class WindowsSupervisorContractTests(unittest.TestCase):
    """Portable decision tests; do not assert execution on the Windows kernel."""
    def test_receipt_requires_matching_state_identity_and_payload_digest(self):
        import hashlib
        from types import SimpleNamespace
        from atlas_companion import windows_install as install
        from atlas_companion.windows_supervisor import _installed_runtime
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            runtime = directory / 'atlas-test.exe'
            runtime.write_bytes(b'MZfixture')
            state = SimpleNamespace(directory=directory / 'state')
            receipt = {'state_dir': str(state.directory), 'extension_id': 'a' * 32,
                       'runtime': str(runtime), 'runtime_sha256': hashlib.sha256(runtime.read_bytes()).hexdigest()}
            (directory / 'installation.json').write_text(json.dumps(receipt))
            self.assertEqual(_installed_runtime(state, 'a' * 32, directory), runtime)
            with self.assertRaises(ValueError):
                _installed_runtime(state, 'b' * 32, directory)
            runtime.write_bytes(b'MZmodified')
            with self.assertRaises(ValueError):
                _installed_runtime(state, 'a' * 32, directory)

    def test_login_launch_uses_short_receipt_recovery_command(self):
        from types import SimpleNamespace
        from atlas_companion import windows_supervisor as supervisor
        with tempfile.TemporaryDirectory() as temporary:
            state = SimpleNamespace(directory=Path(temporary), known_origin=lambda origin: True)
            runtime = Path(temporary) / 'atlas.exe'
            with patch.object(supervisor, '_installed_runtime', return_value=runtime), patch.object(supervisor, '_run_value', return_value=None) as registration, patch('atlas_companion.windows_runtime.child_environment', return_value={}), patch.object(supervisor.subprocess, 'CREATE_NO_WINDOW', 0, create=True), patch.object(supervisor.subprocess, 'Popen') as launch:
                result = supervisor.startup(state, 'a' * 32, 17892, 'enable', consent=True)
                self.assertEqual(result['startup'], 'LAUNCHED')
                self.assertEqual(launch.call_args.args[0], [str(runtime), '--recover'])
                self.assertEqual(registration.call_args.args[0], supervisor.subprocess.list2cmdline([str(runtime), '--recover']))

    def test_too_long_login_command_is_rejected_before_registry_write(self):
        from types import SimpleNamespace
        from atlas_companion import windows_supervisor as supervisor
        state = SimpleNamespace(directory=Path('/state'), known_origin=lambda origin: True)
        with patch.object(supervisor, '_installed_runtime', return_value=Path('/' + 'x' * 260 + '/atlas.exe')), patch.object(supervisor, '_run_value', return_value=None) as registration:
            with self.assertRaises(ValueError):
                supervisor.startup(state, 'a' * 32, 17892, 'enable', consent=True)
            registration.assert_called_once_with()

    def test_quiesce_only_delegates_owned_matching_image_to_attested_stop(self):
        from contextlib import nullcontext
        from types import SimpleNamespace
        from unittest.mock import Mock
        from atlas_companion import windows_install as install
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            executable = directory / 'atlas-native.exe'
            executable.write_bytes(b'MZowned')
            state = SimpleNamespace(_guard=Mock())
            state._guard.read.return_value = json.dumps({'identity': {'exe': str(executable)}}).encode()
            receipt = {'extension_id': 'a' * 32, 'runtime': str(directory / 'runtime.exe'), 'runtime_sha256': 'unused',
                       'owned': {str(executable): install._digest(executable)}}
            with patch('atlas_companion.windows_supervisor.startup'), patch('atlas_companion.windows_runtime.RuntimeLock', return_value=nullcontext()), patch('atlas_companion.windows_runtime.stop_attested_service') as stop:
                install._quiesce(state, directory, receipt)
                stop.assert_called_once_with(state, 17892)
                stop.reset_mock()
                executable.write_bytes(b'MZchanged')
                install._quiesce(state, directory, receipt)
                stop.assert_not_called()

    def test_unlink_retries_only_permission_failures_with_bounded_deadline(self):
        from unittest.mock import Mock
        from atlas_companion import windows_install as install
        path = Mock()
        path.unlink.side_effect = [PermissionError(), None]
        with patch.object(install.time, 'sleep'):
            install._unlink(path)
        self.assertEqual(path.unlink.call_count, 2)
        path.unlink.side_effect = PermissionError()
        with patch.object(install.time, 'monotonic', side_effect=[0, 3]):
            with self.assertRaises(PermissionError):
                install._unlink(path)

    def test_health_failure_delegates_attested_wake_without_process_termination(self):
        from types import SimpleNamespace
        from atlas_companion.windows_supervisor import Supervisor
        state = SimpleNamespace(known_origin=lambda origin: True)
        worker = Supervisor(state, 'a' * 32)
        with patch('atlas_companion.supervisor.health', return_value=False), patch('atlas_native.__main__.connect', return_value={'token': 'never-output'}) as connect:
            self.assertEqual(worker.step(), 'READY')
            connect.assert_called_once_with(state, 'chrome-extension://' + 'a' * 32, issue_token=False)
        self.assertIsNone(worker.child)

    def test_existing_stop_marker_is_respected_on_delayed_start(self):
        from contextlib import nullcontext
        from types import SimpleNamespace
        from atlas_companion.windows_supervisor import Supervisor
        with tempfile.TemporaryDirectory() as temporary:
            state = SimpleNamespace(directory=Path(temporary))
            (state.directory / 'supervisor.stop').touch()
            worker = Supervisor(state, 'a' * 32)
            with patch('atlas_companion.windows_runtime.RuntimeLock', return_value=nullcontext()), patch.object(worker, 'step') as step:
                worker.run()
                step.assert_not_called()


if __name__ == '__main__':
    unittest.main()
