"""Optional, on-demand photo tagging. No model/dependency download on startup.

Install optional extras and model weights separately; model paths stay under the
private companion state directory. Outputs are suggestions, not human tags.
"""
import base64
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
import threading

from .security import APIError

MAX_IMAGE_BYTES = 1500000
_lock = threading.Lock()
CATEGORIES = ("angry", "disgust", "fearful", "happy", "neutral", "sad", "surprised")

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

def _run_model(state, body):
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
            # OpenCV Zoo FER expects a 112x112 RGB crop, normalized to [-1, 1].
            # A basic frontal-face crop is used until landmark alignment is integrated.
            net = cv2.dnn.readNetFromONNX(str(weights))
            best = {}
            for x, y, w, h in sorted(faces, key=lambda f: f[2]*f[3], reverse=True)[:5]:
                crop = frame[y:y+h, x:x+w]
                crop = cv2.resize(crop, (112,112))
                blob = cv2.dnn.blobFromImage(crop, scalefactor=1.0/127.5, size=(112,112), mean=(127.5,127.5,127.5), swapRB=True)
                net.setInput(blob, 'data')
                logits = net.forward('label').reshape(-1)
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

# Private, append-only evidence, independent from tag selections or card rendering.
# Read operations share this lock to avoid retrieving incomplete lines.
_metrics_lock = threading.Lock()
METRICS_FILE = "tagging-metrics.jsonl"

def _metrics_path(state):
    return Path(state.directory) / "evidence" / METRICS_FILE

def _append_metric(state, event):
    path = _metrics_path(state)
    with _metrics_lock:
        path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        # Owner-only data. The companion state directory is already private.
        fd = os.open(path, os.O_APPEND | os.O_CREAT | os.O_WRONLY, 0o600)
        try:
            encoded = (json.dumps(event, sort_keys=True, separators=(",", ":"), allow_nan=False) + "\n").encode("utf-8")
            while encoded:
                written = os.write(fd, encoded)
                if written <= 0:
                    raise OSError("Telemetry append failed")
                encoded = encoded[written:]
        finally:
            os.close(fd)

def run(state, body):
    """Record each attempted inference, including failures and empty results."""
    started = time.perf_counter()
    source = body.get("model") if isinstance(body, dict) else None
    model_id = {"objects": "yolo11n-coco", "face": "opencv-mobilefacenet-fer-int8"}.get(source, "unknown")
    success = False
    count = 0
    error_code = None
    try:
        result = _run_model(state, body)
        model_id = result.get("model", model_id)
        count = len(result.get("suggestions", ()))
        success = True
        return result
    except Exception as exc:
        error_code = exc.code if isinstance(exc, APIError) else "INTERNAL_ERROR"
        raise
    finally:
        event = {
            "schema": "atlas.tagging.metric.v1",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": source if source in ("objects", "face") else "unknown",
            "model": model_id,
            "duration_ms": round((time.perf_counter() - started) * 1000, 3),
            "tag_count": count,
            "success": success,
            "error_code": error_code
        }
        try:
            _append_metric(state, event)
        except OSError:
            # Never disguise or fail a model run because instrumentation is unavailable.
            import logging
            logging.exception("Unable to persist tagging telemetry")

def metrics(state, limit=100):
    """Read the latest bounded events with aggregate per-model counts.

    Read-only, accessible through the existing authenticated companion API.
    """
    if type(limit) is not int or not 1 <= limit <= 500:
        raise APIError("INVALID_LIMIT", "Limit must be an integer from 1 to 500.", 400)
    path = _metrics_path(state)
    with _metrics_lock:
        if not path.exists():
            return {"schema": "atlas.tagging.metrics.v1", "events": [], "summary": []}
        # Recent 500 events only; avoid unbounded memory on large logs.
        from collections import deque
        with path.open("r", encoding="utf-8") as handle:
            lines = deque(handle, maxlen=500)
    events = []
    for line in list(lines)[-limit:]:
        try:
            item = json.loads(line)
            if item.get("schema") == "atlas.tagging.metric.v1":
                events.append(item)
        except (json.JSONDecodeError, AttributeError):
            continue
    groups = {}
    for item in events:
        name = item["model"]
        group = groups.setdefault(name, {"model": name, "runs": 0, "successes": 0, "failures": 0, "tags": 0, "total_duration_ms": 0})
        group["runs"] += 1
        group["successes" if item["success"] else "failures"] += 1
        group["tags"] += item["tag_count"]
        group["total_duration_ms"] += item["duration_ms"]
    summary = [{**group, "average_duration_ms": round(group["total_duration_ms"]/group["runs"], 3),
                "average_tag_count": round(group["tags"]/group["runs"], 3)}
               for group in groups.values()]
    return {"schema": "atlas.tagging.metrics.v1", "events": events, "summary": summary}
