# Proposal: Tag Provenance, Run Snapshots and Curated State

Status: PROPOSED — documentation only, 2026-10-17.
Owner authorizes this proposal, not implementation in this change. Baseline: `base-1.3`
(commit `10f4532b0b34323a90d0a80f25ac1f8efd790a48`).

## Purpose and owner direction

Atlas should preserve what people mean and choose, alongside what replaceable models predict.
Tags from the user and tags from each model/run must remain distinguishable from the beginning.
An original run output is a snapshot; later human pruning, additions and modifications form
attributed changes; later models produce their own outputs and deltas. The current view must
be understandable and reconstructible without erasing those origins.

Owner directions captured in this conversation:

- Generate tags only on an explicit request, never because a user scrolls, opens an image,
  installs the extension or starts the browser.
- Offer Generate Suggested Tags… for a bookmark, bookmark folder or pinboard.
- Requested jobs should run through a companion independently of the browser once handed off.
- Models remain optional, modular, removable and replaceable. Normal manual organization works
  when inference is unavailable; base1.3 remains the known pre-experiment checkpoint.
- Distinguish user-created assignments from multiple models, versions and batch runs. Capture
  process details, time totals/per image, counts, original outputs, current state and deltas.
- Support bounded jobs (100 images was an example) and potentially30–100 tags per image over
  multiple runs. These are intended capabilities, not benchmark results or mandatory defaults.
- Preserve curation as potential future evidence for recommendations, taste learning and model
  training. More labels alone do not prove better understanding or recommendation quality.
- Inspect and explain failures; do not hide broken controls or accumulate unexplained code.
  Forever Works documentation must distinguish proposal, implemented source and actual proof.

The structures below are an engineering proposal implementing those purposes. They are not
new normative requirements of the independently maintained Forever Works standard.

## Current evidence and gaps

Ordinary Atlas catalog tags are currently resource-to-string lists. They cannot represent this
history. Existing data must not be relabeled with invented authorship. Imported old assignments
should be `legacy_unknown` unless independently attributable.

Bookmark covers currently live in Chrome profile storage as data or URL references, rather
than companion-managed individual image originals. The optional JoyTag experiment reads one
explicit local file and returns model provenance plus suggestions. Copy/paste into ordinary
Atlas tags loses the model origin; this remains a manual trial, not the proposed integration.

Actual container inference is recorded in `experiments/joytag/SMOKE_RESULT.json`. The owner also
reported successful Windows output after about24 seconds for one image. That is an owner-reported
end-to-end observation, not independently measured per-stage time. Accuracy, warm-session
performance and constrained-machine memory are not established. No persistent browser-independent
AI queue, provenance database migration, model selector, personalized recommender or training
export has been implemented by this proposal.

## Preserve these distinctions

| Concept | Identity and meaning |
| --- | --- |
| Resource | Bookmark/site/card to which an image or annotation is associated |
| Image version | Exact image bytes, identified by content hash plus stable asset ID |
| Placement | Resource/Chrome bookmark ID or board position referring to that image |
| Tag definition | Stable ID, vocabulary namespace and display label |
| Assignment | One actor's claim that a tag describes a specific target |
| Review | A person's decision about an assignment, not its original producer |
| Run | One reproducible request using a pinned model and processing recipe |
| Attempt | One execution attempt on one image within a run |
| View | A policy/version and event cursor determining what is currently displayed |

An image replacement creates a new image version. Old predictions never silently become
predictions about the new bytes. If only a reduced cover is available, identify and hash that
cover; do not claim it is the original. Record the actual inference input transform as well.

Identical bytes can be reused across many bookmark placements, avoiding repeat inference.
Exact URL dedup is a separate rule: it does not establish identical image content. Dynamic
remote image URLs need fetched-byte identity before results can safely be reused.

A model's vocabulary ID and raw label must survive export. Similar labels from different
vocabularies are not automatically equivalent. Optional aliases and normalization mappings
are separately versioned; displaying related labels together must not destroy raw evidence.

## States and layers

1. **Original run snapshot.** Immutable successful per-image predictions from a model/version,
   recipe and attempt. A run may be complete, partial or failed; a partial snapshot states its
   coverage rather than implying every image was processed.
2. **Independent model layers.** Each subsequent model/run adds its own snapshot. A newer model
   does not own the user's tags and cannot overwrite another model's evidence.
3. **Human curation layer.** Original user assignments, acceptance, rejection, correction,
   display suppression, restoration and explicit preference feedback.
4. **Current effective state.** A rebuildable projection of the selected model layers, human
   decisions and a named policy revision at an event cursor. It is an interpretation, not a
   replacement for raw outputs.
5. **Named checkpoint.** A saved view definition and cursor, optionally with a materialized
   snapshot for fast restore/export. A human can compare or branch curation from it.
6. **Run comparison.** A derived report of appeared/absent/shared tags, changed scores and changed
   coverage. It does not mutate either run or imply missing tags are false.

