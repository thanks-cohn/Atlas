"""Tagging telemetry is automatic, append-only, and does not require ML libraries."""
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from atlas_companion import tagging
from atlas_companion.security import APIError


class TaggingMetricTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.state = SimpleNamespace(directory=Path(self.directory.name))

    def test_success_and_failure_records_are_separate(self):
        with patch.object(tagging, "_run_model", return_value={
            "model": "test-object-v1",
            "source": "objects",
            "suggestions": [{"tag": "cat", "score": 0.9}, {"tag": "dog", "score": 0.8}]
        }):
            tagging.run(self.state, {"model": "objects"})
        with patch.object(tagging, "_run_model", side_effect=APIError("TAG_MODEL_NOT_INSTALLED", "Missing", 409)):
            with self.assertRaises(APIError):
                tagging.run(self.state, {"model": "face"})
        data = tagging.metrics(self.state, limit=10)
        self.assertEqual(len(data["events"]), 2)
        self.assertEqual([x["tag_count"] for x in data["events"]], [2, 0])
        self.assertEqual([x["success"] for x in data["events"]], [True, False])
        self.assertEqual(data["events"][1]["error_code"], "TAG_MODEL_NOT_INSTALLED")
        self.assertTrue(all(isinstance(x["duration_ms"], (int, float)) for x in data["events"]))
        self.assertNotIn("cat", self.state.directory.joinpath("evidence/tagging-metrics.jsonl").read_text())

    def test_missing_and_limit(self):
        self.assertEqual(tagging.metrics(self.state)["events"], [])
        for invalid in (0, -1, 501, "20", True):
            with self.assertRaises(APIError):
                tagging.metrics(self.state, invalid)

    def test_empty_predictions_are_success(self):
        with patch.object(tagging, "_run_model", return_value={
            "model": "test-face-v1", "source": "face", "suggestions": []
        }):
            tagging.run(self.state, {"model": "face"})
        self.assertEqual(tagging.metrics(self.state)["events"][0]["tag_count"], 0)
        self.assertEqual(tagging.metrics(self.state)["summary"][0]["successes"], 1)


if __name__ == "__main__":
    unittest.main()
