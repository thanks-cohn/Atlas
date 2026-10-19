#!/usr/bin/env python3
"""Actual authenticated /v1/tag-image source smoke against a supplied photo/cache.

Uses only disposable state and loopback. Requires prepared assets. Does not alter
user pairing, grants or installed models. No inference unless explicitly run.
"""
import argparse
import base64
import http.client
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import threading

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'src'))


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--models',type=Path,required=True)
    parser.add_argument('--photo',type=Path,required=True)
    args=parser.parse_args()
    from PIL import Image,ImageOps
    from atlas_companion.server import Server
    from atlas_companion.state import State
    with Image.open(args.photo) as opened:
        image=ImageOps.exif_transpose(opened).convert('RGB');image.thumbnail((1280,1280))
        buf=io.BytesIO();image.save(buf,format='JPEG',quality=90)
    payload='data:image/jpeg;base64,'+base64.b64encode(buf.getvalue()).decode()
    previous=os.environ.get('ATLAS_TAGGING_PROFILE')
    os.environ['ATLAS_TAGGING_PROFILE']='rich'
    try:
        with tempfile.TemporaryDirectory(prefix='atlas-rich-http-') as folder:
            state=State(Path(folder)/'state')
            (state.directory/'tagging-models').symlink_to(args.models.resolve(),target_is_directory=True)
            origin='chrome-extension://'+'a'*32
            token=state.pair('a'*32)
            server=Server(state,port=0)
            thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
            try:
                for authorized,model in [(False,'objects'),(True,'objects'),(True,'people'),(True,'anime')]:
                    headers={'Origin':origin,'Content-Type':'application/json'}
                    if authorized:headers['Authorization']='Bearer '+token
                    connection=http.client.HTTPConnection('127.0.0.1',server.server_port,timeout=120)
                    try:
                        connection.request('POST','/v1/tag-image',json.dumps({'model':model,'image':payload,'item_id':'http-smoke-image'}),headers)
                        response=connection.getresponse();result=json.loads(response.read())
                    finally:connection.close()
                    if not authorized:
                        assert response.status==401 and not result['ok'];continue
                    assert response.status==200 and result['run_id'], (response.status,result)
                    if model=='people':assert result['person_count']==len(result['people'])
                    print('PASS authenticated HTTP:',model,len(result['suggestions']),'tags',flush=True)
                events=[json.loads(line) for line in (state.directory/'evidence/tagging-runs.jsonl').read_text().splitlines()]
                assert len(events)==3 and events[1]['people'] and events[1]['components']
                assert not any(m in sys.modules for m in ('torch','onnxruntime','cv2','numpy')), 'AI imported into core server'
                print('PASS: unpaired denied; structured evidence durable; core server imports no ML runtime.',flush=True)
            finally:
                server.shutdown();server.server_close();thread.join(timeout=3)
    finally:
        if previous is None:os.environ.pop('ATLAS_TAGGING_PROFILE',None)
        else:os.environ['ATLAS_TAGGING_PROFILE']=previous

if __name__=='__main__':main()
