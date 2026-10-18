"""Negative bundle boundaries precede installer integration."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from atlas_companion import tag_bundle


class BundleTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name);self.engine=self.root/'tagging-engine';self.engine.mkdir()
        (self.engine/'atlas-tagging-engine.exe').write_bytes(b'MZfixture')
        self.spec={'schema':1,'files':{'atlas-tagging-engine.exe':{'sha256':hashlib.sha256(b'MZfixture').hexdigest(),'bytes':9}}}

    def test_valid_then_modified_or_unlisted_refused(self):
        tag_bundle.verify_tree(self.engine,self.spec)
        (self.engine/'evil.dll').write_bytes(b'unlisted')
        with self.assertRaises(ValueError):tag_bundle.verify_tree(self.engine,self.spec)
        (self.engine/'evil.dll').unlink();(self.engine/'atlas-tagging-engine.exe').write_bytes(b'MZchanged')
        with self.assertRaises(ValueError):tag_bundle.verify_tree(self.engine,self.spec)

    def test_traversal_and_symlink_refused(self):
        bad={'schema':1,'files':{'../outside.exe':self.spec['files']['atlas-tagging-engine.exe']}}
        with self.assertRaises(ValueError):tag_bundle.verify_tree(self.engine,bad)
        (self.engine/'atlas-tagging-engine.exe').unlink()
        try:(self.engine/'atlas-tagging-engine.exe').symlink_to(self.root/'outside.exe')
        except OSError:self.skipTest('Symlink creation unavailable')
        with self.assertRaises(ValueError):tag_bundle.verify_tree(self.engine,self.spec)

    def test_model_copy_atomic_reuse_and_no_overwrite(self):
        source=self.root/'model.onnx';source.write_bytes(b'model')
        spec={'file':'model.onnx','sha256':hashlib.sha256(b'model').hexdigest(),'bytes':5}
        dest=self.root/'cache';dest.mkdir()
        tag_bundle.copy_asset(source,dest/'model.onnx',spec)
        before=(dest/'model.onnx').stat().st_mtime_ns
        tag_bundle.copy_asset(source,dest/'model.onnx',spec)
        self.assertEqual((dest/'model.onnx').stat().st_mtime_ns,before)
        (dest/'model.onnx').write_bytes(b'owner changes')
        with self.assertRaises(ValueError):tag_bundle.copy_asset(source,dest/'model.onnx',spec)
        self.assertEqual((dest/'model.onnx').read_bytes(),b'owner changes')
        self.assertFalse(list(dest.glob('*.partial-*')))

    def test_install_stores_once_and_reuses_without_source_bundle(self):
        from unittest.mock import patch
        source=self.root/'atlas-companion.exe';source.write_bytes(b'MZhelper')
        models=self.root/'tagging-models';models.mkdir();(models/'model.onnx').write_bytes(b'model')
        engine_spec=self.root/'engine.json';engine_spec.write_text(json.dumps(self.spec))
        model_spec=self.root/'models.json';model_spec.write_text(json.dumps({'objects':{'file':'model.onnx','sha256':hashlib.sha256(b'model').hexdigest(),'bytes':5}}))
        state=self.root/'private';state.mkdir();app=self.root/'app';app.mkdir()
        def secure(path):
            if tag_bundle.reparse(Path(path)):raise ValueError('Linked destination')
            Path(path).mkdir(parents=True,exist_ok=True)
        with patch.object(tag_bundle,'ENGINE_SPEC',engine_spec),patch.object(tag_bundle,'MODEL_SPEC',model_spec):
            first=tag_bundle.install_bundle(source,state,app,secure)
            before=Path(first).stat().st_mtime_ns
            import shutil
            shutil.rmtree(self.engine);shutil.rmtree(models)
            second=tag_bundle.install_bundle(app/'installed-helper.exe',state,app,secure)
            self.assertEqual(first,second);self.assertEqual(Path(first).stat().st_mtime_ns,before)
            self.assertEqual((state/'tagging-models/model.onnx').read_bytes(),b'model')

    def test_core_only_install_does_not_require_models(self):
        from unittest.mock import patch
        spec=self.root/'engine.json';spec.write_text(json.dumps(self.spec))
        bare=self.root/'core-only';bare.mkdir()
        def secure(path):Path(path).mkdir(parents=True,exist_ok=True)
        with patch.object(tag_bundle,'ENGINE_SPEC',spec):
            result=tag_bundle.install_bundle(bare/'helper.exe',self.root/'state',self.root/'app',secure)
        self.assertIsNone(result)