Assignment origin is independent of review status. A model assignment accepted by a person
remains model-origin with a linked human approval. A person may additionally create their own
assignment for the same tag; the displayed chip can group sources while retaining both records.

Review states: unreviewed, accepted, rejected. Presentation state: visible/suppressed. A correction
links the original assignment to its replacement; it does not edit the original prediction.
Acceptance of a descriptive tag does not mean liking the image or subject. Favorites, exclusions,
comparisons and design intent are explicit, separate preference signals.

## Recommended persisted records

SQLite is proposed for transactional working storage, with small indexed tables and portable
exports. Avoid one huge JSON blob rewritten on every tag or image. Start with a narrow schema;
do not build a generalized distributed event platform before this vertical slice works.

| Record | Essential fields |
| --- | --- |
| Model manifest | model ID/revision, weights checksum, vocabulary checksum, adapter ID/version, source/license |
| Recipe | recipe ID/hash, preprocessing, precision, thresholds, output cap, runtime/version and configuration |
| Job request | request ID, requester, explicit scope, selection time, frozen image list, missing-image policy |
| Run manifest | run ID, job/model/recipe references, lifecycle, start/end times, counts, timing/memory summaries |
| Image attempt | attempt ID, run ID, image version/hash, status, stage timings, error code, result checksum |
| Prediction assignment | assignment ID, target image/resource scope, raw tag ID/label, actor=model, run/attempt, score |
| Human event | event ID, actor, target/referenced assignment, action, prior revision, timestamp, reason if supplied |
| View/checkpoint | view ID, policy revision, selected sources, cursor, optional snapshot checksum |

Model revision alone is insufficient: actual weights, adapter and preprocessing influence outputs.
Record model load, decode/preprocess, inference, result write and elapsed wall time separately.
Use monotonic durations for measurements and UTC timestamps for history. Identify whether memory
is peak process memory, RSS or GPU allocation; unknown values remain null, never zero.

Counts distinguish requested images, distinct images, skipped/reused/failed/canceled attempts,
raw retained suggestions, unique labels, accepted assignments and effective displayed tags.
Specify whether top-k/threshold filtering occurred. Store all vocabulary scores only when explicitly
configured; otherwise record output coverage/truncation so unreported labels are not treated as negatives.
Model scores are not automatically calibrated probabilities, nor comparable across models or recipes.

## Human and model deltas

Human events include `assign`, `remove_own_assignment`, `accept`, `reject`, `correct`, `suppress`,
`restore` and explicit preference events. Stable assignment references prevent one removal from
accidentally deleting another person's or model's independent claim. A removed user tag is not
in itself a rejection of that tag as an image description.

Model deltas are comparisons between immutable snapshots, not authority to modify curation:
`predicted_now`, `not_reported_now`, `score_changed`, `coverage_changed`, `input_changed`.
A missing prediction is neither an explicit contradiction nor a human rejection. Failed images,
canceled work, top-k truncation and threshold omission must remain distinguishable.

A rejection has an explicit scope. Default proposal: suppress that particular assignment/run;
optionally let the user reject the tag for this image version across future model runs. Such a
persistent human veto cannot be cleared by a later model. New image versions do not automatically
inherit semantic rejection unless the user selects that policy. Other model evidence remains
inspectable even when suppressed from the effective view.

For edits, preserve the old label/raw model assignment and record the user's replacement as a
new human assignment linked by `corrects`. Renaming a tag definition is a separate vocabulary
operation, not an implicit edit of every historical model output.

Example:

- Run A suggests `blue_sky` and `city` for image version X.
- User accepts `blue_sky`, rejects A's `city`, and creates `quiet places`.
- Run B suggests `city` and `architecture`; both remain independent B evidence.
- Effective view preserves `quiet places` and approved `blue_sky`; `city` visibility follows
  the recorded rejection scope, not an undocumented last-writer-wins rule.
- If the user requests a checkpoint, export the chosen view alongside raw A/B provenance.

## Job handoff and bounded execution

The button opens scope/limit confirmation; only explicit Start creates a job. A folder request
must define recursive versus direct children and freeze the selected members. A pinboard request
must distinguish whole board from current filtered view. Never silently expand either scope.

The browser resolves profile-only covers and hands durable inputs/references to companion storage.
A job is acknowledged as ready only after its selection and required bytes are committed. Closing
Chrome during an incomplete handoff must leave an explicit incomplete job, not a misleading promise
that all images can be processed. Missing remote images need an explicit fetch/skip policy; model
inference does not acquire arbitrary network or filesystem authority.

Proposed lifecycle: requested → preparing → queued → running → completed/partial/failed.
Pause and cancel are explicit requests with durable acknowledged states. Crash interruption is
recorded; resume policy is visible. Closing Chrome does not cancel a fully handed-off job. Computer
shutdown/suspend still prevents execution; persistent state permits later recovery, not execution
while powered off. Whether jobs resume automatically after OS restart remains an owner-facing policy.

