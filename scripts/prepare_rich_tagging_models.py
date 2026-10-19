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
MIVOLO_COMMIT = '37475e3f8818b5f22448003feec3e64b01bfb188'
SOURCES = {
    'ram_plus.onnx': ('CannotFindObject/RAM_ONNX', '6c4ca81fb841e359c043c1e8f92f62bf5c3b8c18', 'ram_plus.onnx', 1859243322, '4197a2cd19b6623e1286e9feda991e793fed7749ed9cee9793b174fee0eb844f'),
    'mivolo.safetensors': ('iitolstykh/mivolo_v2', '53393526c220e34cdd7b722b36d22b6f9e5f4241', 'model.safetensors', 115078528, '96efb47051c038ebeec74b73b4253c5fd000433e5afcab7deee0bd8f3fa7bf18'),
    'person-face.pt': ('iitolstykh/YOLO-Face-Person-Detector', 'b3d071aedccd46a3b2d4b40609da6880a815f395', 'yolov8x_person_face.pt', 136716488, '2620f45609a65f909eb876bd7401308b5a8f3843ad5a03cb7416066a3e492989'),
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


def export_mivolo(work):
    # Check out architecture from the authors at one immutable commit. No HF
    # trust_remote_code at runtime; safetensors loads weights without pickle.
    source = work / 'MiVOLO'
    if not source.exists():
        subprocess.run(['git', 'clone', '--no-checkout', 'https://github.com/WildChlamydia/MiVOLO.git', str(source)], check=True)
    subprocess.run(['git', '-C', str(source), 'checkout', '--detach', MIVOLO_COMMIT], check=True)
    if subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip() != MIVOLO_COMMIT:
        raise ValueError('MiVOLO architecture revision mismatch')
    if subprocess.check_output(['git', '-C', str(source), 'status', '--porcelain'], text=True).strip():
        raise ValueError('MiVOLO architecture checkout is modified')
    sys.path.insert(0, str(source))
    import torch
    from torch.onnx import symbolic_helper as sh
    from safetensors.torch import load_file
    from mivolo.model.create_timm_model import create_model

    @sh.parse_args('v', 'v', 'is', 'is', 'is', 'is')
    def col2im(g, x, output_size, kernel, dilation, padding, stride):
        # Torch 2.5's stock opset18 exporter loses the ListConstruct shape.
        dims = [g.op('Unsqueeze', v, g.op('Constant', value_t=torch.tensor([0], dtype=torch.long)))
                for v in sh._unpack_list(output_size)]
        shape = g.op('Concat', *dims, axis_i=0)
        return g.op('Col2Im', x, shape, g.op('Constant', value_t=torch.tensor(kernel, dtype=torch.long)),
                    dilations_i=dilation, pads_i=padding+padding, strides_i=stride)

    torch.onnx.register_custom_op_symbolic('aten::col2im', col2im, 18)
    torch.set_num_threads(1)
    torch.manual_seed(0)
    model = create_model('mivolo_d1_384', pretrained=False, num_classes=3, in_chans=6).eval()
    model.load_state_dict({k.removeprefix('mivolo.model.'): v for k, v in load_file(str(work/'mivolo.safetensors')).items()}, strict=True)
    tensor = torch.zeros(1, 6, 384, 384)
    torch.onnx.export(model, tensor, str(work/'mivolo-v2.onnx'), input_names=['face_body'],
                      output_names=['head'], opset_version=18, do_constant_folding=True)
    # Independent execution parity on normalized noise, zero and missing streams.
    import numpy as np
    import onnxruntime as ort
    options = ort.SessionOptions(); options.intra_op_num_threads = options.inter_op_num_threads = 1
    session = ort.InferenceSession(str(work/'mivolo-v2.onnx'), sess_options=options, providers=['CPUExecutionProvider'])
    errors = []
    for x in (tensor, torch.randn_like(tensor), torch.cat((torch.zeros(1,3,384,384), torch.randn(1,3,384,384)), dim=1)):
        with torch.no_grad():
            expected = model(x).numpy()
        actual = session.run(None, {'face_body': x.numpy()})[0]
        error = float(np.max(np.abs(expected-actual))); errors.append(error)
        if error > .001:
            raise ValueError('MiVOLO export parity exceeded 0.001 head units')
    print('MiVOLO head parity max absolute errors:', errors, flush=True)


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
    if not valid(directory/specs['mivolo']['file'], specs['mivolo']):
        export_mivolo(work)
    if not valid(directory/specs['people_detector']['file'], specs['people_detector']):
        import os
        os.environ['YOLO_AUTOINSTALL'] = 'false'
        from ultralytics import YOLO
        model = YOLO(str(work/'person-face.pt')) # Only the hash-verified author checkpoint, at build time.
        if model.names != {0: 'person', 1: 'face'}:
            raise ValueError('Detector class order mismatch')
        model.export(format='onnx', imgsz=640, opset=17, simplify=False, dynamic=False)
        import onnx
        graph = onnx.load(str(work/'person-face.onnx'))
        del graph.metadata_props[:] # Strip exporter date/path metadata; preserve graph/weights.
        onnx.save(graph, str(work/'person-face.onnx'))
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
