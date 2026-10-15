import http.client
import json
import tempfile
import threading
import unittest
from atlas_companion.diagnostics import record, snapshot, error_code
from atlas_companion.state import State
from atlas_companion.server import Server

class DiagnosticTests(unittest.TestCase):
    def test_bounded_persistent_journal_rejects_free_text(self):
        with tempfile.TemporaryDirectory() as folder:
            state=State(folder)
            for _ in range(205): record(state,'NATIVE_WAKE','SERVICE_START_TIMEOUT')
            record(state,'native secret path','TOKEN_MUST_NOT_APPEAR')
            report=snapshot(State(folder))
            self.assertEqual(len(report['events']),200)
            self.assertNotIn('TOKEN_MUST_NOT_APPEAR',json.dumps(report))
            self.assertEqual(report['events'][-1]['code'],'SERVICE_START_TIMEOUT')

    def test_authenticated_debug_endpoint_never_echoes_bearer(self):
        with tempfile.TemporaryDirectory() as folder:
            state=State(folder); token=state.pair('a'*32)
            record(state,'NATIVE_PAIR','TOKEN_ROTATED')
            server=Server(state,0); thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
            try:
                def request(auth):
                    c=http.client.HTTPConnection('127.0.0.1',server.server_port)
                    c.request('GET','/v1/diagnostics',headers={'Origin':'chrome-extension://'+'a'*32,'Authorization':auth})
                    r=c.getresponse();data=r.read().decode();c.close();return r.status,data
                status,data=request('Bearer '+token)
                self.assertEqual(status,200);self.assertNotIn(token,data)
                self.assertEqual(json.loads(data)['events'][0]['code'],'TOKEN_ROTATED')
                status,data=request('Bearer wrong');self.assertEqual(status,401)
                self.assertNotIn('events',json.loads(data))
            finally:
                server.shutdown();server.server_close();thread.join()

    def test_windows_sharing_failure_has_stable_code_without_path(self):
        exc=OSError('private path must never appear');exc.winerror=32
        self.assertEqual(error_code(exc),'WINDOWS_SHARING_VIOLATION')
