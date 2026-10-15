# ATLAS — Full Machine-Capable Explorer and Recovery Supervisor Integration

**Implementation assignment (Codex); product authority remains agent-neutral in Forever Works docs.** Work on `main`. Do not merely scaffold. Ship the largest real, verified vertical slice possible and record exact limits.

## Cold inheritance and pinned precedent

Read `AGENTS.md`, `forever/manifest.json` and its referenced records, `docs/forever-works/COMPANION_COLD_RECONSTRUCTION.md`, `COMPANION_RECOVERY_VERIFICATION.md`, `CHUTE_RESILIENCE_REFERENCE.md`, `PREMIUM_EXPLORER_PRODUCT_CONTRACT.md`, `SECURITY_AND_DISTRIBUTION.md`, `docs/COMPANION_API.md`, `docs/implementation/RECOVERY.md`, and `codex/HANDOFF_LATEST.md`.

Chute Windows v2.6.1 RC1 is an engineering precedent, **not** a code license or copy source. Pin: commit `deb9bdbaba594e493092f498916cdfd269c6cd3b`, installer `Chute-Setup.exe`, SHA256 `36c7d80d4277e3f3b4167425e81f8da8eaee8a3a0fb3798d70bf2aeb5a5f6d50`. Distinguish its Windows process-kill wake CI proof from owner-reported longevity across operating systems. ATLAS must not reuse Chute's Chrome extension ID.

## Mission and user-level power

Make ATLAS a **premium full-machine-capable file explorer accessed from Chrome**, with an explicitly installed native OS companion. The legitimate capability advantage is that the user's consented *native application* can interact with ordinary OS files that browser APIs don't expose—not evasion of browser policy. Give the user maximum **deliberately authorized** breadth:

- Multiple mounted locations and whole-drive/volume roots (e.g. `C:\\`, `D:\\`, Linux mounted volumes or selected home directory) may be granted intentionally by a trusted native interface after clear warnings. Surface permission-denied entries honestly; do not imply that all privileged or system-protected locations are accessible.
- Powerful operations across approved roots: list/tree/search/index, read, image/text/PDF/archives previews as appropriate, file hashes, copy/cut/paste/duplicate/move/rename, new folders, save/export/download/send-to, trash and safe recovery, drag-drop, bulk selection and eventually file watching. Ask for additional OS user grants only when accessing unapproved locations.
- The browser itself must not mint a root grant via an unauthenticated local HTTP request. Grant selection and scope changes must be authorized through trusted native user interaction or a separate, explicit companion CLI. Broad roots must not be defaults; support a visible grant list, per-root read-only/write permissions, scope inspection, easy revocation and safe upgrade of permissions.
- Do not run arbitrary shell commands for webpages, permit hidden/elevated installs, attempt permission bypasses, defeat OS protections or silently modify whole-machine state. No administrator privileges or Windows Service by default. If a user explicitly wants privileged mode, make it a separately designed, consented and audited product with its own threat review—not part of this task.

## Work packages

### P0 — inherited proof
Run `python scripts/check_project.py`, `node scripts/test_extension_broker.mjs`, `python scripts/smoke_companion.py`; validate the newly expanded Forever Works model against pinned upstream validators and schemas. Capture exact command results and any blockers. Respect actual current code.

### P1 — robust native authorization of broad scopes
Harden the existing Linux grant model to support multiple user-approved roots and optional volume roots with strong path-containment, symlink/mount/junction semantics and revocation. Design a native-controlled `Add location` flow that never confuses an extension click with operating-system permission. Make mounted volumes and system protected paths fail safely. Windows implementation must use platform-appropriate handle/reparse-point security; **do not translate Linux `openat` semantics naively to Windows**. Read operations and metadata need exact scoping; file mutation requires explicit write authority. Keep native state outside granted roots. Test hostile path swaps and concurrent revocations.

