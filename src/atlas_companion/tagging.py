"""Optional, on-demand photo tagging. No model/dependency download on startup.

Build artifacts bundle pinned ONNX models. Source installs can prepare a private
model directory. Outputs are suggestions, not human tags.
"""
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
import threading

from .security import APIError

MAX_IMAGE_BYTES = 1500000
_lock = threading.Lock()

def _run_model(state, body):
    choices = body.get('display_choices', {})
    if not isinstance(choices, dict) or any(k not in ('objects', 'people', 'face', 'anime') or type(v) is not bool for k,v in choices.items()):
        raise APIError('TAG_CHOICES_INVALID', 'Invalid tag choices.', 400)
    if body.get('item_id') is not None and (not isinstance(body['item_id'], str) or len(body['item_id']) > 8192):
        raise APIError('TAG_ITEM_INVALID', 'Invalid item identity.', 400)
    if not _lock.acquire(blocking=False):
        raise APIError("TAG_BUSY", "Another image is being tagged; retry after it completes.", 409)
    try:
        from .tag_process import run_engine
        return run_engine(state, body)
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
    model_id = {"objects": "yolo11n-coco-onnx", "face": "opencv-mobilefacenet-fer-onnx", "anime": "fancyfeast/joytag"}.get(source, "unknown")
    success = False
    count = 0
    error_code = None
    try:
        result = _run_model(state, body)
        model_id = result.get("model", model_id)
        count = len(result.get("suggestions", ()))
        from .tag_provenance import record
        try:
            evidence = record(state, body, result, round((time.perf_counter() - started) * 1000, 3))
        except (OSError, ValueError) as exc:
            raise APIError("TAG_EVIDENCE_SAVE_FAILED", "Predictions could not be saved safely; retry after checking companion storage.", 500) from exc
        result = {**result, "run_id": evidence["run_id"], "origin": "machine", "image_payload_sha256": evidence["image_payload_sha256"]}
        success = True
        return result
    except Exception as exc:
        error_code = exc.code if isinstance(exc, APIError) else "INTERNAL_ERROR"
        raise
    finally:
        event = {
            "schema": "atlas.tagging.metric.v1",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": source if source in ("objects", "face", "anime") else "unknown",
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
