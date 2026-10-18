# Lightweight helper and sequential tagging process — 0.1.68

## Owner purpose and actual failure

Anyone should be able to use ordinary Atlas on a constrained machine; optional
local tagging must not turn setup, file access or recovery into a heavy AI task.
The owner reported extreme startup delay and system-wide lag from several launches
of the 443 MB onefile helper. Windows CI had passed functional checks, but did not
prove acceptable performance on the owner's laptop. The packaging bundled weights
and scientific libraries into every helper/native executable and repeated their
extraction even when no tagging was requested. This supersedes the deployment
layout in ONNX_TAGGING_INTEGRATION.md, not its inference or evidence contracts.

Fixed: pairing/grants, file APIs, compact preview UI, explicit inference only,
Settings-gated Anime, preserved model outputs versus human tags, deduplicated
presentation, no system Python requirement. Constrained: CPU-first, one image/model
job at a time, no unattended inference/download, fixed verified engine paths.
Fluid: process topology, packaging and future model adapters.

## Replacement

- Core helper/debug are small onefile executables, built with all AI libraries and
  weights excluded; build fails above 30 MiB or when excluded AI assets appear in
  the actual archive. Native service and normal setup do not import NumPy/Pillow,
  OpenCV or ONNX Runtime.
- `tagging-engine/` is a reusable PyInstaller **onedir** runtime. It neither
  self-extracts nor runs on ordinary startup. The core embeds a generated SHA-256
  manifest of every engine file. Installer and execution verify that tree,
  reject extra/linked/modified files and never accept engine paths from HTTP.
- `tagging-models/` carries pinned ONNX assets once in the download. The approved
  installer copies them into private state once; unchanged valid files are reused
  on repair. Modified cache files are refused rather than silently overwritten.
  Engine versions live in an installer-owned hash directory and are reused for
  identical manifest content. Previous engine versions are retained; no automatic
  deletion of user or old installation data is introduced.
- Each explicit model request starts one engine process; original predictions
  return through bounded JSON. The process exits before results are returned, so
  memory is reclaimed before the next model starts. The native lock rejects
  overlapping jobs, CPU inference/BLAS use one thread, and a 105-second timeout
  terminates/reaps the owned worker. ONNX native internal operations do not imply
  running several selected models at once. Things/People still share one pass.
- Model jobs report peak working-set bytes and, on Windows, peak commit bytes;
  these accompany original run evidence. About 700 MB is an estimate to test,
  not a universal ceiling or minimum. Low available RAM may still make a selected
  model unsuitable; core-only use remains available.
- GUI launch mutex is acquired before readiness polling. A repeated launch exits
  and attempts to focus only a same-user, same-executable existing setup window.
  Existing service/supervisor/desktop ownership locks are preserved.

## Trial and future scope

Full download: extract **the entire bundle** together, then run
`atlas-companion.exe --desktop --advanced` and approve same-ID repair/upgrade.
Copying just the executable does not install the separate engine/models. Once
installed, download folders are not runtime dependencies. Debug.exe is included
again because it is small. Core-only artifact supports bookmark/files/recovery
without installing the AI engine; tagging then gives a missing-engine message.

This trial still bundles all model weights, including Anime, for a reproducible
local test; Anime remains UI-opt-in. A separate opt-in Anime download and a model
chooser are future work, not implemented by this packaging change. Core/model
updates do not require system Python, pip or manual package installation.

Verification gates: negative manifest/path/link/modification tests, real child
exit/timeout tests, archive size/content inspection, real frozen sequential
inference (assert no AI imports in parent), real duplicate GUI launch/focus,
installed inference with original bundle folders hidden, cache reuse on repair,
and existing native framing/filesystem/suspend/supervisor recovery tests. Run
source tests and Windows CI; record outcomes in STATUS_AND_CONTINUATION.md.
Owner laptop acceptance and broad low-memory hardware coverage remain separate.
