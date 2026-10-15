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
        # Inspect the actual security descriptor independently of the production
        # verifier. PowerShell Get-Acl can fail nonterminating under retained
        # no-delete-share directory handles, so use READ_CONTROL directly.
        import ctypes
        from ctypes import wintypes as w
        import re
        from atlas_companion.windows_state import windows_api
        kernel, advapi = windows_api()
        handle = kernel.CreateFileW(str(self.state.directory), 0x20000, 3, None, 3, 0x02200000, None)
        self.assertNotEqual(handle, ctypes.c_void_p(-1).value)
        owner, descriptor = w.LPVOID(), w.LPVOID()
        advapi.GetSecurityInfo.argtypes = [w.HANDLE, ctypes.c_int, w.DWORD,
            ctypes.POINTER(w.LPVOID), w.LPVOID, w.LPVOID, w.LPVOID, ctypes.POINTER(w.LPVOID)]
        try:
            self.assertEqual(advapi.GetSecurityInfo(handle, 1, 5, ctypes.byref(owner),
                None, None, None, ctypes.byref(descriptor)), 0)
            owner_text = w.LPWSTR()
            self.assertTrue(advapi.ConvertSidToStringSidW(owner, ctypes.byref(owner_text)))
            try:
                self.assertEqual(owner_text.value, current_sid())
            finally:
                kernel.LocalFree(ctypes.cast(owner_text, w.HLOCAL))
            control, revision = w.WORD(), w.DWORD()
            advapi.GetSecurityDescriptorControl.argtypes = [w.LPVOID, ctypes.POINTER(w.WORD), ctypes.POINTER(w.DWORD)]
            self.assertTrue(advapi.GetSecurityDescriptorControl(descriptor,
                ctypes.byref(control), ctypes.byref(revision)))
            self.assertTrue(control.value & 0x1000, 'DACL must be protected')
            advapi.ConvertSecurityDescriptorToStringSecurityDescriptorW.argtypes = [
                w.LPVOID, w.DWORD, w.DWORD, ctypes.POINTER(w.LPWSTR), w.LPVOID]
            sddl = w.LPWSTR()
            self.assertTrue(advapi.ConvertSecurityDescriptorToStringSecurityDescriptorW(
                descriptor, 1, 4, ctypes.byref(sddl), None))
            try:
                acl_text = sddl.value
                aces = re.findall(r'\(([^()]*)\)', acl_text)
                self.assertEqual(len(aces), 2, acl_text)
                trustees = set()
                for ace in aces:
                    kind, flags, rights, object_guid, inherited_guid, trustee = ace.split(';')
                    self.assertEqual(kind, 'A', acl_text)
                    self.assertEqual(flags, 'OICI', acl_text)
                    self.assertIn(rights, ('FA', 'GA'), acl_text)
                    self.assertEqual((object_guid, inherited_guid), ('', ''), acl_text)
                    trustees.add(trustee)
                self.assertEqual(trustees, {current_sid(), 'SY'}, acl_text)
            finally:
                kernel.LocalFree(ctypes.cast(sddl, w.HLOCAL))
        finally:
            if descriptor:
                kernel.LocalFree(descriptor)
            kernel.CloseHandle(handle)
        reopened = WindowsState(self.state.directory)
        try:
            self.assertEqual(key, reopened.bootstrap_key())
            self.assertTrue(reopened.authenticate('chrome-extension://' + 'a' * 32, token))
            self.assertFalse(reopened.authenticate('chrome-extension://' + 'b' * 32, token))
        finally:
            reopened.close()

    def test_explicit_file_ownership_and_persistent_journal(self):
        from atlas_companion.windows_state import windows_api, verify_private_handle, WindowsState
        import ctypes
        self.state.bootstrap_key()
        self.state.pair('b' * 32)
        kernel, _ = windows_api()
        for name in ('windows-state.sqlite3', 'windows-state.sqlite3-journal', 'bootstrap.key'):
            handle = kernel.CreateFileW(str(self.state.directory / name), 0x20000, 3, None, 3, 0x00200000, None)
            self.assertNotEqual(handle, ctypes.c_void_p(-1).value)
            try:
                verify_private_handle(handle, self.state.sid)
            finally:
                kernel.CloseHandle(handle)
        journal = self.state.directory / 'windows-state.sqlite3-journal'
        from atlas_companion.windows_provider import WindowsRoot
        with self.state._guard._open(journal.name, False) as handle:
            before = self.state._guard._identity(handle)
        for _ in range(3):
            self.state.pair('c' * 32)
        with self.state._guard._open(journal.name, False) as handle:
            self.assertEqual(before, self.state._guard._identity(handle))
        reopened = WindowsState(self.state.directory)
        reopened.close()

    def test_foreign_owned_existing_artifact_is_rejected(self):
        from atlas_companion.windows_state import create_private_file
        path = self.state.directory / 'foreign.key'
        try:
            descriptor = create_private_file(path, 'S-1-5-32-544')
        except OSError as exc:
            if getattr(exc, 'winerror', None) in (5, 1307, 1314):
                self.skipTest('Token cannot assign Administrators ownership; elevated negative fixture unavailable')
            raise
        os.close(descriptor)
        with self.assertRaises(APIError) as denied:
            self.state._protect_file(path.name)
        self.assertEqual(denied.exception.code, 'INVALID_STATE')

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