A conservative first implementation uses one active inference worker, one image at a time and a
bounded selected set; pause/cancel checkpoints occur per image, with termination for a stuck worker.
Persist a result atomically before advancing its receipt. Idempotency uses run/image/attempt identity
and exact input/model/recipe references. Resume cannot double-apply tags because raw predictions do
not directly mutate human assignments. Reuse of cached predictions retains original provenance and
records reuse rather than pretending inference ran again.

Batch100 and accumulated30–100 tags are examples to test, not load guarantees. Explicit worker/thread,
queue, disk and output caps need measured defaults. Model residency across a batch could avoid repeated
load cost, but idle unloading, memory monitoring, responsiveness and actual Windows proof are gates.
An out-of-process worker limits crash propagation; it is not a substitute for enforcing memory limits.

## Current view, UI and precedence

Default proposal: human-created and explicitly approved tags form the trusted view; unreviewed model
suggestions are visibly separate. Allow Your Tags / Suggested Tags / Both and per-model/run inspection.
If identical tags are displayed once, show their source counts and review details on inspection.
Several models agreeing are not several human endorsements.

A saved versioned policy defines precedence, suppression and active model runs. No hidden change to
that policy during an upgrade. User curation takes precedence in their view; model reruns cannot erase
it. Conflicting human edits from separate clients require expected-revision checks and explicit
resolution, not silent overwrite. Semantic projection rules stay separate from card layout/templates.

Keep successful editing in place. Retain scroll, picker state and unrelated image nodes; expose
loading/failure and actionable recovery. These requirements extend the existing pinboard lessons,
not a justification to implement speculative UI before persistence is reliable.

## Portable exports and reconstruction

Suggested export bundle:

- `manifest.json`: format/schema version, inventory, checksums, completeness, export cursor and view policy.
- `models/<model-id>.json` and `recipes/<recipe-id>.json`.
- `runs/<run-id>/run.json` plus `results.jsonl`, one image attempt/result per line.
- `events/decisions.jsonl` and optional `checkpoints/<checkpoint-id>.json`.
- `assets.jsonl`: stable image identities and placement links; image bytes are included only by chosen export policy.

Do not embed tokens, credentials, absolute private paths or machine-dependent locations by default.
Each file is versioned, readable and streamable. Unknown required versions fail clearly; optional
unknown fields can be preserved. Reconstructing effective state requires baseline, events, referenced
model/vocabulary manifests and projection-policy version, not proprietary agent memory.

Snapshots plus ordered events enable bounded replay. Sequence cursors and transaction order determine
replay; wall-clock ordering alone is insufficient. Undo is a compensating human event, not destruction
of the original. Checkpoint compaction requires verified equivalent reconstruction and referenced
history retention according to policy. This is intended to grow by versioned extensions, not a claim
of literally infinite storage or guaranteed perpetual compatibility.

Immutable evidence means ordinary edits do not silently rewrite it. It does NOT prohibit explicit
privacy deletion. A user can request irreversible purge, which must explain lost reconstruction
capabilities and remove the chosen evidence/assets from owned stores and exports under their control.
No promise to recall already distributed copies. History retention and disk limits require policy;
never accumulate unlimited full snapshots by default.

## Future training and recommendations

Keep raw predictions, factual corrections, presentation choices and taste feedback separable.
A training export records dataset version, selected image versions, models/runs, labeling policy,
review states and known missing coverage. Exclude unreviewed predictions by default from human-ground-
truth datasets, and never treat every unmentioned label as a negative. Deduplicate the same image
across placements and prevent train/test leakage by image identity. Exports require explicit user
selection; private collections are not silently uploaded for training.

Model tags can aid candidate retrieval and ranking; accepted/rejected combinations and explicit
preferences may support personalization. This does not establish that one user's30–100 tags per image
are sufficient to fine-tune a useful model, nor that accurate descriptive tags reveal liking. Evaluate
on held-out human decisions and compare against a simple tag baseline before adding model complexity.

## Proposed implementation order and acceptance gates

1. Define versioned identity/provenance records and deterministic projection examples. Test replay,
   rejection scope, correction, multi-model agreement, changed images and unknown legacy provenance.
2. Add transactional SQLite migration with backup/rollback and legacy tag compatibility. Existing
   manual tags remain usable; no invented authors or retroactive machine provenance.
3. Add immutable run/results import to the isolated experiment, explicitly preserving provenance.
   Reject mismatched hashes/schema without changing curated state.
4. Add companion-managed image handoff and durable explicit job request. Security-negative tests
   precede new file/network access; closing Chrome after acknowledgment must not lose work.
5. Add one-worker processing, pause/cancel/resume, per-stage telemetry and bounded resources. Prove
   no duplicate receipts, no human-tag overwrite and correct partial failure on real Windows.
6. Add source-aware review UI, in-place updates and portable export/reimport equivalence.
7. Only then test lightweight ranking, model replacement, quantization or training export.

This document authorizes none of these implementation steps by itself. Exact defaults, bundled model
installation path, browser versus companion inference, selector design, cache lifecycle, global
scheduling and multi-device merge remain future implementation decisions. Preserve the purpose and
replacement obligations even if storage engine, runtime, model or UI framework changes.
