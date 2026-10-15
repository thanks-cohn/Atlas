import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from atlas_companion.quick_setup import complete
from atlas_companion.state import State
from atlas_companion.security import APIError

class QuickSetupTests(unittest.TestCase):
    def test_consent_required_before_install_or_grants(self):
        with tempfile.TemporaryDirectory() as folder:
            state=State(folder); calls=[]
            with self.assertRaises(APIError):complete(state,'a'*32,[],calls.append,calls.append)
            self.assertEqual(calls,[]);self.assertEqual(state.grants(),[])

    def test_selected_scopes_and_order_only(self):
        with tempfile.TemporaryDirectory() as folder:
            base=Path(folder); root=base/'files';root.mkdir();state=State(base/'state');calls=[]
            with patch('atlas_companion.quick_setup.diagnose',return_value={'state':'READY'}):
                complete(state,'a'*32,[(str(root),False)],lambda identity:calls.append('install'),lambda identity:calls.append('start'),consent=True)
            self.assertEqual(calls,['install','start']);self.assertEqual(len(state.grants()),1)
            self.assertFalse(state.grants()[0]['writable'])

    def test_declining_all_locations_grants_nothing(self):
        with tempfile.TemporaryDirectory() as folder:
            state=State(folder)
            with patch('atlas_companion.quick_setup.diagnose',return_value={'state':'READY'}):
                complete(state,'a'*32,[],lambda _:None,lambda _:None,consent=True)
            self.assertEqual(state.grants(),[])

    def test_offline_result_has_stable_recovery_code(self):
        with tempfile.TemporaryDirectory() as folder:
            with patch('atlas_companion.quick_setup.diagnose',return_value={'state':'OFFLINE'}):
                with self.assertRaises(APIError) as error:
                    complete(State(folder),'a'*32,[],lambda _:None,lambda _:None,consent=True,timeout=0)
            self.assertEqual(error.exception.code,'SETUP_START_TIMEOUT')
