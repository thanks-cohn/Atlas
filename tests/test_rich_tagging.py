"""Structured people evidence and replacement gates; no ML dependencies needed."""
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from atlas_companion.people_tags import aggregate, association, policy
from atlas_companion.security import APIError
from atlas_companion.tag_provenance import record
from atlas_companion.rich_tags import enabled, asset

ROOT = Path(__file__).resolve().parents[1]


def detection(box):
    return {'box':box, 'score':.9}


class PeopleTests(unittest.TestCase):
    def test_counts_reconcile_and_uncertain_estimates_stay_unknown(self):
        people = [{'age_estimate':30, 'appearance_estimate':'male'},
                  {'age_estimate':35, 'appearance_estimate':'female'},
                  {'age_estimate':8, 'appearance_estimate':'female'},
                  {'age_estimate':18, 'appearance_estimate':None},
                  {'age_estimate':None, 'appearance_estimate':'male'}]
        counts, tags = aggregate(people, policy({}))
        self.assertEqual(counts['people'], counts['adults']+counts['children']+counts['age_unknown'])
        self.assertEqual(counts['age_unknown'], 2)
        self.assertEqual([t['tag'] for t in tags], ['5 people','2 adults','1 child','1 adult male','1 adult female','1 girl'])
        self.assertTrue(all(t['score'] is None and t['derived'] for t in tags))
        self.assertEqual(aggregate([],policy({}))[1], [])
        changed, _ = aggregate([{'age_estimate':20,'appearance_estimate':None}], policy({'people_policy':{'adult_age':21,'age_boundary_margin':0}}))
        self.assertEqual(changed['children'], 1)

    def test_policy_validation(self):
        for bad in ([], {'adult_age':True}, {'adult_age':float('nan')}, {'adult_age':-1},
                    {'appearance_min_score':1.1}, {'unknown':1}):
            with self.subTest(bad=bad), self.assertRaises(APIError):
                policy({'people_policy':bad})

    def test_pairing_and_face_only_count_without_duplicates(self):
        bodies=[detection([0,0,100,200])]
        subjects,unmatched=association(bodies,[detection([20,10,50,45]),detection([200,0,240,40])])
        self.assertEqual(len(subjects),2)
        self.assertEqual([s['association'] for s in subjects],['unique-containment','face-only'])
        self.assertEqual(unmatched,[])

    def test_ambiguous_association_never_guesses_or_double_counts(self):
        subjects,unmatched=association([detection([0,0,100,200]),detection([0,0,110,220])], [detection([20,10,50,45])])
        self.assertEqual(len(subjects),2)
        self.assertTrue(all(s['face'] is None and s['association']=='ambiguous' for s in subjects))
        self.assertEqual(len(unmatched),1)
        subjects,unmatched=association([detection([0,0,100,200])], [detection([10,10,35,40]),detection([50,10,75,40])])
        self.assertEqual(len(subjects),1)
        self.assertEqual(len(unmatched),2)

    def test_full_evidence_round_trip_and_old_count_fix(self):
        with tempfile.TemporaryDirectory() as folder:
            state=SimpleNamespace(directory=folder)
            result={'source':'people','model':'mivolo','suggestions':[{'tag':'1 adult male','score':None}],
                    'person_count':1,'people':[{'subject_id':0,'age_estimate':33,'raw_head':[1,0,-.2]}],
                    'policy':policy({}),'components':[{'model':'detector','sha256':'test'}],
                    'detections':[detection([1,2,3,4])],'aggregation':{'people':1}}
            event=record(state,{'item_id':'image-entry-a','image':'preview'},result,5)
            for key in ('people','policy','person_count','components','detections','aggregation'):
                self.assertEqual(event[key],result[key])
            record(state,{'item_id':'image-entry-a','image':'preview'}, {'source':'objects','model':'legacy','suggestions':[],'person_count':3},5)
            events=[json.loads(x) for x in (Path(folder)/'evidence/tagging-runs.jsonl').read_text().splitlines()]
            self.assertEqual(events[0],event)
            self.assertEqual(events[1]['person_count'],3)

    def test_joytag_branch_and_manifest_unchanged(self):
        source=(ROOT/'src/atlas_companion/onnx_tags.py').read_text()
        branch=source[source.index("            labels, _ = asset(state, 'anime_labels')"):source.index("        return {'schema'")]
        self.assertEqual(hashlib.sha256(branch.encode()).hexdigest(), '3118d9d769c310c706378bd82386a9976d05f1937105db61c57e3e9a8b889243')
        manifest=json.loads((ROOT/'src/atlas_companion/tagging-models.json').read_text())
        self.assertEqual(manifest['anime']['sha256'],'f85b7130e6e549b5b0822537007b7482e8c4c8e754c8d9a5bee08e27050e1097')
        self.assertEqual(manifest['anime_labels']['sha256'],'32b1963a234af848643b2bbf47d8eff1f1c7889406810c57b980f41b2b9e01d0')

    def test_candidate_is_not_silently_enabled_in_release(self):
        with patch.dict('os.environ', {'ATLAS_TAGGING_PROFILE':''}):
            self.assertFalse(enabled())
        with patch.dict('os.environ', {'ATLAS_TAGGING_PROFILE':'rich'}):
            self.assertTrue(enabled())

    def test_missing_or_modified_candidate_assets_do_not_fall_back_silently(self):
        with tempfile.TemporaryDirectory() as folder:
            state=SimpleNamespace(directory=folder)
            with self.assertRaises(APIError) as caught:
                asset(state,'rampp')
            self.assertEqual(caught.exception.code,'TAG_MODEL_NOT_INSTALLED')
            models=Path(folder)/'tagging-models';models.mkdir();(models/'ram-plus-matmul-int8.onnx').write_bytes(b'wrong')
            with self.assertRaises(APIError) as caught:
                asset(state,'rampp')
            self.assertEqual(caught.exception.code,'TAG_MODEL_CHECKSUM')

class RetiredPeopleContract(unittest.TestCase):
    def test_distribution_has_only_photo_assets(self):
        specs=json.loads((ROOT/'src/atlas_companion/tagging-models-rich.json').read_text())
        self.assertEqual(set(specs),{'rampp','rampp_labels','rampp_thresholds'})
        self.assertEqual(sum(s['bytes'] for s in specs.values()),872879915)

    def test_people_and_faces_are_rejected_without_loading_models(self):
        from atlas_companion.rich_tags import predict
        for model in ('people','face'):
            with patch('atlas_companion.onnx_tags.decode',return_value=object()):
                with self.assertRaises(APIError) as caught:
                    predict(SimpleNamespace(directory='unused'),{'model':model})
                self.assertEqual(caught.exception.code,'TAG_MODEL_INVALID')
