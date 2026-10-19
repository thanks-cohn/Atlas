"""Face/person detection, conservative association, MiVOLO v2, derived counts.

Boxes are preview-pixel xyxy. Subject IDs are local to a run, not identities.
Age/appearance estimates are neither verified characteristics nor identities.
"""
import math
from collections import Counter
from .security import APIError


def policy(body):
    value = body.get('people_policy', {})
    defaults = {'adult_age': 18, 'age_boundary_margin': 4, 'appearance_min_score': .8}
    if not isinstance(value, dict) or set(value) - set(defaults):
        raise APIError('TAG_POLICY_INVALID', 'Invalid people estimation policy.', 400)
    result = {**defaults, **value}
    for key, (low, high) in {'adult_age': (1, 100), 'age_boundary_margin': (0, 20), 'appearance_min_score': (.5, 1)}.items():
        v = result[key]
        if type(v) not in (int, float) or not math.isfinite(v) or not low <= v <= high:
            raise APIError('TAG_POLICY_INVALID', 'People estimation policy is outside its supported range.', 400)
    return result


def association(bodies, faces):
    """Only accept unique containment; ambiguous faces are retained separately.

    Never count a face overlapping a body as another person. This intentionally
    sacrifices attributes in crowded/ambiguous scenes instead of guessing a pair.
    """
    candidates = []
    for face in faces:
        x1, y1, x2, y2 = face['box']
        area = (x2-x1)*(y2-y1)
        eligible = []
        overlaps = []
        for i, body in enumerate(bodies):
            a, b, c, d = body['box']
            overlap = max(0, min(x2,c)-max(x1,a))*max(0, min(y2,d)-max(y1,b)) / area
            if overlap > .1:
                overlaps.append(i)
            if overlap >= .8 and (y1+y2)/2 <= b + .6*(d-b):
                eligible.append(i)
        candidates.append((eligible, overlaps))
    claimed = Counter(items[0][0] for items in candidates if len(items[0]) == 1)
    subjects = [{'body': b, 'face': None, 'association': 'body-only'} for b in bodies]
    unassociated = []
    for face, (eligible, overlaps) in zip(faces, candidates):
        if len(eligible) == 1 and claimed[eligible[0]] == 1:
            subjects[eligible[0]].update(face=face, association='unique-containment')
        elif not overlaps:
            subjects.append({'body': None, 'face': face, 'association': 'face-only'})
        else:
            unassociated.append({**face, 'reason': 'ambiguous-face-body-association', 'candidate_bodies': eligible})
            for i in overlaps:
                subjects[i]['association'] = 'ambiguous'
    return subjects, unassociated


def aggregate(people, config):
    counts = Counter({'people': len(people), 'adults': 0, 'children': 0, 'age_unknown': 0,
                      'adult_male': 0, 'adult_female': 0, 'boys': 0, 'girls': 0, 'appearance_unknown': 0})
    for p in people:
        age = p.get('age_estimate')
        group = 'unknown'
        if age is not None:
            if age < config['adult_age'] - config['age_boundary_margin']:
                group = 'child'
            elif age >= config['adult_age'] + config['age_boundary_margin']:
                group = 'adult'
        p['age_group_estimate'] = group
        counts[{'adult': 'adults', 'child': 'children', 'unknown': 'age_unknown'}[group]] += 1
        appearance = p.get('appearance_estimate')
        if appearance is None:
            counts['appearance_unknown'] += 1
        if group == 'adult' and appearance in ('male', 'female'):
            counts['adult_' + appearance] += 1
        if group == 'child' and appearance in ('male', 'female'):
            counts['boys' if appearance == 'male' else 'girls'] += 1
    names = {'people': ('person', 'people'), 'adults': ('adult', 'adults'), 'children': ('child', 'children'),
             'adult_male': ('adult male', 'adult males'), 'adult_female': ('adult female', 'adult females'),
             'boys': ('boy', 'boys'), 'girls': ('girl', 'girls')}
    tags = [{'tag': f'{counts[key]} {singular if counts[key] == 1 else plural}', 'score': None,
             'category': 'people', 'derived': True, 'count_key': key}
            for key, (singular, plural) in names.items() if counts[key]]
    return dict(counts), tags


def letterbox(image, size, fill):
    import cv2
    scale = min(size/image.shape[1], size/image.shape[0])
    w, h = round(image.shape[1]*scale), round(image.shape[0]*scale)
    left, top = round((size-w)/2-.1), round((size-h)/2-.1)
    resized = cv2.resize(image, (w, h), interpolation=cv2.INTER_LINEAR)
    return cv2.copyMakeBorder(resized, top, size-h-top, left, size-w-left, cv2.BORDER_CONSTANT, value=(fill,)*3), scale, left, top


