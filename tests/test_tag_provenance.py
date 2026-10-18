import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from atlas_companion.tag_provenance import project, record


class ProvenanceTests(unittest.TestCase):
    def test_duplicate_presentation_preserves_both_predictions(self):
        with tempfile.TemporaryDirectory() as folder:
            state = SimpleNamespace(directory=folder)
            body = {'item_id': 'bookmark:123', 'image': 'data:image/png;base64,AA=='}
            first = record(state, body, {'source': 'objects', 'model': 'model-a', 'suggestions': [{'tag': 'Smile', 'score': .8}]}, 12)
            second = record(state, body, {'source': 'face', 'model': 'model-b', 'suggestions': [{'tag': 'smile', 'score': .9}]}, 14)
            root = Path(folder) / 'evidence'
            lines = [json.loads(line) for line in (root / 'tagging-runs.jsonl').read_text().splitlines()]
            self.assertEqual([x['produced'][0]['tag'] for x in lines], ['Smile', 'smile'])
            item = json.loads((root / 'tagging-current.json').read_text())['items']['bookmark:123']
            self.assertEqual(len(item['presented']), 1)
            self.assertEqual({x['run_id'] for x in item['derived'][0]['contributors']}, {first['run_id'], second['run_id']})
            self.assertEqual({x['score'] for x in item['derived'][0]['contributors']}, {.8, .9})
            self.assertEqual(lines[0]['model_version'], 'unknown')
            # New empty result replaces only this source in current projection.
            record(state, body, {'source': 'objects', 'model': 'model-a', 'suggestions': []}, 5)
            current = json.loads((root / 'tagging-current.json').read_text())
            self.assertEqual(len(current['items']['bookmark:123']['derived'][0]['contributors']), 1)
            all_events = [json.loads(x) for x in (root / 'tagging-runs.jsonl').read_text().splitlines()]
            self.assertEqual(len(all_events), 3)
            self.assertEqual(project(all_events), current)
            self.assertNotIn('human', current['items']['bookmark:123']['sources'])

    def test_separate_items_and_unicode_normalization(self):
        events = [{'item_id': item, 'source': source, 'run_id': source, 'model': source,
                   'produced': [{'tag': tag, 'score': .5}]} for item, source, tag in
                  [('a', 'x', 'ＣＡＴ'), ('a', 'y', ' cat '), ('b', 'x', 'cat')]]
        result = project(events)
        self.assertEqual(len(result['items']['a']['presented']), 1)
        self.assertEqual(len(result['items']['b']['presented']), 1)
        self.assertEqual(len(result['items']['a']['derived'][0]['contributors']), 2)

    def test_image_replacement_does_not_mix_current_predictions(self):
        with tempfile.TemporaryDirectory() as folder:
            state = SimpleNamespace(directory=folder)
            for source, image in [('objects','old'),('face','old'),('objects','new')]:
                record(state, {'item_id':'a','image':image}, {'source':source,'model':source,'suggestions':[{'tag':image,'score':.5}]}, 1)
            current = json.loads((Path(folder)/'evidence/tagging-current.json').read_text())
            self.assertEqual(list(current['items']['a']['sources']), ['objects'])
            self.assertEqual(current['items']['a']['presented'][0]['tag'], 'new')
            events = [json.loads(x) for x in (Path(folder)/'evidence/tagging-runs.jsonl').read_text().splitlines()]
            self.assertEqual(project(events),current)
            self.assertEqual(len(events),3)

    def test_invalid_display_choices_do_not_append(self):
        with tempfile.TemporaryDirectory() as folder:
            with self.assertRaises(ValueError):
                record(SimpleNamespace(directory=folder), {'display_choices':[]}, {'source':'objects','model':'test'}, 1)
            self.assertFalse((Path(folder)/'evidence/tagging-runs.jsonl').exists())
