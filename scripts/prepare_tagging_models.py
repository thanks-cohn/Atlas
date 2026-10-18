#!/usr/bin/env python3
"""Build-time only: pinned assets, bounded downloads, SHA-256 before publication."""
import hashlib
import json
from pathlib import Path
import sys
import urllib.request
ROOT = Path(__file__).resolve().parents[1]

def prepare(directory):
    directory.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((ROOT/'src/atlas_companion/tagging-models.json').read_text())
    for spec in manifest.values():
        path = directory/spec['file']
        def valid(target):
            if not target.is_file() or target.stat().st_size != spec['bytes']: return False
            with target.open('rb') as handle:
                return hashlib.file_digest(handle,'sha256').hexdigest() == spec['sha256']
        if valid(path): continue
        temporary = path.with_suffix(path.suffix+'.partial')
        try:
            with urllib.request.urlopen(spec['url'],timeout=60) as response, temporary.open('wb') as output:
                size = 0
                while chunk := response.read(1024*1024):
                    size += len(chunk)
                    if size > spec['bytes']: raise ValueError('Model exceeds pinned size')
                    output.write(chunk)
            if not valid(temporary): raise ValueError('Model checksum mismatch: '+spec['file'])
            temporary.replace(path)
        finally:
            temporary.unlink(missing_ok=True)
    print('Verified ONNX assets:',sum(x['bytes'] for x in manifest.values()),'bytes')

if __name__=='__main__': prepare(Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'build/tagging-models')
