"""Real bundled-model execution probe, only invoked through explicit CLI flag."""
import base64
import io
import json
import tempfile
from types import SimpleNamespace


def main():
    from .tagging import run
    buffer = io.BytesIO()
    import struct, zlib
    def chunk(kind,data):
        return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
    buffer.write(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',320,240,8,2,0,0,0))+chunk(b'IDAT',zlib.compress((b'\0'+b'\xff'*960)*240))+chunk(b'IEND',b''))
    image = 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode()
    with tempfile.TemporaryDirectory(prefix='atlas-model-smoke-') as folder:
        for model in ('objects', 'face', 'anime'):
            result = run(SimpleNamespace(directory=folder), {'model':model, 'image':image, 'item_id':'synthetic-smoke'})
            assert result['run_id'] and result['model_version'] != 'unknown'
            print(json.dumps({'model':model,'success':True,'tag_count':len(result['suggestions']),'resources':result.get('resources')}),flush=True)
    assert not any(name in __import__('sys').modules for name in ('numpy','cv2','onnxruntime','PIL')), 'AI libraries leaked into the helper process'
    print('PASS: main helper never imported AI dependencies; every model ran in an exited child.')
    return 0
