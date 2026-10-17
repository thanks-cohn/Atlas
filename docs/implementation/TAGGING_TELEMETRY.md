# Automatic tagging telemetry

Every call to the companion's `/v1/tag-image` model endpoint automatically logs **one measurement per model attempt**. No switch or extra button is needed, and nothing is added to the image preview.

## Storage

Private local file: `<companion state directory>/evidence/tagging-metrics.jsonl`

Each newline-delimited JSON record contains:
- schema (`atlas.tagging.metric.v1`), ISO-8601 UTC timestamp
- source (`objects` or `face`), model identifier
- wall-clock `duration_ms` including image decoding and model setup
- `tag_count` (number of distinct suggestions returned)
- `success`, `error_code` (null on success)

Failures, empty successful results and successful non-empty results all produce records. If metric writing fails, inference results are not silently changed or discarded. No raw image bytes, filenames, bookmark URLs, or tag strings are included in metrics.

## Authenticated read-only API

`GET /v1/tagging-metrics` through the **existing authenticated local companion**. It returns:

```json
{
  "ok": true,
  "schema": "atlas.tagging.metrics.v1",
  "events": [],
  "summary": []
}
```

Events contains up to the 100 latest rows by default. Summary groups the returned events by model and includes `runs`, `successes`, `failures`, `tags`, `total_duration_ms`, `average_duration_ms` and `average_tag_count`. A missing file produces empty arrays. The internal reader accepts a validated limit of 1–500; the initial HTTP route uses the default 100.

The extension background broker allows this route as authenticated read-only, so a future Info / Data panel can retrieve metrics without adding a control to the pinboard.

## Evaluation cautions

Wall-clock runtime includes first-load overhead and may vary by hardware, image dimensions and warm caches. Tag counts and speed alone are **not** measures of correctness; future benchmark data should include manually verified precision, recall, false positives and false negatives. The current file is append-only without automatic rotation. The metrics API intentionally exposes only recent bounded history, not a full export.

## Verification

Added `tests/test_tagging_metrics.py` covering successes, failures, empty tag outputs, and limits. Real checkpoint inference / Windows packaged companion and HTTP integration have **not** been run as part of this change.
