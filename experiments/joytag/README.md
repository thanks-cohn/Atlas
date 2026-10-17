# Optional image-tagging experiment — JoyTag adapter

**Baseline:** `base-1.3`, commit `10f4532`. The owner published that annotated tag.
Nothing in Atlas's extension, companion startup, or default dependencies imports this experiment.
Delete this directory to remove its code; the baseline keeps working. This is a single-image
trial, not an integrated recommendation feed or an automatic tagging service.

## Windows trial

Requires an installed 64-bit Python 3.12+ with the Windows `py` launcher and Tk support.
From the Atlas checkout in CMD:

```cmd
git pull --ff-only origin main
experiments\joytag\start.cmd
```

First launch creates an isolated `.venv`, installs the pinned optional dependencies and
explicitly downloads the official ONNX model (366,116,154 bytes / about349 MiB) plus tag names.
Model cache: `%LOCALAPPDATA%\Atlas\experiments\joytag\<revision>`.
This FP32 artifact is NOT the proposed FP16/INT8 compact version. Nothing downloads on Atlas startup.
Close any other experiment instance before opening another.

Choose one local image. Review the predictions, then Copy Suggested Tags and paste into
Atlas's **Create New Tags** field. Tags are only saved in Atlas when the user submits that field.
There is no connection to the helper, no filesystem scanning, no image upload and no model-triggered
modification of bookmarks or existing tags. Copy includes all displayed suggestions, so review first.

The GUI starts a fresh CPU child per image, allows one active child per window, and kills it
when closed or after120 seconds. Default is one inference thread, batch1,448×448 input,
30MiB input file cap,20MP decoded cap,30 suggestions and0.4 threshold. Larger files/pixels
are rejected before inference. These are bounded defaults, **not a hard peak-RAM guarantee**.
A second manually opened window is a separate process; no system-wide scheduler exists yet.

## Headless measurement

```cmd
experiments\joytag\.venv\Scripts\python.exe experiments\joytag\joytag.py --image "C:\path\image.jpg" --output "C:\path\suggestions.json"
```

Model already installed: inference needs no network. Output contains provenance, threshold,
independent prediction scores, timings and peak process memory where supported (Linux/macOS;
Windows field currently null). Scores are suggestions, not calibrated truth. No model code
is downloaded/executed: pinned ONNX and tag files have hardcoded SHA-256 checks; dependencies
are separately installed via pip. No pickle or trust_remote_code.

## Replacement boundary

`joytag.py` owns CLI/GUI and calls the adapter's `download(directory)`, `cache_dir()` and
`predict(image,directory,threshold,top)`. `joytag_provider.py` alone owns the model revision,
checksums, preprocessing, inference and label vocabulary. A successor adapter can replace it
while returning the same `atlas.tag-suggestions.v1` JSON:

- model and revision identify provenance;
- suggestions is a list of `{tag: string, score: number}`;
- optional telemetry describes time/device/memory;
- proposals remain separate from user-confirmed Atlas tags.

Adding a future browser bridge must preserve this boundary and ordinary manual tags. It must
not introduce privileged network/file access just to run inference. A reliable small-hardware
benchmark and user review precede automatic integration or background batches.

## Evidence

See `SMOKE_RESULT.json`. Actual official-model CPU inference ran on one user-provided pinboard
screenshot in the Linux execution container. That is runtime feasibility evidence, not broad
accuracy,4GB Windows laptop performance or GUI proof. One false-positive suggestion was visible;
no automated tag acceptance is justified. Windows Tk UI and launcher remain NOT_RUN here.

Model: https://huggingface.co/fancyfeast/joytag
Upstream architecture/preprocessing: https://github.com/fpgaminer/joytag (Apache-2.0).
Our adapter implements that documented preprocessing, including white square padding, bicubic
448 resizing, RGB normalization and sigmoid of ONNX logits. Preserve model attribution and
check the upstream license before redistribution. Large weights are never committed to this repo.
