"""Actual Windows negative security and durable recovery tests; no emulation."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import unittest

from atlas_companion.security import APIError


@unittest.skipUnless(os.name == 'nt', 'Requires actual Windows kernel')
class WindowsRuntimeTests(unittest.TestCase):
    def setUp(self):
        from atlas_companion.windows_state import WindowsState
        self.temp = tempfile.TemporaryDirectory()
        self.base = Path(self.temp.name)
        self.state = WindowsState(self.base / 'private')

    def tearDown(self):
        self.state.close()
        self.temp.cleanup()

    def test_private_acl_and_durable_pairing(self):
        from atlas_companion.windows_state import WindowsState, current_sid
        self.assertTrue(current_sid().startswith('S-1-'))
        key = self.state.bootstrap_key()
        token = self.state.pair('a' * 32)
        # Inspect protected DACL using the Windows security API via PowerShell.
        script = "$acl=Get-Acl -LiteralPath $env:ATLAS_TEST_PRIVATE; $acl.AreAccessRulesProtected; $acl.Access | ForEach-Object { $_.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier]).Value }"
        environment = dict(os.environ, ATLAS_TEST_PRIVATE=str(self.state.directory))
        result = subprocess.run(['powershell.exe', '-NoProfile', '-NonInteractive', '-Command', script],
                                env=environment, capture_output=True, text=True, check=True)
        self.assertIn('True', result.stdout)
        self.assertEqual(set(result.stdout.split()[1:]), {current_sid(), 'S-1-5-18'})
        reopened = WindowsState(self.state.directory)
        try:
            self.assertEqual(key, reopened.bootstrap_key())
            self.assertTrue(reopened.authenticate('chrome-extension://' + 'a' * 32, token))
            self.assertFalse(reopened.authenticate('chrome-extension://' + 'b' * 32, token))
        finally:
            reopened.close()

    def test_grants_consent_exclusions_revocation_and_receipts(self):
        from atlas_companion.windows_state import WindowsState
        with self.assertRaises(APIError) as denied:
            self.state.grant(self.state.directory, allow_broad=True)
        self.assertEqual(denied.exception.code, 'PRIVATE_STATE')
        with self.assertRaises(APIError) as denied:
            self.state.grant(self.base)
        self.assertEqual(denied.exception.code, 'BROAD_CONSENT_REQUIRED')
        grant = self.state.grant(self.base, allow_broad=True)
        row = self.state.get_grant(grant)
        self.assertEqual(len(row['identity']), 2)
        with self.assertRaises(APIError):
            self.state.check_path(row, 'private/bootstrap.key')
        with self.assertRaises(APIError):
            self.state.get_grant(grant, write=True)
        operation = 'a' * 32
        self.assertIsNone(self.state.begin(operation, {'action': 'copy', 'source': {'grant': grant}}))
        with self.assertRaises(APIError) as interrupted:
            self.state.begin(operation, {'action': 'copy', 'source': {'grant': grant}})
        self.assertEqual(interrupted.exception.code, 'OUTCOME_UNKNOWN')
        self.state.revoke_grant(grant)
        other = WindowsState(self.state.directory)
        try:
            with self.assertRaises(APIError):
                other.get_grant(grant)
            self.assertEqual(other.receipts(), [])
        finally:
            other.close()

    def test_mutex_arbitration_and_abandoned_recovery(self):
        from atlas_companion.windows_runtime import RuntimeLock
        code = ('from atlas_companion.windows_state import WindowsState; '
                'from atlas_companion.windows_runtime import RuntimeLock; '
                'import sys,time; s=WindowsState(sys.argv[1]); '
                'lock=RuntimeLock(s,"wake"); lock.__enter__(); print("READY",flush=True); time.sleep(60)')
        child = subprocess.Popen([sys.executable, '-c', code, str(self.state.directory)], stdout=subprocess.PIPE, text=True)
        try:
            self.assertEqual(child.stdout.readline().strip(), 'READY')
            with self.assertRaises(APIError) as denied:
                with RuntimeLock(self.state, 'wake'):
                    pass
            self.assertEqual(denied.exception.code, 'ALREADY_RUNNING')
            with RuntimeLock(self.state, 'desktop'):
                pass
            child.kill()
            child.wait(timeout=10)
            with RuntimeLock(self.state, 'wake'):
                pass
        finally:
            if child.poll() is None:
                child.kill()
                child.wait()
            child.stdout.close()

    def test_attested_process_kill_and_tamper_denial(self):
        from atlas_companion.windows_runtime import stop_attested_service
        code = ('from atlas_companion.windows_state import WindowsState; '
                'from atlas_companion.windows_runtime import write_service_identity; '
                'import sys,time; s=WindowsState(sys.argv[1]); write_service_identity(s,17892); '
                'print("READY",flush=True); time.sleep(60)')
        child = subprocess.Popen([sys.executable, '-c', code, str(self.state.directory)], stdout=subprocess.PIPE, text=True)
        try:
            self.assertEqual(child.stdout.readline().strip(), 'READY')
            file = self.state.directory / 'service.identity'
            original = file.read_text()
            signed = json.loads(original)
            signed['identity']['pid'] = os.getpid()
            file.write_text(json.dumps(signed))
            with self.assertRaises(APIError):
                stop_attested_service(self.state, 17892)
            self.assertIsNone(child.poll())
            import hashlib, hmac
            signed = json.loads(original)
            signed['identity']['creation_filetime'] += 1
            encoded = json.dumps(signed['identity'], sort_keys=True, separators=(',', ':')).encode()
            signed['mac'] = hmac.new(self.state.bootstrap_key(), b'atlas.windows.service.v1:' + encoded, hashlib.sha256).hexdigest()
            file.write_text(json.dumps(signed))
            with self.assertRaises(APIError):
                stop_attested_service(self.state, 17892)
            self.assertIsNone(child.poll())
            file.write_text(original)
            with self.assertRaises(APIError):
                stop_attested_service(self.state, 17893)
            self.assertIsNone(child.poll())
            stop_attested_service(self.state, 17892)
            child.wait(timeout=10)
        finally:
            if child.poll() is None:
                child.kill()
                child.wait()
            child.stdout.close()


if __name__ == '__main__':
    unittest.main()
