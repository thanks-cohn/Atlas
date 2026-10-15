# Companion recovery — implementation-independent cold reconstruction packet

**Status:** owner-directed engineering requirements + historical precedent, not an ATLAS Windows certification. Canonical Forever Works Standard 0.1 records are in `forever/manifest.json`. Read this with `CHUTE_RESILIENCE_REFERENCE.md`, `COMPANION_RECOVERY_VERIFICATION.md`, `SECURITY_AND_DISTRIBUTION.md`, `docs/implementation/RECOVERY.md`, and `codex/HANDOFF_LATEST.md`.

## Historical reference, exact pin

Repository: https://github.com/thanks-cohn/chute
Tagged Windows RC1: https://github.com/thanks-cohn/chute/releases/tag/chute-windows-v2.6.1-rc1
Tagged source commit: `deb9bdbaba594e493092f498916cdfd269c6cd3b`
Artifact: `Chute-Setup.exe`, **17,910,394 bytes (~17.1 MiB)**, SHA256 `36c7d80d4277e3f3b4167425e81f8da8eaee8a3a0fb3798d70bf2aeb5a5f6d50`.
Chrome production extension ID (Chute only): `hpcpnigfadojjmnbflfhkfkallfafajb`. This must **not** be used as ATLAS's Chrome identity.

Observed source patterns:
- `src/chute/windows_app.py` registers per-user Windows HKCU Run entry launching the installed frozen app with `--background` after logon. Installation and registration are user-consented; no administrator, Windows Service or separate Python requirement in the release.
- `src/chute/native_host.py` registers Chrome Native Messaging host and an allowed extension identity set; a browser-triggered `ensure_bridge` checks health, rechecks after delay, terminates the identified stale Chute process and relaunches its local bridge. Source notes stale-but-running bridge after sleep/resume.
- `extension/background-native.js` uses `chrome.runtime.onStartup`, `onInstalled`, service-worker startup and messages from extension UI to attempt health/Native Messaging wake with bounded retries. It catches failed bridge requests and retries after wake.
- The release CI uses a random unpacked extension ID, verifies native host allowlisting, kills Chute.exe and verifies bridge revival on `127.0.0.1:17891`. **This test is narrower than proving uninterrupted behavior throughout sleep/hibernate/reboot.**
- Owner reports the broader architecture retained usefulness over 50+ days on several Windows 10/11 and Garuda Linux machines; retain as attributed field experience. The tagged installer is Windows only; its Linux counterpart is separate.

The Chute repository has a **source-available non-commercial license**. Future agents MUST evaluate license/commercial rights before copying code; prefer independent implementation of requirements and black-box behavioral tests. Use digests and pinned source for historical traceability rather than unreviewed copying. Do not replicate weak local HTTP authentication or indiscriminate process killing.

## Why an optional second helper could exist

The first helper performs real file operations; an optional **recovery supervisor** may watch the authorized service's health and respond to events available from the operating system. Its goal is to recover when **Chrome is closed, service worker idle, or companion stale** after Windows logon or OS resume. It must not be an invisible persistence mechanism or permanent sleep inhibitor. Implement as an opt-in, per-user, small-footprint process/task, using documented OS facilities such as login startup and resume/session notifications when available. Alternative: periodic health-triggered native host only, without a persistent supervisor. Support uninstall, enable/disable and diagnostics. Never assume a second helper is mandatory or more reliable without measurement; it adds attack surface.

**Physical boundary:** no local process runs while the PC is fully powered off, hibernated or normally suspended. A user-consented OS wake timer *may* resume some machines when power policy/hardware allow, but it does not guarantee wake, network availability, or access to locked sessions and should not be default. Remote wake/cloud processing is a separate opt-in deployment requiring its own security and availability contracts.

## Responsibility model

UI -> authenticated MV3 broker -> registered/native wake host -> verified service identity -> separately authenticated, capability-scoped local API -> filesystem authority. Optional supervisor observes only local helper health and OS lifecycle, never acquires or expands broad file grants.

