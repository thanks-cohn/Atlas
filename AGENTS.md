# ATLAS — cold-agent entrypoint (agent-neutral)

Any human or software agent can work here. This file communicates repository contracts, not requirements for a particular provider or coding assistant.

## Read this order

1. `README.md`
2. `docs/forever-works/README.md` and `docs/forever-works/MISSION_AND_SCOPE.md`
3. `docs/forever-works/BUILD_PROGRAM.md` (milestone dependencies, parallel lanes, exit gates)
4. `docs/forever-works/INVARIANTS_AND_FLUIDITY.md`, `SECURITY_AND_DISTRIBUTION.md`, `CONTRACTS_AND_VERIFICATION.md`
5. `forever/manifest.json` and every listed record; trace links by exact ID. The normative format is Forever Works Standard 0.1, independently maintained at `thanks-cohn/forever-works`.
6. `docs/forever-works/STATUS_AND_CONTINUATION.md`; inspect source, tests and history to confirm claims.

Do not assume a prior conversation, proprietary service, hidden memory, external repository checkout or installed agent plugin.

## Run verification

From repository root: `python scripts/check_project.py`. Uses Python standard library and verifies model linkage plus the resource graph unit suite. It is **not** a substitute for normative Forever Works schema/conformance validation, actual Chromium/native runtime testing or security audits.

## Non-negotiable construction protocol

- Preserve intent, accepted capabilities, invariants, permission boundaries, migrations and actual proof; implementation language and deployment machinery are replaceable.
- Distinguish **explicit owner direction**, **observed evidence**, **inferred requirements**, **agent proposals**, and **proven implementations**. Record UNKNOWN instead of manufacturing success.
- User-authorized native filesystem access is never a license to scan/delete arbitrary machine files. Local HTTP CORS is not authorization; companion requires secure pairing and scoped grants.
- PyInstaller may bundle Python without requiring Python on the user's machine; a Chrome extension cannot silently install the native executable. Preserve Chute's one-time-consent plus wake/reconnect experience.
- Preserve `forever/` canonical records and versioned `docs/forever-works/` rationale; do not alter upstream Forever Works Standard 0.1 to fit an ATLAS shortcut.
- Implement one **real functional vertical slice** at a time; security-negative tests precede privileged file operations; use small stable interfaces and portable storage with migrations.
- Before replacing a subsystem, declare fixed, constrained and fluid aspects; independently verify preserved obligations and document broken ones.
- Do not merge source/target OS assumptions: Android SAF is not desktop-wide filesystem access; Windows and Linux packaging need separate runtime proofs.
- Keep cross-platform files readable, modest in size and dependency-conscious. Avoid unexplained binaries, hidden credentials and unstable generated artifacts.

## Current implementation state

The first foundation was an experimental metadata-only JSON graph. The 2026-10-15 implementation adds a Linux scoped-filesystem companion, durable metadata store, MV3 client source and explicit Linux Native Messaging development bootstrap. Read the latest appended status and `codex/HANDOFF_LATEST.md` for exact proof and limitations; implemented source is not proof of Chrome/Windows runtime or production security. R2 and Store approval remain unimplemented/unproven.

## Work selection

Proceed from the earliest unmet acceptance gate in `BUILD_PROGRAM.md`, factoring parallel lanes. Near-term: independently validate canonical records against real Forever Works validator/schema; harden persistent graph formats/transactions/migrations; then construct authenticated read-only native companion and real Chrome MV3 UI. Prefer tests of observable behavior over mock-only diagrams. Before ending a task, update status ledger with exact artifact paths, tests, caveats, next dependency and actionable continuation. Commits should be additive; never claim an unexecuted test passed.

## Companion continuity preservation

The user's priority is Chute-inspired dependable native helper recovery across browser/OS lifecycle interruptions. Read `docs/forever-works/COMPANION_COLD_RECONSTRUCTION.md` and `COMPANION_RECOVERY_VERIFICATION.md`; the associated requirements are canonical under `forever/`. The pinned Chute Windows v2.6.1 RC1 tag is historical evidence, not permission to copy its licensed code or assert Windows support. An optional separate supervisor is proposed, never a substitute for OS permission or a claim to execute while powered off.