### P2 — consented recovery supervisor
Implement a lightweight optional helper/worker with explicit enable/disable/uninstall, bounded health detection and recovery, single-instance protection and resource-conscious scheduling. Use OS-native per-user startup/resume signaling where supported. The native host remains an independent demand-wake path: ATLAS must recover when supervisor is disabled. Distinguish stale server processes from missing ones using authenticated health and strict process identity; never indiscriminately kill every process sharing a name. No claim of running while hibernated or shut down. Wake timers only with separate user consent and only if hardware/OS support them.

### P3 — integrated extension/native lifecycle
Connect existing Chrome MV3 service worker, registered Native Messaging wake host, optional supervisor, authenticated loopback API and durable graph into one verified workflow. Protect native credentials from content scripts/webpages and authenticate exact extension identities. Preserve grants during allowed reconnection without silently granting a newly installed extension identity. Clear states: READY, STARTING, OFFLINE, NEEDS_INSTALL, NEEDS_PAIRING, NEEDS_GRANT, NEEDS_REPAIR, OUTCOME_UNKNOWN. Service-worker dormancy, browser relaunch, helper kill and OS resume must recover through supported triggers. All destructive actions use idempotency keys and pending-operation reconciliation rather than blind retries.

### P4 — premium file manager completeness
Real UI workflows across multiple granted roots: file tree, breadcrumbs, history, back/forward, list/grid, sorting and search, Ctrl/Shift selection, right-click menus, copy/cut/paste, Move To, Copy To, Send To, rename, new folder, duplicate, properties, preview, trash/restore, progress and actionable errors. Ensure operations work over real bytes with no unsupported mock commands. Context actions must be disabled/hidden appropriately if scope or provider lacks capability. Bound bulk work and design safe conflict handling and cancellations.

### P5 — installation, packaging and independent platform evidence
Linux native host registration, reversible optional supervisor integration, clean uninstall and versioned upgrades. Develop Windows PyInstaller bundling and user-consented install/Native Messaging registration with no separate Python/admin/service where feasible; require actual Windows tests before Windows PASS. Create Chrome MV3 package and policy/permission rationale; store approval is not inferred from packaging. Run true Chrome extension/native integration on a machine permitting unpacked extensions; do not bypass managed browser policy. Record environment, extension ID, helper artifacts, observed permission scopes and test receipts without secrets.

## Acceptance oracles

1. User selects a narrow test folder, then a second folder or deliberately approves a whole test-volume root via trusted native UX; ATLAS lists allowed files and denies unrelated paths.
2. Real Chrome extension launches/reconnects the installed companion through Native Messaging, then browses both approved locations without repeated Chrome file pickers.
3. Real data: select multiple files, right-click Copy, paste into another authorized location; verify digests and unchanged originals; perform Move To and confirm no duplicate after simulated interruption.
4. Kill helper; native host reawakens it, proves its identity and restores UI capability. When supervisor enabled, it also honors OS-supported session/lifecycle recovery. Supervisor disabled: demand wake still works.
5. Sleep/resume and full reboot/logon scenarios tested separately on each supported OS. No promises of activity during power-off; on unavailable system report accurately.
6. Root revocation persists across helper restart; unpaired webpage, forged origin, unregistered extension and manipulated symlink/junction are denied even during recovery.
7. Activity/history preserves `OUTCOME_UNKNOWN` for interrupted ambiguous effects; never automatically repeat unknown destructive writes.
8. Uninstall removes startup/native registration and worker opt-in cleanly; state deletion follows explicit user choice.

## Preservation and reporting

Track exactly which portions of this ambitious assignment are IMPLEMENTED, TESTED, BLOCKED, UNKNOWN or NOT_RUN. Update `codex/HANDOFF_LATEST.md`, `docs/forever-works/STATUS_AND_CONTINUATION.md` and evidence receipts. Add Forever Works implementation/evidence records only for checked facts; changes to owner-accepted invariants require explicit review, not silent edits. Write the contract so a future agent can replace Python, PyInstaller, HTTP, Native Messaging, the supervisor or browser without losing functionality.

Aim for a substantial integrated change and actual tests. For ~30-minute sessions, shift to validation around minute 25 and commit/push tested progress and continuation by ~28 minutes. Never claim production security or Windows/Chrome Web Store readiness without full runtime evidence.
