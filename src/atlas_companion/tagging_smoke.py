"""Real bundled-model execution probe, only invoked through explicit CLI flag."""
import base64
import io
import json
import tempfile
from types import SimpleNamespace


def main():
    from PIL import Image
    from .tagging import run
    buffer = io.BytesIO()
    Image.new('RGB', (320, 240), 'white').save(buffer, format='PNG')
    image = 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode()
    with tempfile.TemporaryDirectory(prefix='atlas-model-smoke-') as folder:
        for model in ('objects', 'face', 'anime'):
            result = run(SimpleNamespace(directory=folder), {'model':model, 'image':image, 'item_id':'synthetic-smoke'})
            assert result['run_id'] and result['model_version'] != 'unknown'
            print(json.dumps({'model':model,'success':True,'tag_count':len(result['suggestions'])}),flush=True)
    return 0
