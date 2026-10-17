"""Optional experiment checks; run with its isolated environment, not base Atlas deps."""
import tempfile
from pathlib import Path
import unittest
from unittest.mock import patch
import numpy as np
from PIL import Image
import joytag_provider as provider

class AdapterTests(unittest.TestCase):
    def test_prepare_shape_normalization_and_bounds(self):
        with tempfile.TemporaryDirectory() as directory:
            image=Path(directory)/'white.png';Image.new('RGB',(100,50),'white').save(image)
            tensor=provider.prepare(image)
            self.assertEqual(tensor.shape,(1,3,448,448));self.assertEqual(tensor.dtype,np.float32)
            self.assertAlmostEqual(float(tensor[0,0,0,0]),(1-.48145466)/.26862954,places=5)
            with patch.object(provider,'MAX_PIXELS',100):
                with self.assertRaises((ValueError,Image.DecompressionBombError)):provider.prepare(image)
            with self.assertRaises(ValueError):provider.prepare(Path(directory)/'missing')
    def test_corrupt_model_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            model=Path(directory)/'model.onnx';model.write_bytes(b'not the pinned model')
            with self.assertRaisesRegex(ValueError,'CHECKSUM'):provider.verify(model)
    def test_invalid_options_fail_before_loading_model(self):
        with self.assertRaises(ValueError):provider.predict('missing',Path('.'),0,30)
        with self.assertRaises(ValueError):provider.predict('missing',Path('.'),.4,101)
    def test_missing_model_visible_error(self):
        with tempfile.TemporaryDirectory() as directory:
            image=Path(directory)/'sample.png';Image.new('RGB',(16,16),'white').save(image)
            with self.assertRaisesRegex(ValueError,'not installed'):provider.predict(image,Path(directory))

if __name__=='__main__':unittest.main()
