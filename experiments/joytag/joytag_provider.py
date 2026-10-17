"""Replaceable JoyTag adapter. Heavy dependencies load only on explicit inference."""
from pathlib import Path
import os, sys, time, json, hashlib, urllib.request

REVISION = '6b7f16331a6ccf0fdce37d5a9564715f6e772b22'
BASE = f'https://huggingface.co/fancyfeast/joytag/resolve/{REVISION}/'
HASHES={'model.onnx':'f85b7130e6e549b5b0822537007b7482e8c4c8e754c8d9a5bee08e27050e1097','top_tags.txt':'32b1963a234af848643b2bbf47d8eff1f1c7889406810c57b980f41b2b9e01d0'}

def verify(path):
    with path.open('rb') as stream:
        actual=hashlib.file_digest(stream,'sha256').hexdigest()
    if actual!=HASHES[path.name]:
        raise ValueError('MODEL_CHECKSUM_MISMATCH: '+path.name)

MAX_IMAGE_BYTES = 30 * 1024 * 1024
MAX_PIXELS = 20_000_000

def cache_dir():
    root = Path(os.environ.get('LOCALAPPDATA') or os.environ.get('XDG_CACHE_HOME') or Path.home() / '.cache')
    return root / 'Atlas' / 'experiments' / 'joytag' / REVISION

def download(directory):
    directory.mkdir(parents=True, exist_ok=True)
    for name, limit in [('model.onnx', 400_000_000), ('top_tags.txt', 1_000_000)]:
        target = directory / name
        if target.exists():
            verify(target)
            print(f'Already downloaded: {name}', file=sys.stderr)
            continue
        partial = target.with_suffix(target.suffix + '.partial')
        print(f'Downloading {name} from pinned official JoyTag revision…', file=sys.stderr, flush=True)
        try:
            request = urllib.request.Request(BASE + name, headers={'User-Agent': 'Atlas-JoyTag-Experiment/1'})
            with urllib.request.urlopen(request, timeout=60) as response, partial.open('wb') as output:
                total = 0
                while chunk := response.read(1024 * 1024):
                    total += len(chunk)
                    if total > limit:
                        raise ValueError('MODEL_DOWNLOAD_TOO_LARGE')
                    output.write(chunk)
                    if total % (32 * 1024 * 1024) == 0:
                        print(f'{name}: {total // (1024 * 1024)} MiB', file=sys.stderr, flush=True)
            with partial.open('rb') as stream:
                actual=hashlib.file_digest(stream,'sha256').hexdigest()
            if actual!=HASHES[name]:raise ValueError('MODEL_CHECKSUM_MISMATCH: '+name)
            partial.replace(target)
        finally:
            partial.unlink(missing_ok=True)

def prepare(image_path):
    import numpy as np
    from PIL import Image, ImageOps
    path = Path(image_path)
    if not path.is_file() or path.stat().st_size > MAX_IMAGE_BYTES:
        raise ValueError('Choose one local image up to 30 MiB.')
    Image.MAX_IMAGE_PIXELS = MAX_PIXELS
    with Image.open(path) as source:
        if source.width * source.height > MAX_PIXELS:
            raise ValueError('Choose an image under 20 megapixels.')
        if source.format not in ('PNG', 'JPEG', 'WEBP', 'GIF'):
            raise ValueError('Choose a PNG, JPEG, WebP or GIF.')
        source.seek(0)
        rgb = ImageOps.exif_transpose(source).convert('RGB')
        side = max(rgb.size)
        square = Image.new('RGB', (side, side), 'white')
        square.paste(rgb, ((side-rgb.width)//2, (side-rgb.height)//2))
        square = square.resize((448,448), Image.Resampling.BICUBIC)
        array = np.asarray(square, dtype=np.float32) / 255.0
    mean = np.array([0.48145466,0.4578275,0.40821073], dtype=np.float32)
    std = np.array([0.26862954,0.26130258,0.27577711], dtype=np.float32)
    return np.ascontiguousarray(((array-mean)/std).transpose(2,0,1)[None])

def peak_memory_mib():
    try:
        import resource
        value = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        return round(value/(1024*1024 if sys.platform=='darwin' else 1024),1)
    except ImportError:
        return None

def predict(image, directory, threshold=0.4, top=30):
    import numpy as np
    import onnxruntime as ort
    if not 0 < threshold < 1 or not 1 <= top <= 100:
        raise ValueError('Invalid threshold or result count.')
    tensor = prepare(image)
    model = directory / 'model.onnx'
    tags_path = directory / 'top_tags.txt'
    if not model.is_file() or not tags_path.is_file():
        raise ValueError('Model is not installed. Run --download first.')
    verify(model);verify(tags_path)
    names = tags_path.read_text(encoding='utf-8').splitlines()
    options = ort.SessionOptions()
    options.intra_op_num_threads = 1
    options.inter_op_num_threads = 1
    options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
    options.enable_cpu_mem_arena = False
    start = time.perf_counter()
    session = ort.InferenceSession(str(model), sess_options=options, providers=['CPUExecutionProvider'])
    loaded = time.perf_counter()
    outputs = session.run(None, {session.get_inputs()[0].name:tensor})
    elapsed = time.perf_counter()
    scores = np.asarray(outputs[0]).reshape(-1)
    if scores.size != len(names) or not np.isfinite(scores).all():
        raise ValueError('MODEL_OUTPUT_MISMATCH')
    # Official ONNX returns logits; sigmoid maps these to independent tag scores.
    scores = 1 / (1 + np.exp(-np.clip(scores,-80,80)))
    suggestions = [{'tag':names[int(i)],'score':round(float(scores[i]),5)} for i in np.argsort(-scores)[:top] if scores[i]>=threshold]
    result = {'format':'atlas.tag-suggestions.v1','model':'fancyfeast/joytag','revision':REVISION,
              'threshold':threshold,'suggestions':suggestions,'threads':1,'device':'CPU',
              'model_bytes':model.stat().st_size,'load_seconds':round(loaded-start,3),
              'inference_seconds':round(elapsed-loaded,3),'peak_process_mib':peak_memory_mib()}
    del session
    return result

