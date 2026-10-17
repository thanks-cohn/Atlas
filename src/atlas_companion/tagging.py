"""Optional, on-demand photo tagging. No model/dependency download on startup.

Install optional extras and model weights separately; model paths stay under the
private companion state directory. Outputs are suggestions, not human tags.
"""
import base64
import io
from pathlib import Path
import threading

from .security import APIError

MAX_IMAGE_BYTES = 1500000
_lock = threading.Lock()
CATEGORIES = ("angry", "disgust", "fear", "happy", "neutral", "sad", "surprise")

def _image(body):
    value = body.get("image")
    if not isinstance(value, str) or not value.startswith("data:image/") or ";base64," not in value:
        raise APIError("TAG_IMAGE_INVALID", "Select a supported image first.", 400)
    kind, encoded = value.split(";base64,", 1)
    if kind not in ("data:image/jpeg", "data:image/png", "data:image/webp") or len(encoded) > MAX_IMAGE_BYTES * 4 // 3 + 16:
        raise APIError("TAG_IMAGE_TOO_LARGE", "Tagging needs a JPEG, PNG, or WebP image below 1.5 MB.", 413)
    try:
        raw = base64.b64decode(encoded, validate=True)
    except (ValueError, base64.binascii.Error):
        raise APIError("TAG_IMAGE_INVALID", "Invalid encoded image.", 400)
    if len(raw) > MAX_IMAGE_BYTES:
        raise APIError("TAG_IMAGE_TOO_LARGE", "Image exceeds the inference payload limit.", 413)
    try:
        import cv2
        import numpy as np
    except ImportError:
        raise APIError("TAG_RUNTIME_MISSING", "Install optional opencv-python-headless and numpy to enable local tagging.", 409)
    decoded = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
    if decoded is None or decoded.shape[0] * decoded.shape[1] > 12000000:
        raise APIError("TAG_IMAGE_INVALID", "Image could not be decoded or exceeds 12 megapixels.", 400)
    return cv2, decoded

def run(state, body):
    kind = body.get("model")
    if kind not in ("objects", "face"):
        raise APIError("TAG_MODEL_INVALID", "Choose objects or facial expressions.", 400)
    if not _lock.acquire(blocking=False):
        raise APIError("TAG_BUSY", "Another image is being tagged; retry after it completes.", 409)
    try:
        cv2, frame = _image(body)
        directory = Path(state.directory) / "tagging-models"
        if kind == "objects":
            weights = directory / "yolo11n.pt"
            if not weights.is_file():
                raise APIError("TAG_MODEL_NOT_INSTALLED", "Object model not installed. Place yolo11n.pt in the companion's tagging-models folder.", 409)
            try:
                from ultralytics import YOLO
            except ImportError:
                raise APIError("TAG_RUNTIME_MISSING", "Install optional ultralytics to enable object tagging.", 409)
            model = YOLO(str(weights))
            predictions = model.predict(source=frame, verbose=False, device="cpu", imgsz=640, conf=0.3, max_det=40)
            best = {}
            for pred in predictions:
                for box in pred.boxes:
                    label = str(pred.names[int(box.cls.item())]).lower()
                    confidence = float(box.conf.item())
                    best[label] = max(best.get(label, 0), confidence)
            model_name = "yolo11n-coco"
        else:
            weights = directory / "facial_expression_recognition_mobilefacenet_2022july_int8.onnx"
            if not weights.is_file():
                raise APIError("TAG_MODEL_NOT_INSTALLED", "Facial expression model is not installed.", 409)
            # Haar is a small face-localization dependency, not a third user-selectable tagger.
            cascade_file = Path(cv2.data.haarcascades) / "haarcascade_frontalface_default.xml"
            detector = cv2.CascadeClassifier(str(cascade_file))
            if detector.empty():
                raise APIError("TAG_FACE_DETECTOR_MISSING", "Face localization resources are missing.", 409)
            grayscale = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = detector.detectMultiScale(grayscale, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))
            if len(faces) == 0:
                return {"schema":"atlas.tag-suggestions.v1","model":"opencv-mobilefacenet-fer-int8",
                        "source":"face","suggestions":[],"note":"No frontal face detected; no expression inferred."}
            from cv2 import FaceDetectorYN
            # OpenCV Zoo model expects 112x112 RGB normalized to [-1,1].
            net = cv2.dnn.readNetFromONNX(str(weights))
            best = {}
            for x, y, w, h in sorted(faces, key=lambda f: f[2]*f[3], reverse=True)[:5]:
                crop = frame[y:y+h, x:x+w]
                crop = cv2.resize(crop, (112,112))
                blob = cv2.dnn.blobFromImage(crop, scalefactor=1.0/127.5, size=(112,112), mean=(127.5,127.5,127.5), swapRB=True)
                net.setInput(blob)
                logits = net.forward().reshape(-1)
                if len(logits) != 7:
                    raise APIError("TAG_MODEL_OUTPUT_INVALID", "Unexpected facial-expression model output.", 500)
                import numpy as np
                probs = np.exp(logits - logits.max())
                probs /= probs.sum()
                index = int(probs.argmax())
                best[CATEGORIES[index]] = max(best.get(CATEGORIES[index], 0), float(probs[index]))
            model_name = "opencv-mobilefacenet-fer-int8"
        suggestions = [{"tag":tag,"score":round(score, 4)} for tag,score in sorted(best.items(),key=lambda p:(-p[1],p[0]))]
        return {"schema":"atlas.tag-suggestions.v1","model":model_name,"source":kind,"suggestions":suggestions,
                "note":"Machine suggestions only; not automatically added to human tags."}
    finally:
        _lock.release()
