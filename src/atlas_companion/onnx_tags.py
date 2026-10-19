"""Replaceable ONNX CPU adapters. No inference or download at import/startup."""
import base64
import hashlib
import io
import json
import sys
from pathlib import Path
from .security import APIError

MANIFEST = Path(__file__).with_name('tagging-models.json')
COCO = ('person,bicycle,car,motorcycle,airplane,bus,train,truck,boat,traffic light,fire hydrant,stop sign,parking meter,bench,bird,cat,dog,horse,sheep,cow,elephant,bear,zebra,giraffe,backpack,umbrella,handbag,tie,suitcase,frisbee,skis,snowboard,sports ball,kite,baseball bat,baseball glove,skateboard,surfboard,tennis racket,bottle,wine glass,cup,fork,knife,spoon,bowl,banana,apple,sandwich,orange,broccoli,carrot,hot dog,pizza,donut,cake,chair,couch,potted plant,bed,dining table,toilet,tv,laptop,mouse,remote,keyboard,cell phone,microwave,oven,toaster,sink,refrigerator,book,clock,vase,scissors,teddy bear,hair drier,toothbrush').split(',')
EXPRESSIONS = ('angry', 'disgust', 'fearful', 'happy', 'neutral', 'sad', 'surprised')


def asset(state, key):
    spec = json.loads(MANIFEST.read_text(encoding='utf-8'))[key]
    bundled = Path(getattr(sys, '_MEIPASS', Path(__file__).parents[2])) / 'tagging-models'
    sidecar=Path(sys.executable).parent.parent / 'tagging-models'
    for directory in (Path(state.directory) / 'tagging-models', sidecar, bundled):
        target = directory / spec['file']
        if target.is_file():
            with target.open('rb') as stream:
                digest = hashlib.file_digest(stream, 'sha256').hexdigest()
            if digest != spec['sha256']:
                raise APIError('TAG_MODEL_CHECKSUM', 'Model verification failed. Reinstall the companion model bundle.', 409)
            return target, spec
    raise APIError('TAG_MODEL_NOT_INSTALLED', 'Install the updated companion with its ONNX model bundle.', 409)


def session(path):
    import onnxruntime as ort
    options = ort.SessionOptions()
    options.intra_op_num_threads = options.inter_op_num_threads = 1
    options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
    options.enable_cpu_mem_arena = False
    return ort.InferenceSession(str(path), sess_options=options, providers=['CPUExecutionProvider'])


def decode(body):
    from PIL import Image, ImageOps
    value = body.get('image', '')
    if not isinstance(value, str) or len(value) > 2000100 or ';base64,' not in value:
        raise APIError('TAG_IMAGE_INVALID', 'Choose a supported image preview below 1.5 MB.', 400)
    header, encoded = value.split(';base64,', 1)
    if header not in ('data:image/png', 'data:image/jpeg', 'data:image/webp'):
        raise APIError('TAG_IMAGE_INVALID', 'Choose a PNG, JPEG or WebP image.', 400)
    try:
        raw = base64.b64decode(encoded, validate=True)
        if len(raw) > 1500000:
            raise ValueError('payload too large')
        with Image.open(io.BytesIO(raw)) as source:
            if source.width * source.height > 12000000:
                raise ValueError('too many pixels')
            return ImageOps.exif_transpose(source).convert('RGB')
    except Exception as exc:
        raise APIError('TAG_IMAGE_INVALID', 'Image could not be decoded within the preview limits.', 400) from exc