Native host enrollment uses ATLAS's **own** exact production extension ID, and a secure deliberate dev enrollment flow for unpacked IDs. Avoid Chute's opportunistic discovery as an implicit permission grant. Host identity and credentials must survive permitted restarts but be revocable. A new extension ID may require re-pairing. No browser content script receives the helper secret.

## Fixed / constrained / fluid

**Fixed:** authorized service recoverability after supported interruptions, honest unavailable states, preservation of catalog/relationship state, grants and revocation, no unnoticed credential propagation, idempotent effects and usable first-run consent.

**Constrained:** startup and recovery latencies, memory, CPU and power overhead, supported OS/browser matrix, retries, log retention and operation recovery deadlines. Must be benchmarked.

**Fluid:** Windows Run key, OS scheduled task, service, process watchdog, Python frozen executable, Native Messaging, loopback TCP, IPC transport, distro startup manager, file database and implementation language. Replacements require independent safety and behavioral evidence.

## Cold reconstruction procedure

1. Validate `forever/manifest.json` and exact linked records against pinned Forever Works normative schemas; trace capability -> invariant -> constraint -> historical decision. Record any missing references as failure, not success.
2. Inspect the exact pinned Chute tag and release notes where legally available; if inaccessible, reconstruct from this written behavioral contract and negative fixtures without assuming source details are essential.
3. Enumerate platform lifecycle triggers (browser UI activation, worker startup, installed native host invocation, logon/startup, OS resume) and write OS-specific capability matrices.
4. Implement the **simplest secure path**: user-consented installer, exact ID native host, authenticated helper, health request, bounded native wake and re-authentication. Keep filesystem grants completely separate from wake.
5. Add an optional supervisor **only if** actual no-browser recovery requirements, measurement and opt-in warrant it. Prefer a minimal well-observed process/task over redundant aggressive restarts.
6. Implement safe single-instance arbitration and stale-instance handling; never kill arbitrary same-name processes; ensure process/executable identity and ownership before termination.
7. Implement durable operation receipts with `OUTCOME_UNKNOWN` and separate manual/safe reconciliation rather than silently retrying uncertain mutations.
8. Run the cross-platform acceptance matrix, collect versioned logs, hashes, timing and negative security results. Chrome MV3 and native messaging must be verified in **actual Chrome**, not only DOM bridges.
9. Archive implementation and evidence records with exact versions, hashes, dependencies, migrations and limitations. Never promote owner field anecdotes into CI proof or use a Windows pass to claim Linux/Android parity.

## Current ATLAS boundary

As recorded in `codex/HANDOFF_LATEST.md` 2026-10-15, ATLAS has a Linux development native bootstrap with authenticated wake proof; actual Chrome MV3 callback, Windows PyInstaller install, resume/hibernate/shutdown cycles and optional second supervisor remained unproven/unbuilt. Do not replace this record with a success assertion absent new evidence.

## Accepted native-feeling interaction refinement — 2026-10-15

The owner requires a **one-time, understandable native setup** followed by a consistent familiar file explorer. Installation, exact extension pairing and initial folder/drive grants should be durable within that same user account/device, surviving browser reload, MV3 worker suspension, helper restart, sleep/resume and reboot/logon where OS policy permits. Existing authorized operations should not repeatedly request Chrome pickers, pairing tokens, or identical grants. An authorized whole-drive or home-directory scope may be supported after explicit native consent; it never implies privilege beyond the user's OS account or transfer of scopes between devices.

**Fixed user-observable behavior:** previously authorized access reappears automatically, the native bridge can be awakened without manual terminal commands, and ordinary authorized navigation, copy/paste and move operations work without consent fatigue. **Required exceptions:** new root/scope, changed extension identity, revoked authorization, another device/account, unavailable OS permission, and irreversible/high-risk effects may require explicit interaction. A durable grant remains revocable and inspectable. Do not silently disable OS security or request admin by default.

**Evidence:** after initial enrollment, run repeat-use scenarios through real Chrome/Native Messaging and restart/wake events and count redundant prompts (target **zero** for same-scope ordinary actions). Test revocation and extension identity changes as negative cases. This refines the companion product acceptance outcome; implementation and browser-native permission prompts are not assumed equivalent.
