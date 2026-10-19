#!/usr/bin/env python3
"""Reproduce pinned candidate assets at build time, never from an API request.

Export tools and upstream architecture are build dependencies only. Output hashes
must match the committed manifest before they may enter any companion bundle.
"""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    'ram_plus.onnx': ('CannotFindObject/RAM_ONNX', '6c4ca81fb841e359c043c1e8f92f62bf5c3b8c18', 'ram_plus.onnx', 1859243322, '4197a2cd19b6623e1286e9feda991e793fed7749ed9cee9793b174fee0eb844f'),
}


def valid(path, spec):
    if not path.is_file() or path.stat().st_size != spec['bytes']:
        return False
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest() == spec['sha256']


def download(path, spec):
    if valid(path, spec):
        return
    partial = path.with_name(path.name + '.partial')
    try:
        with urllib.request.urlopen(spec['url'], timeout=60) as src, partial.open('wb') as dst:
            size = 0
            while chunk := src.read(1024*1024):
                size += len(chunk)
                if size > spec['bytes']:
                    raise ValueError('Asset exceeds pinned size')
                dst.write(chunk)
        if not valid(partial, spec):
            raise ValueError('Asset checksum mismatch: ' + path.name)
        partial.replace(path)
    finally:
        partial.unlink(missing_ok=True)


def prepare(directory, work=None):
    directory = Path(directory); directory.mkdir(parents=True, exist_ok=True)
    work = Path(work) if work else ROOT/'build/rich-tagging-export'
    work.mkdir(parents=True, exist_ok=True)
    specs = json.loads((ROOT/'src/atlas_companion/tagging-models-rich.json').read_text())
    if all(valid(directory/s['file'], s) for s in specs.values()):
        return
    for name, (repo, revision, remote, size, digest) in SOURCES.items():
        download(work/name, {'url': f'https://huggingface.co/{repo}/resolve/{revision}/{remote}', 'bytes': size, 'sha256': digest})
    for spec in specs.values():
        if 'url' in spec:
            download(directory/spec['file'], spec)
    if not valid(directory/specs['rampp']['file'], specs['rampp']):
        from onnxruntime.quantization import quantize_dynamic, QuantType
        quantize_dynamic(str(work/'ram_plus.onnx'), str(work/specs['rampp']['file']),
                         op_types_to_quantize=['MatMul'], weight_type=QuantType.QInt8)
    for key, spec in specs.items():
        target = directory/spec['file']
        if valid(target, spec):
            continue
        source = work/spec['file']
        if not valid(source, spec):
            raise ValueError('Reproduced output differs from pinned hash: ' + key)
        partial = target.with_name(target.name+'.partial')
        try:
            shutil.copyfile(source, partial)
            if not valid(partial, spec):
                raise ValueError('Copy verification failed')
            partial.replace(target)
        finally:
            partial.unlink(missing_ok=True)
    print('Verified rich assets:', sum(s['bytes'] for s in specs.values()), 'bytes', flush=True)


if __name__ == '__main__':
    prepare(Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'build/tagging-models')
