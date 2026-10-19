# Atlas rich tagging — cold-agent handoff

Snapshot: 2026-10-19 UTC / 2026-10-18 America/Chicago. Owner requested this explicit
checkpoint before ending the session. Continue implementation; do not restart
with another proposal. This handoff is self-contained with repository evidence.

## Continuation checkpoint — current

The session resumed on this branch. Commit `17bff8b` fixes the Windows
supervisor/browser credential race found after every installed photo test passed.
Commit `68f2498` adds bounded secret-free supervisor diagnostics and retains reports
on failed qualification runs. Hosted Ubuntu run `39196142514` and complete Windows
run `39196142502` passed at `68f249806a538208040e79f3dc92e41f4d7a0626`.

[Download tested candidate](https://github.com/thanks-cohn/Atlas/actions/runs/39196142502/artifacts/12162317075)
(1,275,760,156-byte archive; Actions retention until 2026-11-02 UTC).
Install/rollback: [Windows trial](../docs/implementation/RICH_TAGGING_WINDOWS_TRIAL.md).
Durable exact outputs/receipt: [Windows evidence](../docs/evidence/rich-tagging-windows-qualification-2026-10-19.json).
Executable SHA-256: `c662f7c2c5338d3b61354c88c228f9f7b4f84b35bacfa5a780727df50b219543`.

All 18 installed photo requests passed; five count targets matched and JoyTag
tag/score parity passed. This runner produced 76 Things tags versus the original
source benchmark's 74 (legacy 13). Quantized outputs can vary with CPU; richer
yield is not proof of precision. The candidate passed native/filesystem/recovery/
upgrade/disable/uninstall and frozen/Tk management checks without Python on PATH.

Do not erase prior failure provenance: `39195395053` exceeded the 40-second
supervisor deadline; the instrumented run passed but did not establish why that
previous timeout occurred. Extended recovery soak remains open. Default remains
legacy; actual Chrome/owner-hardware acceptance, broader labeled accuracy and
compatible detector-distribution terms remain promotion gates. The original
checkpoint below is historical evidence, not the latest Windows status.

## Checkout and first action

Repository: https://github.com/thanks-cohn/Atlas
Branch: `implement/rich-photo-tagging` (NOT main).
Initial implementation commit: `36182d76570b3b9efb1ea360a478e5606e9827db`.
Rollback baseline: `e9eb6fdccbd300aeb08577789b55c2023939641c`.
Existing `working-AI` tag was verified present and was not moved.

1. Fetch and check out the latest branch; this handoff is in the follow-up commit.
2. Read `docs/forever-works/RICH_TAGGING_IMPLEMENTATION.md` and
   `codex/RICH_TAGGING_HANDOFF_STATE.json`.
3. Check the LATEST run of `.github/workflows/rich-tagging-candidate.yml` on this
   branch. Original run: https://github.com/thanks-cohn/Atlas/actions/runs/39181393607
   (job `117834710380`). It was still running model/export preparation at handoff.
   The follow-up commit adds real-photo Windows testing and triggers another run;
   inspect the newest commit/run, not just the original run.
4. Diagnose actual Windows results, preserve logs and artifact receipts, and fix
   reproducibility/packaging failures without weakening pinned hashes or parity
   checks. No Windows success or downloadable replacement is claimed yet.

## What is actually implemented

- `src/atlas_companion/rich_tags.py`: RAM++ multi-label inference, 4,585 original
  logits/scores/thresholds, all qualified predictions without a top-k cap.
- `people_tags.py`: person/face detection, conservative unique containment,
  face-only/body-only/ambiguous handling, per-person MiVOLO raw predictions,
  configurable adult threshold/boundary abstention/appearance confidence, and
  count tags derived from structured records. Unknown attributes stay unknown.
- `onnx_tags.py`: dispatch non-JoyTag jobs into the rich adapter only when enabled.
  The JoyTag branch itself is byte-for-byte preserved and fingerprint-tested.
- `tag_provenance.py`: append-only structured people/detection/count/component/
  policy/full-prediction evidence; fixes omission of legacy person counts.
  Existing history and human data are not rewritten.
- `extension/pinboard-generation.js`: companion-advertised Things/People split,
  one People job even when Faces is selected, old-helper compatibility, stored
  `people` source. Existing UI, cards and optional Anime activation remain intact.
- `scripts/prepare_rich_tagging_models.py`: hash-verified build-time inputs,
  deterministic exports with strict output hashes and MiVOLO numerical parity.
- `scripts/build_windows_companion.py --rich-tagging`: same small authenticated
  helper and separate ONNX engine/cache; no Python installation for users.
  Normal default build/profile/model manifest remain legacy rollback.
- `scripts/benchmark_rich_tagging.py`, `scripts/smoke_rich_tagging_http.py`, new
  Python/JS regressions, pinned manifests, notices/licenses and implementation docs.

## Checkpoints and engineering discoveries

RAM++ source export: `CannotFindObject/RAM_ONNX` at
`6c4ca81fb841e359c043c1e8f92f62bf5c3b8c18`.
Atlas converts only MatMul to INT8 with ORT 1.20.1; final 872,815,995 bytes,
SHA256 `7b15cd2386af5495dbbf755ea2ed75959541e95170582d7637e8ce1a9f0b2aa3`.
The advertised third-party all-operator INT8 export FAILED loading due to
unsupported ConvInteger; do not substitute it. FP32 worked but peaked ~3.1 GB.

MiVOLO v2: `iitolstykh/mivolo_v2` at
`53393526c220e34cdd7b722b36d22b6f9e5f4241`; architecture repository commit
`37475e3f8818b5f22448003feec3e64b01bfb188`.
Atlas's fixed-batch ONNX: 115,288,349 bytes,
SHA256 `a8c405e7a89cb21d4574ebf17a6979c895e32f02dbd6fd280cdc5922cb2d4ccb`.
Stock torch exporter failed col2im; build-only custom symbolic constructs the
ONNX shape tensor. Three eager/ONNX head parity errors <0.000218 passed.

Detector: `iitolstykh/YOLO-Face-Person-Detector` at
`b3d071aedccd46a3b2d4b40609da6880a815f395`; ONNX 272,743,046 bytes,
SHA256 `d0c8c91a9d1d4418977f4f5af3e5e5022d9fd3e08f0de4bdac7dca2ad9bbacd8`.
Class order is person=0, face=1; volatile export metadata is removed.
MiVOLO and RAM++ declare Apache-2.0; this detector is AGPL-3.0, so proprietary
shipping rights remain unresolved. Never call the whole pipeline Apache-only.

Exact weights, labels and thresholds are pinned in `tagging-models-rich.json`.
Export tooling must use a SEPARATE environment: Ultralytics 8.3.0 needs NumPy<2,
whereas the normal ONNX runtime build pins NumPy 2.2.6. The workflow creates
`build/tagging-export-env`, prepares model files there, then builds with the
normal environment. Outputs reproduced locally with NumPy 2.2.6 AND 1.26.4.
Torch/Ultralytics/timm are build dependencies only, not inference dependencies.

## Executed proof

Full evidence: `docs/evidence/rich-tagging-benchmark-2026-10-19.json`.
Six real photos: living-room dog, market, bus street, two coaches, astronaut,
cat close-up. Qualified Things tags: old 13 total, RAM++ 74 total. New counts match
five manually reviewed count targets: 0,4,2,1,0. Market is not count-annotated.
JoyTag suggestions AND scores match exactly between profiles for all six photos.
RAM++ ~3.95-4.18s and ~1.50-1.63 GiB peak; People ~3.45-7.93s and ~.61 GiB peak
on an AMD EPYC host. These are not laptop promises or general accuracy metrics.

Passed locally: 23 targeted Python tagging/provenance/process/bundle tests;
rich/legacy generation JS tests; pinboard, image-entry/recovery, tag editor,
blank-board, preview sections/connections and 21 broker contract checks;
extension packaging; whitespace/compilation checks.
Actual authenticated source HTTP smoke passed all three models, unpaired denial,
structured durable evidence and core isolation from NumPy/OpenCV/ORT.

Local full check: 168 tests, 3 failures + 3 errors + 33 skips, in native startup/
supervisor paths. Untouched baseline reproduced exactly those six failures in
15 native/supervisor tests. This is a local environment issue, not a passing suite.
**Hosted Ubuntu CI passed** at initial implementation commit:
https://github.com/thanks-cohn/Atlas/actions/runs/39181393688
168 tests, OK (33 skipped), 22 linked canonical records, all JS/package/CLI/native
workflow steps successful. This is distinct from Windows qualification.

## Latest follow-up changes and unverified work

Follow-up extends `scripts/smoke_windows_companion.py` with explicit
`--tagging-fixtures docs/evidence/rich-tagging-benchmark-2026-10-19.json`.
It downloads only fixed/hash-verified public photos, sends all six photos to all
three models through the INSTALLED Windows EXE's authenticated HTTP service while
original download engine/model folders are temporarily unavailable and PATH has
no Python. It checks five people targets, RAM++ output contract and useful-yield
floor, and JoyTag tag/score parity against the measured source baseline; writes
`dist/windows/PHOTO_BENCHMARK.json`. Workflow now invokes this extended smoke and
checks PowerShell exit codes after each external test command.
These latest Windows-only changes were syntax/whitespace checked, NOT executed
on Windows in this session. Inspect their new CI run before trusting them.

## How to resume from source

Install normal deps from `packaging/requirements-build.txt`. For exporters create
a separate venv and install `packaging/requirements-tagging-export.txt`.
Run exporter-env Python `scripts/prepare_rich_tagging_models.py STATE/tagging-models`
and normal Python `scripts/prepare_tagging_models.py STATE/tagging-models`.
For source-only explicit testing set `ATLAS_TAGGING_PROFILE=rich`; frozen builds
ignore that env override and read their embedded profile. Request model `objects`
for RAM++ or `people` for the structured pipeline at existing `/v1/tag-image`.
People policy defaults: adult_age=18, boundary margin=4, appearance score=.8.
Thus ages 14-21 abstain under the default; this margin is not a confidence interval.

Run:
`PYTHONPATH=src python -m unittest discover -s tests -p 'test_*tag*.py' -v`
`node scripts/test_pinboard_generation.mjs`
`python scripts/check_project.py`
`python scripts/smoke_rich_tagging_http.py --models STATE/tagging-models --photo BUS_PHOTO`
For benchmarks create fixture JSON list with path,id,url,expected_people as
accepted by `scripts/benchmark_rich_tagging.py`; output is a reusable evidence JSON.

## What remains before promotion

Do not merely flip `tagging-profile.json`. Default remains legacy deliberately.
Finish actual Windows export/build/installed photo tests and inspect artifacts;
exercise real Chrome Generate Tags/Settings; test children, crowded/occluded/dark
scenes with annotations; measure age/appearance errors on labeled data; accept
memory on target hardware; resolve detector distribution rights or qualify a
compatible alternative. RAM++ has false/contextual tags (e.g. referee in coaches
photo); richness is not a precision guarantee. People classification caps 64
subjects but retains unknown records beyond the cap; no identities/relationships.
Raw evidence growth and JSONL/current projection memory still need scale work.
No marketplace, dynamic model install, trained recommendation engine, or new R2
implementation is claimed. Do not alter JoyTag to fix general-photo deficiencies.

## Scratch is optional and disposable

Checkout during this run: `/workspace/scratch/88f67041d110/Atlas`.
Temporary models/photos: `/tmp/atlas-model-research`; prepared cache/evidence:
`/tmp/atlas-rich-state`; re-export checks: `/tmp/atlas-rich-reproduced` and
`/tmp/atlas-rich-numpy126`; baseline checkout `/tmp/atlas-tagging-baseline`.
These may disappear. All enduring source, recipes, pins, measured outputs and this
handoff are committed to the branch; no private photos, credentials or model
binaries were added to Git. Raw git push lacked credentials, so remote commits
were created through the authenticated GitHub connector; local/remote tree hashes
were verified equal. Continue with normal Git auth or that connector as available.
