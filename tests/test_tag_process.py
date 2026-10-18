import json
from pathlib import Path
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch
from atlas_companion.tag_process import run_engine
from atlas_companion.security import APIError

class TagProcessTests(unittest.TestCase):
    def test_real_child_exits_before_result_returns(self):
        state=SimpleNamespace(directory=Path('.'))
        command=[sys.executable,'-c',"import json,sys;json.load(sys.stdin);print(json.dumps({'ok':True,'model':'fixture','source':'objects','suggestions':[]}))"]
        with patch('atlas_companion.tag_bundle.engine_command',return_value=command):
            result=run_engine(state,{'model':'objects'})
        self.assertEqual(result['suggestions'],[])
        self.assertNotIn('onnxruntime',sys.modules)

    def test_timeout_reaps_owned_child(self):
        with patch('atlas_companion.tag_bundle.engine_command',return_value=[sys.executable,'-c','import time;time.sleep(30)']):
            with self.assertRaises(APIError) as caught:run_engine(SimpleNamespace(directory=Path('.')),{},timeout=.1)
        self.assertEqual(caught.exception.code,'TAG_TIMEOUT')

    def test_invalid_child_output_is_not_success(self):
        with patch('atlas_companion.tag_bundle.engine_command',return_value=[sys.executable,'-c',"print('not json')"]):
            with self.assertRaises(APIError) as caught:run_engine(SimpleNamespace(directory=Path('.')),{})
        self.assertEqual(caught.exception.code,'TAG_WORKER_FAILED')
