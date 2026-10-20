# Proposal — Durable Local ONNX Tagging, Performance Profiles, and R2-to-Collection Import

**Status:** Proposed future changes, **not implemented**. Owner direction 2026-10-20.
**Prerequisite:** [Backlog 007 — Tagging stalls and results disappear after leaving a card](../backlog/007-tagging-job-lifecycle-and-result-recovery.md). This is a feature proposal, not evidence that the bug is fixed.

## Product intent

Atlas should let a user point at a large collection of images—including a complete authorized Cloudflare R2 prefix/directory—create an **Atlas Collection of references** without eagerly downloading all assets, and run its **local ONNX tagging models** over these images in a durable, unattended queue. The user can browse other cards or close the Atlas UI while accepted tagging work continues and results safely attach to the correct original image. A powerful PC can opt into accelerated parallel tagging, while the existing modest-hardware default remains intact.

**Local inference is the default assumption for this proposal.** A Cloudflare Worker or cloud-hosted inference/GPU is not required. For R2 files, local processing requires authorized streaming/staging of the necessary image bytes on the user's machine, not remote model execution.

## Phase 0 — Fix the existing result-loss bug first

Backlog 007 is an existing owner-reported defect: tagging may continue after a user closes or leaves a card, yet tags are absent upon return and a retry may encounter `TAG_BUSY`. The exact root cause remains unconfirmed. Do not describe the defect as fixed until reproduced, resolved, and verified in real Chrome.

- Move accepted job identity, progress and result persistence out of card lifecycle/UI component state. Associate every job with immutable original image/Atlas Object identity and model/profile version.
- Persist intent before dispatch, checkpoint each completed model's **original independent outputs**, and atomically/idempotently attach results to the correct entry, whether or not its card remains open.
- Recover accepted jobs on card reentry, tab/browser restart and helper reconnect; distinguish queued/running/completed/failed/timed-out/cancelled; prevent duplicate jobs and wrong-card attachment.
- Preserve existing manually created tags, user X-removals, provenance, source-specific results and model independence. Avoid overwriting a good first-model result when a later model fails.
- Honor the previously recorded setting: background continuation enabled by default, optional explicit disable/cancel; cancellation must be authorized and job-specific.
- Test close card during inference, switch cards, leave for five minutes, close/reopen browser, partial model success, helper restart, timeout, duplicate clicks, source image replaced/deleted. Confirm result persistence and reappearance with *real Chrome + companion*, not just mocks.

## Phase 1 — Persistent local tagging queue

- Introduce a durable queue owned by the existing Atlas native companion or a clearly scoped persistent local process; ordinary browser Web Workers and extension service workers must not be relied on to outlive their owning context.
- Persistent item/image job manifest, queue status, incremental checkpoints, retry limits, pause/resume, cancellation, idempotent recovery, deduplication and bounded resource cleanup.
- The work can continue while the Dashboard/card/Chrome is closed **when the authorized local companion is running and machine remains powered on and awake**. Do not promise processing during sleep, shutdown or without a running process.
- Apply selected tagging models individually or as an explicitly requested sequential pipeline (e.g. optional JoyTag followed by default general object model). Preserve independent model outputs and provenance; final tag display profiles decide how to merge/present tags.
- JoyTag remains **hidden and disabled by default**, requiring explicit opt-in/approval and model activation in Settings; it must never silently become the default model for everybody.
- Update Atlas UI through polling/event updates when opened, not by binding job completion to a currently displayed card.

## Phase 2 — Local performance profiles

Add clear Settings controls without disturbing the current lightweight default:
- **Balanced (default):** current CPU/RAM responsiveness and familiar tagging behavior.
- **Fast:** cautiously increased utilization where supported.
- **Maximum performance:** opt-in aggressive CPU/GPU utilization, with overheating/memory pressure safeguards.
- **Custom:** detected and explicitly supported ONNX Runtime execution provider (CPU, GPU where available), CPU thread settings, model/session concurrency and batch size; detect unsupported providers honestly.
- Optional **increase utilization when idle** setting, subject to actual OS/device support.

Offer **sequential vs concurrent** processing: sequential is typically safer for weak hardware; concurrent models or independent sessions can improve throughput on powerful hardware, but must be benchmarked for actual throughput and RAM/VRAM use. ONNX GPU provider restrictions and model-specific compatibility must be checked, not assumed. Make performance changes reversible, show measured throughput/estimated remaining items with uncertainty and give users control over pause/limits. Avoid contention with the browser or other applications.

## Phase 3 — R2 prefix import and background enrichment

- Authorized user selects R2 prefix/directory → **Create Atlas Collection**. Recursively enumerate with pagination and save stable source references and metadata without bulk duplication.
- Keep collection membership and remote object identity separate from actual file bytes; offer manual refresh or opt-in synchronization for newly added/removed objects.
- User starts **Generate Tags** for all/selected items, choosing permitted tagging models and performance profile; create persistent queue with immutable item identities.
- Local companion retrieves authorized remote image bytes as needed, using bounded temporary cache/streaming, and disposes of cache according to a clear user policy. User-owned R2 stays private; no automatic public bucket or unexpected cloud-GPU billing.
- Tag results persist in Atlas and are recoverable independently of UI state. Repeated scans skip already tagged *unchanged* images by identity/version/fingerprint and desired model revision, not by filename alone.
- Show progress, retryable errors, throughput, and precise completed/failed counts. Handle disconnection, expired authorization, changed/deleted remote images and partial failure safely.
- Avoid claiming a Cloudflare Worker will execute local ONNX models: R2 may be a source/metadata store while ONNX runs locally.

## Delivery priority and acceptance

**Priority order:** (1) fix backlog 007 and prove persistence; (2) robust local queue and pause/resume; (3) performance profiles and benchmarking; (4) R2 prefix import/sync and large-batch tagging. These phases can have separate PRs and should not block unrelated Atlas dashboard work.

Success demonstration: start a batch of thousands, close its cards/UI, leave the awake machine processing locally, later reopen Atlas and find every completed model's tags on the correct image, with remaining/failed jobs inspectable and resumable; verify bounded memory, duplicates, user removals and correct behavior after interruption. Test with smaller batches before large library runs.

The guiding rule: **An Atlas image's tagging job and saved outputs belong to the durable object identity, not to whichever card happens to be open.**
