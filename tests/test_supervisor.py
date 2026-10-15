"""Real-process recovery proof; no systemd/power-cycle pass inferred."""
import http.client
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import threading
import time
import unittest
from unittest.mock import patch

from atlas_companion.runtime import RuntimeLock
from atlas_companion.security import APIError
from atlas_companion.state import State
from atlas_companion.supervisor import Supervisor, health, startup, unit_text

EXTENSION = 'e' * 32
ORIGIN = 'chrome-extension://' + EXTENSION


def free_port():
    with socket.socket() as probe:
        probe.bind(('127.0.0.1', 0))
        return probe.getsockname()[1]


class SupervisorTests(unittest.TestCase):
    def wait_ready(self, worker):
        deadline = time.monotonic() + 6
        while time.monotonic() < deadline:
            if worker.step() == 'READY':
                return
            time.sleep(0.05)
        self.fail('Supervisor did not reach READY')

    def cleanup(self, worker):
        if worker.child is not None and worker.child.poll() is None:
            worker.child.terminate()
            worker.child.wait(timeout=5)

    def test_real_helper_kill_respawn_preserves_grants_tokens_revocation(self):
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder)
            state = State(base / 'state')
            token = state.pair(EXTENSION)
            root = base / 'files'
            root.mkdir()
            (root / 'proof.txt').write_text('survives recovery')
            grant = state.grant(root, writable=True)
            worker = Supervisor(state, EXTENSION, free_port(), interval=0.1)
            try:
                self.wait_ready(worker)
                first = worker.child.pid
                worker.child.kill()
                worker.child.wait(timeout=5)
                self.wait_ready(worker)
                self.assertNotEqual(first, worker.child.pid)
                self.assertTrue(state.authenticate(ORIGIN, token))
                self.assertEqual(state.get_grant(grant)['root'], str(root))
                self.assertEqual((root / 'proof.txt').read_text(), 'survives recovery')
                connection = http.client.HTTPConnection('127.0.0.1', worker.port, timeout=2)
                try:
                    connection.request('GET', '/v1/health', headers={'Origin': ORIGIN, 'Authorization': 'Bearer ' + token})
                    response = connection.getresponse()
                    self.assertEqual(response.status, 200)
                    response.read()
                finally:
                    connection.close()
                state.revoke_grant(grant)
                worker.child.kill()
                worker.child.wait(timeout=5)
                self.wait_ready(worker)
                with self.assertRaises(APIError):
                    state.get_grant(grant)
                state.revoke_client(EXTENSION)
                self.assertEqual(worker.step(), 'NEEDS_PAIRING')
            finally:
                self.cleanup(worker)

    def test_owned_unresponsive_child_recovered_without_pid_scan(self):
        import signal
        with tempfile.TemporaryDirectory() as folder:
            state = State(folder)
            token = state.pair(EXTENSION)
            worker = Supervisor(state, EXTENSION, free_port(), interval=0.1)
            try:
                self.wait_ready(worker)
                old = worker.child.pid
                os.kill(old, signal.SIGSTOP)
                worker.failures = 2
                worker.child_started -= 10
                self.assertEqual(worker.step(), 'STARTING')
                self.wait_ready(worker)
                self.assertNotEqual(worker.child.pid, old)
                self.assertTrue(state.authenticate(ORIGIN, token))
            finally:
                self.cleanup(worker)

    def test_bounded_restart_and_supervisor_off_demand_wake(self):
        from atlas_native import __main__ as native
        with tempfile.TemporaryDirectory() as folder:
            state = State(folder)
            state.pair(EXTENSION)
            worker = Supervisor(state, EXTENSION, free_port())
            with patch('atlas_companion.supervisor.health', side_effect=ConnectionRefusedError), patch.object(worker, '_spawn') as spawn:
                for _ in range(50):
                    worker.step()
                self.assertEqual(spawn.call_count, 1)
                self.assertLessEqual(worker.failures, 6)
            children = []
            real_popen = subprocess.Popen
            def launch(*args, **kwargs):
                child = real_popen(*args, **kwargs)
                children.append(child)
                return child
            try:
                with patch.object(native, 'PORT', worker.port), patch.object(native.subprocess, 'Popen', side_effect=launch):
                    # No supervisor loop is running: native demand wake is independent.
                    response = native.connect(state, ORIGIN)
                self.assertTrue(state.authenticate(ORIGIN, response['token']))
                self.assertEqual(len(children), 1)
            finally:
                for child in children:
                    child.terminate()
                    child.wait(timeout=5)

    def test_native_recovers_preexisting_attested_hung_service(self):
        import signal
        from atlas_native import __main__ as native
        from atlas_companion.entrypoint import command
        from atlas_companion.runtime import child_environment
        with tempfile.TemporaryDirectory() as folder:
            state = State(Path(folder) / 'state')
            root = Path(folder) / 'files'
            root.mkdir()
            grant = state.grant(root, writable=True)
            state.pair(EXTENSION)
            port = free_port()
            old = subprocess.Popen(command('--state-dir', str(state.directory), 'serve', '--port', str(port)),
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=child_environment())
            children = []
            real_popen = subprocess.Popen
            def launch(*args, **kwargs):
                child = real_popen(*args, **kwargs)
                children.append(child)
                return child
            try:
                deadline = time.monotonic() + 5
                while time.monotonic() < deadline:
                    try:
                        if health(state, ORIGIN, port):
                            break
                    except OSError:
                        pass
                    time.sleep(0.05)
                else:
                    self.fail('Helper did not start')
                os.kill(old.pid, signal.SIGSTOP)
                with patch.object(native, 'PORT', port), patch.object(native.subprocess, 'Popen', side_effect=launch):
                    response = native.connect(state, ORIGIN)
                self.assertTrue(state.authenticate(ORIGIN, response['token']))
                self.assertEqual(state.get_grant(grant)['root'], str(root))
                old.wait(timeout=5)
                self.assertEqual(len(children), 1)
                self.assertTrue(health(state, ORIGIN, port))
            finally:
                for child in [old, *children]:
                    if child.poll() is None:
                        child.kill()
                    child.wait(timeout=5)

    def test_attestation_forged_mac_and_reused_incarnation_never_signal(self):
        import hashlib
        import hmac
        import json
        from atlas_companion.runtime import stop_attested_service, _process_identity
        with tempfile.TemporaryDirectory() as folder:
            state = State(folder)
            child = subprocess.Popen([__import__('sys').executable, '-c', 'import time; time.sleep(30)'])
            try:
                identity = _process_identity(child.pid)
                directory = state.directory.stat()
                identity.update(port=18889, state_device=directory.st_dev, state_inode=directory.st_ino)
                path = state.directory / 'service.identity'
                path.write_text(json.dumps({'identity': identity, 'mac': '0' * 64}))
                path.chmod(0o600)
                with patch('signal.pidfd_send_signal') as send:
                    with self.assertRaises(APIError):
                        stop_attested_service(state, 18889)
                    send.assert_not_called()
                identity['start_ticks'] = str(int(identity['start_ticks']) + 1)
                encoded = json.dumps(identity, sort_keys=True, separators=(',', ':')).encode()
                mac = hmac.new(state.bootstrap_key(), b'atlas.service.v1:' + encoded, hashlib.sha256).hexdigest()
                path.write_text(json.dumps({'identity': identity, 'mac': mac}))
                with patch('signal.pidfd_send_signal') as send:
                    with self.assertRaises(APIError):
                        stop_attested_service(state, 18889)
                    send.assert_not_called()
                self.assertIsNone(child.poll())
            finally:
                child.terminate()
                child.wait(timeout=5)

    def test_single_instance_lock_symlink_private_permissions(self):
        with tempfile.TemporaryDirectory() as folder:
            state = State(folder)
            with RuntimeLock(state, 'supervisor'):
                env = dict(os.environ)
                env['PYTHONPATH'] = str(Path(__file__).resolve().parents[1] / 'src')
                other = subprocess.run([__import__('sys').executable, '-m', 'atlas_companion.supervisor',
                                        '--state-dir', folder, '--extension-id', EXTENSION, 'run'],
                                       capture_output=True, timeout=5, env=env)
                self.assertEqual(other.returncode, 1)
                self.assertIn(b'Another instance', other.stderr)
                with self.assertRaises(APIError):
                    with RuntimeLock(state, 'supervisor'):
                        pass
            lock = Path(folder) / 'supervisor.lock'
            lock.chmod(0o666)
            with self.assertRaises(APIError):
                with RuntimeLock(state, 'supervisor'):
                    pass
            lock.unlink()
            target = Path(folder) / 'target'
            target.write_text('unchanged')
            lock.symlink_to(target)
            with self.assertRaises(OSError):
                with RuntimeLock(state, 'supervisor'):
                    pass
            self.assertEqual(target.read_text(), 'unchanged')

    def test_imposter_not_killed_no_bearer_no_spawn(self):
        from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
        seen = []
        class Imposter(BaseHTTPRequestHandler):
            def do_POST(self):
                seen.append(self.headers.get('Authorization'))
                self.rfile.read(int(self.headers['Content-Length']))
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'{"proof":"fake"}')
            def log_message(self, *args):
                pass
        server = ThreadingHTTPServer(('127.0.0.1', 0), Imposter)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with tempfile.TemporaryDirectory() as folder:
                state = State(folder)
                token = state.pair(EXTENSION)
                worker = Supervisor(state, EXTENSION, server.server_port)
                with patch.object(worker, '_spawn') as spawn:
                    for _ in range(4):
                        self.assertEqual(worker.step(), 'NEEDS_REPAIR')
                    spawn.assert_not_called()
                self.assertEqual(seen, [None] * 4)
                self.assertTrue(state.authenticate(ORIGIN, token))
        finally:
            server.shutdown()
            server.server_close()
            thread.join()

    def test_startup_consent_and_reversible_no_state_delete(self):
        with tempfile.TemporaryDirectory() as folder:
            state = State(Path(folder) / 'state')
            state.pair(EXTENSION)
            units = Path(folder) / 'units'
            with self.assertRaises(ValueError):
                startup(state, EXTENSION, 17892, 'enable', unit_dir=units)
            with patch('atlas_companion.supervisor.systemctl') as ctl:
                self.assertEqual(startup(state, EXTENSION, 17892, 'enable', True, units)['status'], 'ENABLED')
                text = (units / 'atlas-supervisor.service').read_text()
                self.assertIn('KillMode=process', text)
                self.assertIn('RestartSec=15', text)
                self.assertNotIn('Bearer', text)
                self.assertEqual(startup(state, EXTENSION, 17892, 'disable', unit_dir=units)['demand_wake'], 'independent')
                self.assertTrue((units / 'atlas-supervisor.service').exists())
                startup(state, EXTENSION, 17892, 'uninstall', unit_dir=units)
                self.assertFalse((units / 'atlas-supervisor.service').exists())
                self.assertTrue(state.known_origin(ORIGIN))
                self.assertTrue(state.path.exists())
                self.assertGreater(ctl.call_count, 3)
