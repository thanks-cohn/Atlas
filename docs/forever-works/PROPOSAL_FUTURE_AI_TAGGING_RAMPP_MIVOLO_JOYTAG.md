# Atlas proposal — Future tagging models: RAM++, MiVOLO v2, optional JoyTag

**Status:** Deferred owner-directed proposal only. No model replacement, installation, UI alteration, or claim of verification in this documentation change.
**Recorded:** 2026-10-18.
**Priority:** **FIRST fix and polish interface/UX; THEN investigate and replace tagging models.**

## Decision and rationale

The owner reports that the two existing general-purpose sources (YOLO11n object detection and OpenCV facial-expression classifier) have poor practical tag yield, often roughly one tag per source/image, whereas optional JoyTag can produce roughly 15 on an illustrative image. These are user observations, not controlled benchmark results. They motivate replacement but do not by themselves prove which model is superior.

Preserve the current functioning implementation and the owner's `working-AI` baseline tag if present; verify tag/commit existence before relying on it. Do not break or remove the old adapters before replacements pass end-to-end tests.

**Target future lineup:**

- **RAM++ (Recognize Anything Plus):** new primary everyday-photo *multi-label* tagger with broad tags for objects, scenery, clothing, activities and visual attributes. Investigate an ONNX/ONNX Runtime compatible export, thresholds, performance, provenance and commercial distribution rights. Aim for many *useful* distinct tags; 30–60 per sufficiently detailed image is a quality/coverage **aspiration**, not a guarantee or existing measurement. Never pad outputs with fabricated synonyms or flood the user with low-quality labels.
- **MiVOLO v2:** candidate for age estimation and appearance-related people attributes on individual detected subjects. Investigate ONNX compatibility and licensing. A separate compatible person detector/face-body association stage is required for robust counts and per-person mapping; MiVOLO by itself should not be represented as a complete people-counting pipeline. Desired aggregate labels include `3 people`, `2 adults`, `1 child` and, when supported and responsibly labeled, tentative categories such as `1 man`, `1 girl`. Broad age groups are estimates, not known ages; appearance-derived labels must never claim to establish identity or gender identity. Allow correction, unknown, and manual opt-out.
- **JoyTag:** **retain**, independent and optional specialist for anime/illustration-style tagging. Keep **hidden and disabled by default**, revealing its download/activation and controls only after the user explicitly enables it in Settings. It must not silently be included in default Run All.

After replacements are proven, retire YOLO11n from the primary tagging role and retire OpenCV FER from default tagging. Maintain migration/recovery and avoid declaring either model fully removed until code, install assets, manifests, helper builds and UI are reconciled.

## Product-level requirements

1. Distinct model execution sources and original outputs remain independently saved with model version, image identity, thresholds and provenance; user-authored tags are never overwritten. Combining visible tags is a view, not destructive rewriting.
2. Explicit Generate Tags only; no auto-inference when scrolling/opening cards. Sequential execution and bounded companion resources on low-memory hardware; no concurrent heavyweight model sessions by default.
3. Offer understandable levels such as Essential / Rich / Exhaustive based on actual qualified predictions; preserve full source results for review. Expose no fixed fabricated count guarantee.
4. People & Ages tags should derive from per-person detections and estimates; count totals must reconcile with their component counts, and uncertain/obscured people must not be guessed into categorical bins.
5. Perform fair side-by-side tests on varied everyday photographs, portraits, groups, photos with children, illustrations, dark/occluded scenes and empty scenes. Track useful distinct correct tags, precision, recall/coverage, people count accuracy, age-group error, false positives, speed, peak RAM, model download sizes, cold-start behavior and actual Windows packaged-companion success.
6. Check actual checkpoint/weights and export licenses for commercial redistribution. Existing third-party ONNX exports are research candidates, not automatic permission to ship.

## Phased execution order (explicit owner decision)

**Phase 1 — now: interface and UX first.** Stabilize the Bookmark Board as the common card convention across boards; fix blank/new-board inconsistency, tagging panel and expansion behavior, interactions, notes/bookmark rows, smooth state transitions, previews, keyboard navigation, and regressions. Keep the current AI working as a testable reference. Do not let research/replacement derail interface fixes.

**Phase 2 — next: benchmark and qualify candidates.** Once the relevant user-facing architecture is stable, test RAM++ and MiVOLO v2 with a suitable non-YOLO person detector, plus existing optional JoyTag. Inspect licenses, ONNX exports, memory and device feasibility before deciding exact shipped variants.

**Phase 3 — implement and verify replacement.** Swap adapters at the documented interface boundary, preserve prior runs/user curation and source-specific profiles, validate packaged downloads, update manifests and migration guides, and only then deprecate the former models.

**Invariant:** polished usable UI first; rich accurate tagging later; never delete working evidence or replace proven functionality with untested expectations.

**Companions:** [ONNX tagging integration](ONNX_TAGGING_INTEGRATION.md), [Tag provenance and curated state](PROPOSAL_TAG_PROVENANCE_RUNS_AND_CURATED_STATE.md), [Current card workspace](CURRENTLY_WORKING_ON_CARD_WORKSPACE.md), [Card expansion and transitions](PROPOSAL_CARD_EXPANSION_STATE_TRANSITIONS_AND_ROULETTE.md).
