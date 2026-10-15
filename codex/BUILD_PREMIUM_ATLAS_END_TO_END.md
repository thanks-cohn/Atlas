# ATLAS — ambitious end-to-end implementation run

**Working repository:** `thanks-cohn/Atlas` on `main`. **Intention:** build the most complete independently verifiable premium explorer possible within the available execution budget. This file instructs one implementation agent; canonical product intent and Forever Works architecture remain **agent-neutral** under `docs/forever-works/` and `forever/`.

## Read and inherit before changing code

Read `AGENTS.md`; `docs/forever-works/README.md`; `docs/forever-works/PREMIUM_EXPLORER_PRODUCT_CONTRACT.md`; `BUILD_PROGRAM.md`; `CONTRACTS_AND_VERIFICATION.md`; `SECURITY_AND_DISTRIBUTION.md`; `STATUS_AND_CONTINUATION.md`; `forever/manifest.json` and referenced records. Run `python scripts/check_project.py`, record exact result. Check current Git branch/HEAD, inspect actual code, tests and CI; preserve every existing commit. No source-specific shortcuts or changes to normative upstream Forever Works to make local output appear valid.

## Mission

Build a **real Chrome MV3 premium file explorer extension plus secure native Python companion**, packaged through PyInstaller on Windows when feasible. A user should be able to install/pair a companion, authorize local roots, view folders in side-panel/full-page UI, right-click, select multiple files, perform real copy/cut/paste, rename, move, copy-to, send-to and delete/trash where safe, preview files, navigate/search, and organize resources with tags/catalogs/relationships. Design the API so local, R2, bookmarks and later providers can be handled with capability-specific authorization. Keep user-data meaning portable and independent from any one runtime.

**One-shot aspiration is not a license to claim unbuilt features.** If the run cannot finish everything, deliver the **largest genuine, security-reviewed end-to-end vertical slice** and leave a complete deterministic continuation. No decorative shell passing for a file manager.

## Priority sequence and concurrent work

**0 — Contracts and proof:** verify `forever/` records using real Forever Works conformance validator if accessible, otherwise state explicitly what is unverified. Document graph/store schema, companion API, errors, auth, grant state and per-action accepted behavior. Add tests for negative cases.

**1 — Durable core:** harden the prototype `atlas_core` with schema/version, serialization, durable storage and relationship tests. Stable IDs separate from locators and provider permissions; no secrets in export.

**2 — Companion and security:** Python loopback-only service, authenticated pairing/capability token, explicit roots, path-safe authorized read/list, then tightly controlled file mutation actions with idempotent operation IDs, conflict policy and recorded outcomes. Path escape, symlink/junction, forged localhost/Origin/CSRF negative tests required before any unsafe writes. **Do not emulate Chute's unauthenticated endpoints.** Build a Native Messaging bootstrap/wake host and per-user installer incrementally.

**3 — Chrome experience:** real MV3 manifest, side panel/full-page UI, premium file manager design; directory tree, breadcrumbs, history, list and grid, sorting, multi-selection, right-click, keyboard Ctrl/C/X/V/A, actual copy/move/rename/new folder/delete actions bound to API, file preview, progress/status and meaningful errors. Ensure all visible controls work; disable unbuilt options instead of pretending. Consider attractive clean interface, keyboard navigation, narrow window resilience, accessibility and sensible performance.

**4 — Provider-neutral layer:** bookmarks and local resources first; layer in R2 adapter only with separately granted credentials and actual integration/negative tests. Do not require remote credentials for offline local operation. Resource graph catalogs, tags, typed clusters and stable persistent relations must be integrated into actual UI as capacity allows.

**5 — Packaging and resilience:** build PyInstaller Windows companion where toolchain permits, installed native host registration, one-time user-consented install, reconnect/health/wake after helper termination and restart; separate Linux host registration/install. Never claim Windows native integration proved by Linux-only CI. Chrome Web Store package build, least-privilege permission rationale and privacy disclosure; review required, approval not guaranteed.

Parallelize tests/docs/UI/core where boundaries are versioned; prioritize integration of **two functioning components** over many unfinished branches. Use actual test directories, byte-level checks, denial scenarios and a Chrome runtime if available.

## Minimum compelling earned demonstration

- User-authorized test root appears in functioning Chrome explorer through the real helper.
- Navigate subfolders; right-click a real file; perform **Copy → Paste** or **Rename**, verify filesystem result; denied path stays inaccessible.
- Persistent bookmark/local resource pairing and tag/catalog work across reload.
- Browser/helper disconnection reports clearly and recovers when installed infrastructure permits.
- A documented test command and actual passing results establish each claim. If environment cannot run Chrome or build Windows binary, report `NOT_RUN`, not PASS.

## Delivery and release gates

Do not present this as Chrome Web Store approved, production secure or desktop/Android parity without corresponding external/runtime proof. No installation by silently downloaded EXE; PyInstaller only bundles Python. Explicit authorization and pairing are mandatory. Review MV3 permissions/CSP/remote-code rules, never expose credentials to websites. Apply threat-model review to local HTTP.

Preserve history and keep a continuation document with exact implemented files, tested commands, environment, incomplete actions, remaining threats, current compatibility/ABI/API contract and proposed next independent task. Update canonical Forever Works records **only when genuinely accepted meaning changes**; put runtime proof in verifiable evidence records, not inferred facts. Maintain a checklist of P0/P1/P2 completed/partial/unknown corresponding to premium contract.

## Session discipline

If running in a roughly 30-minute Codex window: first establish a test baseline and select a realistic vertical slice; around minute 20 consolidate integrated features; around minute 25 prioritize tests and commit-ready implementation; by around minute 28 commit and push changes and a refreshed `codex/HANDOFF_LATEST.md`, report remaining gaps before the session expires. Avoid waiting until time runs out to preserve work.

Aim high: the goal is a top-of-the-line product, not a proof-of-concept forever. Remain truthful: the size of this project means full implementation, installer trust, OS behavior and Chrome review will generally take multiple verified increments.