def detect(path, image):
    import cv2
    import numpy as np
    from .onnx_tags import session
    frame, scale, left, top = letterbox(np.asarray(image), 640, 114)
    model = session(path)
    if model.get_inputs()[0].shape != [1, 3, 640, 640]:
        raise ValueError('Person detector input contract mismatch')
    raw = model.run(None, {model.get_inputs()[0].name: np.ascontiguousarray(frame.transpose(2,0,1)[None], dtype=np.float32)/255})[0]
    del model
    if raw.ndim != 3 or raw.shape[:2] != (1, 6) or not np.isfinite(raw).all():
        raise ValueError('Person detector output contract mismatch')
    detections = []
    for cls, label in enumerate(('person', 'face')):
        boxes, scores = [], []
        for row in raw[0].T:
            score = float(row[4+cls])
            if score < .4:
                continue
            x, y, w, h = map(float, row[:4])
            if w <= 0 or h <= 0:
                continue
            boxes.append([x-w/2, y-h/2, w, h]); scores.append(score)
        keep = np.asarray(cv2.dnn.NMSBoxes(boxes, scores, .4, .5)).reshape(-1)
        for index in sorted(map(int, keep), key=lambda i: -scores[i]):
            x,y,w,h = boxes[index]
            box = [max(0., min(image.width, (x-left)/scale)), max(0., min(image.height, (y-top)/scale)),
                   max(0., min(image.width, (x+w-left)/scale)), max(0., min(image.height, (y+h-top)/scale))]
            if box[2]-box[0] >= 2 and box[3]-box[1] >= 2:
                detections.append({'kind': label, 'box': box, 'score': scores[index]})
    return detections


def crop_tensor(image, detection):
    import numpy as np
    if detection is None:
        pixels = np.zeros((384,384,3), dtype=np.float32)
    else:
        a,b,c,d = detection['box']
        crop = np.asarray(image)[math.floor(b):math.ceil(d), math.floor(a):math.ceil(c)]
        pixels = letterbox(crop, 384, 0)[0].astype(np.float32)/255
    return ((pixels-np.array([.485,.456,.406],dtype=np.float32))/np.array([.229,.224,.225],dtype=np.float32)).transpose(2,0,1)


def predict(state, body, image):
    import cv2
    import numpy as np
    from .onnx_tags import session
    from .rich_tags import asset, component
    config = policy(body)
    cv2.setNumThreads(1)
    detector_path, detector_spec = asset(state, 'people_detector')
    path, spec = asset(state, 'mivolo')
    detections = detect(detector_path, image) # Session is destroyed before MiVOLO loads.
    subjects, unmatched = association([x for x in detections if x['kind']=='person'], [x for x in detections if x['kind']=='face'])
    people = []
    model = None
    try:
        for index, subject in enumerate(subjects):
            record = {'subject_id': index, **subject, 'age_estimate': None, 'appearance_estimate': None,
                      'appearance_scores': None, 'raw_head': None, 'estimate_status': 'unknown'}
            people.append(record)
            if index >= 64:
                record['estimate_status'] = 'classification-resource-limit'; continue
            if subject['association'] == 'ambiguous':
                record['estimate_status'] = 'ambiguous-association'; continue
            selected = subject['face'] or subject['body']
            a,b,c,d = selected['box']
            if min(c-a,d-b) < 32:
                record['estimate_status'] = 'insufficient-resolution'; continue
            if model is None:
                model = session(path)
                if model.get_inputs()[0].shape != [1,6,384,384]:
                    raise ValueError('MiVOLO input contract mismatch')
            tensor = np.ascontiguousarray(np.concatenate([crop_tensor(image,subject['face']), crop_tensor(image,subject['body'])],axis=0)[None])
            head = model.run(None,{model.get_inputs()[0].name:tensor})[0]
            if head.shape != (1,3) or not np.isfinite(head).all():
                raise ValueError('MiVOLO output contract mismatch')
            record['raw_head'] = head[0].astype(float).tolist()
            age = float(head[0,2])*122+61
            appearance = np.exp(head[0,:2]-head[0,:2].max()); appearance /= appearance.sum()
            record['appearance_scores'] = dict(zip(('male','female'),map(float,appearance)))
            record['age_estimate'] = age if 0 <= age <= 122 else None
            best = int(appearance.argmax())
            if appearance[best] >= config['appearance_min_score']:
                record['appearance_estimate'] = ('male','female')[best]
            record['estimate_status'] = 'model-estimate'
    finally:
        del model
    counts, suggestions = aggregate(people, config)
    return {'schema':'atlas.tag-suggestions.v1','source':'people','model':spec['model'],
            'model_version':spec['revision'],'model_sha256':spec['sha256'],'recipe':'atlas-mivolo-v2-onnx-v1',
            'image_size':list(image.size),'person_count':len(people),'people':people,'detections':detections,
            'unassociated_faces':unmatched,'aggregation':counts,
            'policy':{**config,'detector_min_score':.4,'nms_iou':.5,'minimum_crop_pixels':32,'classification_limit':64},
            'suggestions':suggestions,
            'components':[component('people_detector',detector_spec),component('mivolo',spec)],
            'warnings':['Age and male/female appearance are model estimates; boundary margin is a policy, not a confidence interval.']}