def predict(state, body):
    kind = body.get('model')
    if kind != 'anime':
        from .rich_tags import enabled, predict as rich_predict
        if enabled():
            return rich_predict(state, body)
    if kind not in ('objects', 'face', 'anime'):
        raise APIError('TAG_MODEL_INVALID', 'Choose Things, Faces or Anime.', 400)
    try:
        import numpy as np
        import cv2
        from PIL import Image
        cv2.setNumThreads(1)
        image = decode(body)
        path, spec = asset(state, kind)
        frame = cv2.cvtColor(np.asarray(image), cv2.COLOR_RGB2BGR)
        best = {}
        count = 0
        if kind == 'objects':
            # YOLO11 raw output: [1,84,N], xywh + 80 class scores.
            model = session(path)
            shape = model.get_inputs()[0].shape
            ih, iw = shape[2:]
            if not isinstance(ih,int) or not isinstance(iw,int) or max(ih,iw)>1024:
                raise ValueError('Object input contract mismatch')
            scale = min(iw / image.width, ih / image.height)
            width, height = round(image.width * scale), round(image.height * scale)
            canvas = Image.new('RGB', (iw, ih), (114, 114, 114))
            canvas.paste(image.resize((width, height)), ((iw-width)//2, (ih-height)//2))
            tensor = np.asarray(canvas, dtype=np.float32).transpose(2, 0, 1)[None] / 255
            values = model.run(None, {model.get_inputs()[0].name: tensor})[0]
            del model
            if values.ndim != 3 or values.shape[0]!=1 or values.shape[1]!=84 or not np.isfinite(values).all():
                raise ValueError('Object output contract mismatch')
            rows = values[0].T
            boxes, scores, classes = [], [], []
            for row in rows:
                cls = int(np.argmax(row[4:])); score = float(row[4+cls])
                if score < .3: continue
                x,y,w,h = map(float,row[:4])
                boxes.append([x-w/2,y-h/2,w,h]); scores.append(score); classes.append(cls)
            # Class-aware NMS: overlapping objects of different classes remain independent.
            keep = []
            for cls in set(classes):
                indices = [i for i,c in enumerate(classes) if c == cls]
                found = cv2.dnn.NMSBoxes([boxes[i] for i in indices], [scores[i] for i in indices], .3, .45)
                keep.extend(indices[int(i)] for i in np.asarray(found).reshape(-1))
            for index in sorted(keep,key=lambda i:-scores[i])[:40]:
                label = COCO[classes[index]]
                best[label] = max(best.get(label,0), scores[index])
                if classes[index] == 0: count += 1
            model_id = 'yolo11n-coco-onnx'
        elif kind == 'face':
            detector_path, _ = asset(state, 'detector')
            # Supporting ONNX localizer supplies five landmarks; no boxes enter UI.
            detector = cv2.FaceDetectorYN.create(str(detector_path), '', (320,320), .8, .3, 100)
            scale = min(1, 640/max(image.size))
            small = cv2.resize(frame, (max(32,round(image.width*scale)), max(32,round(image.height*scale))))
            detector.setInputSize((small.shape[1],small.shape[0]))
            _, faces = detector.detect(small)
            del detector
            model = session(path)
            target = np.array([[38.2946,51.6963],[73.5318,51.5014],[56.0252,71.7366],[41.5493,92.3655],[70.7299,92.2041]],dtype=np.float32)
            if faces is not None:
                for face in sorted(faces,key=lambda f:-f[2]*f[3])[:5]:
                    points = face[4:14].reshape(5,2).astype(np.float32)
                    # Least-squares similarity transform, no stochastic RANSAC.
                    design = np.zeros((10,4)); vector = target.reshape(-1)
                    for i,(x,y) in enumerate(points):
                        design[2*i] = [x,-y,1,0]; design[2*i+1] = [y,x,0,1]
                    a,b,tx,ty = np.linalg.lstsq(design,vector,rcond=None)[0]
                    crop = cv2.warpAffine(small,np.array([[a,-b,tx],[b,a,ty]]),(112,112))
                    tensor = ((cv2.cvtColor(crop,cv2.COLOR_BGR2RGB).astype(np.float32)/255-.5)/.5).transpose(2,0,1)[None]
                    logits = model.run(None,{model.get_inputs()[0].name:tensor})[0].reshape(-1)
                    if logits.size != 7 or not np.isfinite(logits).all(): raise ValueError('Face output contract mismatch')
                    scores = np.exp(logits-logits.max()); scores /= scores.sum()
                    index = int(scores.argmax()); label = EXPRESSIONS[index]
                    best[label] = max(best.get(label,0),float(scores[index]))
            del model
            model_id = 'opencv-mobilefacenet-fer-onnx'
        else:
            labels, _ = asset(state, 'anime_labels')
            names = labels.read_text(encoding='utf-8').splitlines()
            side = max(image.size); square = Image.new('RGB',(side,side),'white')
            square.paste(image,((side-image.width)//2,(side-image.height)//2))
            pixels = np.asarray(square.resize((448,448),Image.Resampling.BICUBIC),dtype=np.float32)/255
            tensor = ((pixels-np.array([.48145466,.4578275,.40821073],dtype=np.float32))/np.array([.26862954,.26130258,.27577711],dtype=np.float32)).transpose(2,0,1)[None]
            model = session(path)
            logits = model.run(None,{model.get_inputs()[0].name:tensor})[0].reshape(-1)
            del model
            if len(logits) != len(names) or not np.isfinite(logits).all(): raise ValueError('Anime output contract mismatch')
            scores = 1/(1+np.exp(-np.clip(logits,-80,80)))
            best = {names[int(i)]:float(scores[i]) for i in np.argsort(-scores)[:30] if scores[i]>=.4}
            model_id = 'fancyfeast/joytag'
        return {'schema':'atlas.tag-suggestions.v1','source':kind,'model':model_id,
                'model_version':spec['revision'],'model_sha256':spec['sha256'],
                'recipe':'atlas-onnx-cpu-v1','person_count':count if kind=='objects' else None,
                'suggestions':[{'tag':tag,'score':round(score,5)} for tag,score in sorted(best.items(),key=lambda p:(-p[1],p[0]))]}
    except ImportError as exc:
        raise APIError('TAG_RUNTIME_MISSING', 'Install the updated companion with ONNX runtime.', 409) from exc
    except APIError: raise
    except Exception as exc:
        raise APIError('TAG_INFERENCE_FAILED', 'Local model inference failed. Check companion diagnostics and model bundle.', 500) from exc
