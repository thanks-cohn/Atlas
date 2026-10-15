import tempfile
import unittest
from pathlib import Path
from atlas_companion.preview_limits import preview_limit, DEFAULT_PREVIEW_BYTES, MAX_PREVIEW_BYTES
from atlas_companion.filesystem import Provider
from atlas_companion.state import State
from atlas_companion.security import APIError

class PreviewLimitsTests(unittest.TestCase):
    def test_defaults_and_validation(self):
        self.assertEqual(preview_limit({}), 30 * 1048576)
        self.assertEqual(preview_limit({'max_bytes':MAX_PREVIEW_BYTES}), MAX_PREVIEW_BYTES)
        for value in (True, 0, -1, '30', 1.5, MAX_PREVIEW_BYTES + 1):
            with self.assertRaises(APIError): preview_limit({'max_bytes':value})

    def test_real_file_respects_smaller_and_larger_requested_limits(self):
        with tempfile.TemporaryDirectory() as folder:
            base=Path(folder); root=base/'files'; root.mkdir()
            payload=b'x'*(3*1048576); (root/'test.bin').write_bytes(payload)
            state=State(base/'private'); grant=state.grant(str(root))
            provider=Provider(state)
            with self.assertRaises(APIError) as error:
                provider.read({'grant':grant,'path':'test.bin','max_bytes':2*1048576})
            self.assertEqual(error.exception.code,'PREVIEW_TOO_LARGE')
            result=provider.read({'grant':grant,'path':'test.bin','max_bytes':5*1048576})
            self.assertEqual(result['size'],len(payload))
