"""Qualified-candidate ONNX adapters; legacy remains the release default.

No downloads, PyTorch, remote code, or imports of numerical libraries at startup.
The profile is packaged by the builder, never selected by an HTTP caller.
"""
import hashlib
import json
import os
from pathlib import Path
import sys

from .security import APIError

MANIFEST = Path(__file__).with_name('tagging-models-rich.json')
PROFILE = Path(__file__).with_name('tagging-profile.json')


def enabled():
    # Source-only qualification switch. Frozen builds use their embedded profile.
    if not getattr(sys, 'frozen', False) and os.environ.get('ATLAS_TAGGING_PROFILE') == 'rich':
        return True
    return PROFILE.is_file() and json.loads(PROFILE.read_text(encoding='utf-8')).get('profile') == 'rich'


def asset(state, key):
    spec = json.loads(MANIFEST.read_text(encoding='utf-8'))[key]
    bundled = Path(getattr(sys, '_MEIPASS', Path(__file__).parents[2])) / 'tagging-models'
    for root in (Path(state.directory) / 'tagging-models', Path(sys.executable).parent.parent / 'tagging-models', bundled):
        path = root / spec['file']
        if path.is_file():
            with path.open('rb') as stream:
                digest = hashlib.file_digest(stream, 'sha256').hexdigest()
            if path.stat().st_size != spec['bytes'] or digest != spec['sha256']:
                raise APIError('TAG_MODEL_CHECKSUM', 'Model verification failed; repair the model bundle.', 409)
            return path, spec
    raise APIError('TAG_MODEL_NOT_INSTALLED', 'Install the complete rich-tagging companion bundle.', 409)


def component(key, spec):
    return {'role': key, 'model': spec['model'], 'revision': spec['revision'],
            'sha256': spec['sha256'], 'file': spec['file']}


def photo(state, image):
    import numpy as np
    from PIL import Image
    from .onnx_tags import session
    path, spec = asset(state, 'rampp')
    labels, label_spec = asset(state, 'rampp_labels')
    limits, threshold_spec = asset(state, 'rampp_thresholds')
    names = labels.read_text(encoding='utf-8').splitlines()
    thresholds = np.asarray([float(x) for x in limits.read_text().splitlines()], dtype=np.float64)
    if len(names) != 4585 or thresholds.shape != (4585,) or not np.isfinite(thresholds).all() or np.any((thresholds < 0) | (thresholds > 1)):
        raise ValueError('RAM++ vocabulary/threshold contract mismatch')
    pixels = np.asarray(image.resize((384, 384), Image.Resampling.BILINEAR), dtype=np.float32) / 255
    tensor = ((pixels - np.array([.485, .456, .406], dtype=np.float32)) / np.array([.229, .224, .225], dtype=np.float32)).transpose(2, 0, 1)[None]
    model = session(path)
    if model.get_inputs()[0].shape != [1, 3, 384, 384]:
        raise ValueError('RAM++ input contract mismatch')
    logits = np.asarray(model.run(None, {model.get_inputs()[0].name: np.ascontiguousarray(tensor)})[0])
    del model
    if logits.shape != (1, 4585) or not np.isfinite(logits).all():
        raise ValueError('RAM++ output contract mismatch')
    scores = 1 / (1 + np.exp(-np.clip(logits[0].astype(np.float64), -80, 80)))
    # Strict > preserves upstream's disabled (threshold=1) classes. No top-k.
    predictions = [{'index': i, 'tag': name, 'logit': float(logits[0, i]),
                    'score': float(scores[i]), 'threshold': float(thresholds[i]),
                    'qualified': bool(scores[i] > thresholds[i])} for i, name in enumerate(names)]
    suggestions = [{'tag': p['tag'], 'score': p['score'], 'category': 'objects'}
                   for p in sorted(predictions, key=lambda p: (-p['score'], p['index'])) if p['qualified']]
    return {'schema': 'atlas.tag-suggestions.v1', 'source': 'objects',
            'model': spec['model'], 'model_version': spec['revision'], 'model_sha256': spec['sha256'],
            'recipe': 'atlas-rampp-onnx-v1', 'people_source': 'people',
            'suggestions': suggestions, 'predictions': predictions,
            'image_size': list(image.size),
            'components': [component(k, s) for k, s in [('rampp', spec), ('labels', label_spec), ('thresholds', threshold_spec)]]}


def predict(state, body):
    from .onnx_tags import decode
    try:
        image = decode(body)
        if body.get('model') == 'objects':
            return photo(state, image)
        if body.get('model') in ('people', 'face'):
            from .people_tags import predict as people
            return people(state, body, image)
        raise APIError('TAG_MODEL_INVALID', 'Choose Things, People or Anime.', 400)
    except ImportError as exc:
        raise APIError('TAG_RUNTIME_MISSING', 'Repair the companion ONNX runtime.', 409) from exc
    except APIError:
        raise
    except Exception as exc:
        raise APIError('TAG_INFERENCE_FAILED', 'Rich tagging failed; existing tags remain. Check companion diagnostics.', 500) from exc
