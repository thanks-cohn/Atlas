"""Portable machine evidence and a rebuildable, deduplicated presentation.

JSONL is authoritative. JSON is an atomic current projection; human input remains
owned by its existing store. No inference, downloads, or filesystem scans here.
"""
import hashlib
import json
import os
import threading
import unicodedata
import uuid
from datetime import datetime, timezone
from pathlib import Path

_lock = threading.Lock()


def tag_key(label):
    return unicodedata.normalize('NFKC', label).strip().casefold()


def project(events):
    """Latest run per item/source; every historical prediction stays in JSONL."""
    items = {}
    for event in events:
        item = items.setdefault(event['item_id'], {'sources': {}, 'derived': [], 'presented': []})
        image_hash = event.get('image_payload_sha256')
        if image_hash and item.get('image_payload_sha256') != image_hash:
            item['sources'] = {}
            item['image_payload_sha256'] = image_hash
        item['sources'][event['source']] = event
    for item in items.values():
        grouped = {}
        for event in item['sources'].values():
            for index, prediction in enumerate(event['produced']):
                key = tag_key(prediction['tag'])
                if not key:
                    continue
                entry = grouped.setdefault(key, {'key': key, 'tag': prediction['tag'].strip(), 'contributors': []})
                entry['contributors'].append({
                    'run_id': event['run_id'], 'model': event['model'],
                    'source': event['source'], 'prediction_index': index,
                    'score': prediction.get('score'),
                    'eligible': (event.get('display_choices', {}).get('people' if key == 'person' else 'objects', True)
                                 if event['source'] == 'objects' else True),
                })
        item['derived'] = list(grouped.values())
        # Candidate presentation; UI may filter sources or suppress human duplicates.
        # Do not claim this projection proves what a browser actually rendered.
        item['presented'] = [{'key': x['key'], 'tag': x['tag']} for x in item['derived'] if any(c['eligible'] for c in x['contributors'])]
    return {'schema': 'atlas.tag-projection.v1', 'presentation': 'candidate', 'items': items}


def record(state, body, result, duration_ms):
    """Persist evidence before returning success. JSONL can rebuild stale JSON."""
    choices = body.get('display_choices', {})
    if not isinstance(choices, dict) or any(k not in ('objects', 'people', 'face', 'anime') or type(v) is not bool for k,v in choices.items()):
        raise ValueError('Invalid display choices')
    image = body.get('image', '')
    if not isinstance(image, str):
        raise ValueError('Invalid image payload')
    identity = body.get('item_id') or hashlib.sha256(image.encode('utf-8')).hexdigest()
    if not isinstance(identity, str) or len(identity) > 8192:
        raise ValueError('Invalid tagging item identity')
    event = {
        'schema': 'atlas.tag-run.v1', 'run_id': str(uuid.uuid4()),
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'item_id': identity, 'image_payload_sha256': hashlib.sha256(image.encode('utf-8')).hexdigest(),
        'origin': 'machine', 'source': result['source'], 'model': result['model'],
        'model_version': result.get('model_version', 'unknown'),
        'model_sha256': result.get('model_sha256', 'unknown'),
        'recipe': result.get('recipe', 'legacy-companion-v1'),
        'duration_ms': duration_ms, 'produced': result.get('suggestions', []),
        'display_choices': choices,
    }
    directory = Path(state.directory) / 'evidence'
    with _lock:
        directory.mkdir(mode=0o700, parents=True, exist_ok=True)
        log = directory / 'tagging-runs.jsonl'
        encoded = (json.dumps(event, ensure_ascii=False, allow_nan=False) + '\n').encode('utf-8')
        fd = os.open(log, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600)
        try:
            while encoded:
                size = os.write(fd, encoded)
                if size <= 0:
                    raise OSError('Tag evidence append failed')
                encoded = encoded[size:]
            os.fsync(fd)
        finally:
            os.close(fd)
        # Stream history into latest runs so memory depends on current state, not run count.
        latest = {}
        with log.open(encoding='utf-8') as handle:
            for line in handle:
                entry = json.loads(line)
                identity = (entry['item_id'], entry['source'])
                latest.pop(identity, None)
                latest[identity] = entry
        projection = project(latest.values())
        temporary = directory / ('tagging-current.' + uuid.uuid4().hex + '.tmp')
        try:
            fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, 'w', encoding='utf-8') as handle:
                json.dump(projection, handle, ensure_ascii=False, allow_nan=False)
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temporary, directory / 'tagging-current.json')
        finally:
            temporary.unlink(missing_ok=True)
    return event
