# Explicit local ONNX tagging — v1

Owner requirements: keep the image-first two-row preview controls; run only on
Generate tags; expose Anime only after JoyTag activation in Board Settings;
preserve original model predictions separately from human tags; show duplicate
labels once. No dashboard, face boxes, identity recognition or automatic tagging.

## Execution and replacement boundaries

`extension/pinboard-generation.js` prepares a bounded raster preview and submits
one selected model at a time to the existing authenticated `/v1/tag-image` route.
Things and People share one YOLO11n pass; display choices select non-person and
person labels independently. Faces uses the OpenCV MobileFaceNet expression
classifier with the YuNet ONNX landmark localizer. Anime uses JoyTag ONNX.
`onnx_tags.py` owns preprocessing, output contracts and postprocessing. Replace
an adapter plus its pinned manifest entry, not the UI or evidence format.

No PyTorch, Ultralytics Python runtime, install-time inference, browser-scroll
inference or model download in the companion request path. ONNX Runtime uses CPU,
one intra/inter-op thread, sequential execution and no CPU memory arena. OpenCV
uses one thread; the companion rejects overlapping inference with TAG_BUSY.
Sessions are disposed after each model. This bounds concurrency, not a guaranteed
RAM ceiling or execution deadline. Browser requests time out at 120 seconds;
requests are not automatically retried, and a timed-out native job can finish.

`tagging-models.json` pins revisions, sizes and SHA-256 for 381,916,675 bytes of
assets (~382 MB decimal, 364 MiB). Includes a third-party YOLO11n ONNX export with
fixed 480x640 input, official OpenCV FER/YuNet and official JoyTag. Main runtime
reads input dimensions and checks output shape. Image payload <=1.5 MB and decoded
image <=12MP. Model files are validated before use. Build downloader validates
length and hash before publishing partial downloads. Weights stay outside Git.

## Evidence versus presentation

Companion `evidence/tagging-runs.jsonl` preserves original predictions, each run,
model revision/hash, recipe, encoded image payload hash, resource identity,
duration and display choices. Human tag records are untouched. Current JSON
projects latest source results for the current image payload, retaining separate
contributors behind one normalized candidate label. Original history survives
replacement. `presentation: candidate` is not browser-rendering proof. Browser
storage retains current per-source suggestions for preview and tooltips; hiding
Anime never destroys companion history. Human curation/rejection deltas and saved
cross-source display profiles remain future work.

## Installation and verification

Windows build prepares all model assets and bundles dependencies plus weights
inside the helper, so normal Windows users need no Python installation or manual
model placement. Anime remains disabled in UI until Settings activation even
though this development bundle includes its weights. The one-file executable is
larger than the raw model assets; normal and debug downloads are separate artifacts so users do not download
duplicate executables and a redundant nested archive. Existing installed helpers require an upgrade; pulling
extension source alone does not replace the installed helper.

Source development: install dependencies from `packaging/requirements-build.txt`,
then `python scripts/prepare_tagging_models.py PATH_TO_STATE/tagging-models`.
The private state directory must be the actual helper state, not an arbitrary
browser profile. Model locations are fixed: private state first, packaged bundle
second. Model paths and downloads are not accepted from HTTP callers.

Real Linux CPU smoke ran all three adapters: bus image yielded bus + person
(3 detected people); OpenCV sample face yielded neutral; JoyTag returned 13 tags.
Observed single-run durations including adapter loading were approximately 0.21s,
0.04s, 2.64s respectively on this host, not performance promises. No image fixture
or downloaded model is committed. Browser interactions have DOM/API tests, not
actual Chrome visual acceptance. Windows CI additionally executes all three real
models through `atlas-companion.exe --tagging-smoke` on a synthetic white image,
then existing native/UI smoke tests. Check CI outcome before claiming a usable
Windows download. Packaging terms and upstream notices are under `packaging/`.

## 2026-10-19 implementation checkpoint

The legacy behavior above remains the default rollback profile. Actual RAM++ and
MiVOLO v2 plus a face/person detector now exist as an isolated rich candidate at
the same authenticated API boundary. Read [Rich tagging implementation](RICH_TAGGING_IMPLEMENTATION.md)
for exact checkpoints, executable adapters, measured outputs, source/Windows
verification distinctions, provenance additions and remaining promotion gates.
This is no longer proposal-only work, and is not yet a promoted production replacement.
