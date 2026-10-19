#!/usr/bin/env python3
"""Explicit, real single-image jobs. No fixture download or inference at startup.

Run with a JSON list of {path, id, url, expected_people?}. Paths refer to photos
provided for evaluation. Reports measure output yield/count errors, not semantic
precision or demographic ground truth. Original full evidence stays in state.
"""
import argparse
import base64
import hashlib
import io
import json
import os
from pathlib import Path
import platform
import sys
import time

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'src'))


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state-dir',required=True,type=Path)
    parser.add_argument('--fixtures',required=True,type=Path)
    parser.add_argument('--output',required=True,type=Path)
    args=parser.parse_args()
    from PIL import Image,ImageOps
    from atlas_companion.tagging import run
    from types import SimpleNamespace
    state=SimpleNamespace(directory=args.state_dir)
    report={'schema':'atlas.rich-tagging.benchmark.v1','platform':platform.platform(),
            'python':platform.python_version(),'fixtures':[],
            'semantic_precision':'NOT_MEASURED; requires reviewed tag annotations',
            'age_error':'NOT_MEASURED; no verified subject ages',
            'appearance_error':'NOT_MEASURED; no annotated appearance labels',
            'windows_exe':'NOT_RUN by this source benchmark'}
    original=os.environ.get('ATLAS_TAGGING_PROFILE')
    try:
        for fixture in json.loads(args.fixtures.read_text()):
            path=Path(fixture['path']);raw=path.read_bytes()
            with Image.open(io.BytesIO(raw)) as opened:
                image=ImageOps.exif_transpose(opened).convert('RGB')
                image.thumbnail((1280,1280))
                buf=io.BytesIO();image.save(buf,format='JPEG',quality=90)
            payload='data:image/jpeg;base64,'+base64.b64encode(buf.getvalue()).decode()
            sample={**{k:v for k,v in fixture.items() if k!='path'},'sha256':hashlib.sha256(raw).hexdigest(),'preview_size':list(image.size),'runs':[]}
            for profile,models in [('legacy',('objects','face','anime')),('rich',('objects','people','anime'))]:
                os.environ['ATLAS_TAGGING_PROFILE']=profile
                for model in models:
                    start=time.perf_counter()
                    result=run(state,{'model':model,'image':payload,'item_id':'benchmark:'+fixture['id'],'display_choices':{'objects':True,'people':True,'face':True,'anime':True}})
                    entry={k:result[k] for k in ('model','model_version','model_sha256','source','run_id','resources','suggestions','person_count','people','aggregation','components','policy') if k in result}
                    entry.update(profile=profile,requested_model=model,seconds=round(time.perf_counter()-start,3),distinct_tags=len({s['tag'].strip().casefold() for s in result['suggestions']}))
                    if fixture.get('expected_people') is not None and result.get('person_count') is not None:
                        entry['people_absolute_error']=abs(fixture['expected_people']-result['person_count'])
                    sample['runs'].append(entry)
                    print(fixture['id'],profile,model,entry['distinct_tags'],entry['seconds'],flush=True)
            old=next(x for x in sample['runs'] if x['profile']=='legacy' and x['requested_model']=='anime')
            new=next(x for x in sample['runs'] if x['profile']=='rich' and x['requested_model']=='anime')
            sample['joytag_identical']=old['suggestions']==new['suggestions'] and old['model_sha256']==new['model_sha256']
            if not sample['joytag_identical']:
                raise AssertionError('JoyTag changed between profiles')
            report['fixtures'].append(sample)
            args.output.parent.mkdir(parents=True,exist_ok=True)
            args.output.write_text(json.dumps(report,indent=2)+'\n')
    finally:
        if original is None:os.environ.pop('ATLAS_TAGGING_PROFILE',None)
        else:os.environ['ATLAS_TAGGING_PROFILE']=original

if __name__=='__main__':main()
