# Current state and cold continuation ledger

**Initial foundation:** 2026-10-15. Historical status; agents must inspect code and commit history for later changes.

## Exists

- Agent-neutral project purposes and multistage dependency plan under `docs/forever-works/`.
- Canonical Forever Works 0.1 model under `forever/` with manifest, project intent, 3 capabilities, 3 invariants, 1 hard constraint and 1 historical decision. Provenance states owner direction; no claim of implemented behavior.
- Experimental Python catalog graph `src/atlas_core/catalog.py` supporting resources with locators, catalog membership, tags, typed links, JSON export/reload and tests under `tests/`.
- Local standard-library verification entry `scripts/check_project.py` with basic referential checks and unit execution.

## Does not exist / is not proven

- Production database with transactional concurrency and robust migrations.
- Normative upstream Forever Works Standard 0.1 schema validation on all records, unless independently run and recorded by a successor.
- Chrome extension, Python companion server, authenticated pairing, user-granted filesystem bridge, native host, PyInstaller distributable and Windows/Linux wake tests.
- Cloudflare R2 credentials/adapter, real bookmark source adapter, archive tooling, Android app, real cross-product integration.
- Runtime conformance evidence, Chrome Web Store acceptance, commercial product revenue, cold-agent reconstruction proof.

## Next bounded increments

**N1 — canonical validation and graph hardening:** pin/check upstream validator or bring in independently verified compatible adapter; test provenance, references and the normative schema; add stable domain JSON schema and negative tests; transactional save, import/export migration and conflict handling, without breaking current experimental fixtures. Document migration of the prototype if needed.

**N2 — constrained companion:** trusted test directory grants, authenticated read-only API, no shell, path race/symlink protections, deny-unpaired and malicious webpage probes. Only after secure negative tests pass.

**N3 — client implementation:** MV3 UI that pairs with installed companion and exercises one real authorized file listing plus bookmark↔local file pairing in persistent catalog.

**N4 — real packaging and recovery:** PyInstaller on Windows; installer with per-user native-host registration, wake + reconnect, verified kill/restart and OS lifecycle tests; Linux separately.

Later work follows `BUILD_PROGRAM.md` milestone ordering. Agents may work concurrently on contracts, a11y, tests, providers and UI if the interface versions are fixed; no concurrent feature gets to borrow another's proof.

## Rules for ledger revisions

Append dated status with exact checks/OS results. Distinguish attempted, working, unverified and blocked. Do not erase prior unknowns merely because a build compiled. Store evidence as checksummed test receipts; secrets/logged absolute sensitive paths excluded.

## How to reconstruct cold

Use `RECONSTITUTION_PROTOCOL.md` with verified canonical records and full independence from historical language/framework; preserve source as evidence, not as mandatory dependence. Fix accepted external behavior; let internal mechanism change.

## 2026-10-15 — Linux functional explorer implementation

This dated entry supersedes the initial implementation inventory above while preserving its history. Owner direction was `codex/BUILD_PREMIUM_ATLAS_END_TO_END.md`; accepted canonical meaning and upstream Standard 0.1 were not changed.

**Implemented:** `src/atlas_companion/` provides exact-origin/token/Host-authenticated Linux loopback access to explicit read/write folder grants; descriptor-safe listing/preview/hash, real mkdir/rename/copy/move and recoverable trash/restore, bounded operations, durable idempotency/unknown-outcome receipts and authorized history. `src/atlas_native/` and `scripts/install_native_host.py` add explicit exact-origin Linux development native bootstrap/wake without granting roots, and verify the server before disclosing credentials. `src/atlas_core/store.py` adds transactional revisioned graph persistence; v1 validation/import and successful-move locator reconciliation preserve logical IDs. `extension/` implements full-tab/side-panel source, polished functional file navigation/selection/context operations/internal clipboard and drag/drop, properties, hash, safe text/image preview, persistent catalogs/tags/notes/bookmark resources/typed links and recovery after reload.

**Actual evidence:** Python 3.12.14 on Linux, `python scripts/check_project.py`: **54 tests passed, no skips**. `node scripts/test_extension_broker.mjs`: **9/9 worker contract tests passed** using Node VM doubles. Real CLI/HTTP smoke passed. Chromium 154 DOM + real companion via test-only transport passed 14 workflow categories with byte/digest/persistence assertions, narrow390px layout and no page JavaScript errors. Standalone Linux native process wake/framing, installer authority, malicious-listener refusal and credential rotation are exercised by Python tests. The upstream Forever Works validator at `ebeb65f786ba0d9ba0e730dddd8047937348257a` and independent Draft2020-12 schema oracle validate the unchanged manifest plus nine records; upstream's six Python tests passed. Deterministic unsigned extension ZIP built with an identical rebuild.

**Not proven:** actual MV3 worker/CORS/Chrome Native Messaging callback. Managed Chromium blocks unpacked extensions, and its policy was preserved. DOM and Node doubles do not replace that platform gate. Windows/PyInstaller standalone packaging, Android, R2, native Chrome bookmark ingestion, advanced previews, Store acceptance, production security and blinded reconstruction remain incomplete/unrun. There is no implicit cross-platform PASS. File effects, graph reconciliation and receipts are not an atomic cross-store transaction; pending outcomes require inspection, not blind replay. No production release is claimed.

**Receipts and continuation:** `docs/evidence/implementation-2026-10-15.json` records exact commands, source digests and scope; `docs/evidence/forever-validation-2026-10-15.json` pins canonical inputs. `docs/implementation/LOCAL_EXPLORER_V1.md` declares fixed/constrained/fluid aspects, security bounds and reconstruction-facing interfaces; storage and recovery contracts are alongside it. `codex/HANDOFF_LATEST.md` contains reproducible setup, P0/P1/P2 progress, limitations and exact next gates. Begin next with authorized real-Chrome runtime and native callback proof, then adversarial race/crash/revocation reconciliation before extending privilege or Windows/provider capabilities. Preserve all existing invariants, versioned records, test oracles and truthful UNKNOWN outcomes.

## 2026-10-15 — Linux standalone companion and recovery

Owner assignment `codex/BUILD_RECOVERY_SUPERVISOR_AND_INTEGRATE.md` now has a functional Linux slice: bundled PyInstaller/Tk setup/location manager, no-Python user installation, exact-ID registration, persistent deliberately broad root grants with private state/runtime exclusions, transactional authority schema2 migration, remembered browser enrollment/session credential rotation, bounded automatic native recovery, strict attested-incarnation pidfd stale-helper recovery, optional explicitly enabled per-user supervisor and reversible owned-file installation. No shell API or implicit root grant is introduced; graph format/protocol stay compatible.

Evidence:82 Python tests,18 worker contracts,7 real native-host/HTTP recovery categories,16 Chromium DOM/real-helper categories, actual native widgets and standalone native-wake/byte-copy with Python absent from PATH passed. All17 canonical records pass pinned upstream and independent schema validators. Exact source/artifact hashes and proof limits are in `docs/evidence/recovery-implementation-2026-10-15.json`; current continuation is `codex/HANDOFF_LATEST.md` and end-user setup is `packaging/README.md`.

Actual Chrome callbacks remain NOT_RUN under managed policy; OS logon/systemd/sleep/reboot, clean-machine ABI, Windows, signing, Store and soak proof remain outstanding. The current binary is Linux x86_64/glibc2.41, unsigned. The owner requested Windows next: preserve the existing portable code/contracts while implementing and independently testing Windows handle/reparse/ACL/process/registry semantics; do not weaken Linux safeguards or bypass platform guards. Chute RC1 is pinned historical architecture, not copied licensed code or ATLAS Windows certification.

### Windows continuation started

Following Linux delivery `fbc2fd3`, a Windows-only held-handle read/list provider and actual-Windows workflow tests were added as a bounded first increment. It is not enabled in the integrated companion; Windows ACL state, mutations, native installer and lifecycle remain unfinished. Local grammar checks pass; native Windows tests require the Windows runner. See `docs/implementation/WINDOWS_PORT_V1.md` and workflow evidence rather than assuming platform parity.

Actual Windows continuation evidence:workflow38775102540 passed on Windows Server2025 (7pass/1 Linux-onlyskip; all5 kernel tests executed). This proves only the new read/list boundary, not a complete Windows helper or Windows10/11 desktop lifecycle. Linux CI and unsigned installer workflow also passed; the Ubuntu22.04/glibc2.35 binary was independently downloaded and retested for no-Python native wake/bytes/GUI. See `docs/evidence/windows-and-linux-ci-2026-10-15.json` and latest handoff for artifact download and remaining gates.


## 2026-10-15 — integrated Windows companion and recovery proof

This supersedes the historical Windows-foundation-only status above. Main now contains independent Windows NT-handle filesystem operations, persistent SID-owned protected-DACL authority, exact-origin HKCU native installation, bundled native-management UI, attested process-incarnation recovery, and an opt-in per-user login supervisor. Shared graph/HTTP/MV3 contracts and Linux implementations remain intact. No Chute source was copied; pinned historical architecture and all17 canonical records remain unchanged.

Actual Windows Server2025 workflow38779850667 passed40 unit cases (39 passed/1 expected Linux-only skip), actual native Tk management with disposable controlled dialogs, and the real frozen x86_64 executable acceptance: no-Python native wake/HTTP byte copy; mkdir/rename/move/trash/restore; precise process stop/re-wake; real NtSuspendProcess hang recovery; durable grants/receipts; live upgrade; immediate opt-in supervisor and failed-helper restoration; disable/revocation persistence; live owned uninstall. Download and SHA256 are in the latest handoff and `docs/evidence/windows-companion-recovery-2026-10-15.json`. Downloaded binary digest, size and Windows-CRLF source fingerprint were independently checked. Linux development CI38779850655 passed122 Python cases (93 passed/29 Windows-only skips),18 worker contracts and actual Linux native/worker integration.

Actual Chrome Native Messaging callbacks remain NOT_RUN under managed browser policy. Physical Windows10/11 sleep, hibernation, shutdown/reboot/logon, Linux systemd power cycles, clean-machine frozen GUI, publisher signing, Store approval, idle/power measurements and soak remain separate gates. A suspended process is not physical OS suspension. Windows recursive directory copy/cross-volume move remain explicitly unsupported; filesystem/graph/receipts still lack a shared atomic crash transaction. Preserve OUTCOME_UNKNOWN and never blindly replay a submitted mutation. See latest handoff for exact continuation; desktop lifecycle proof is next.


## 2026-10-15 — owner-requested native manual-token fallback

Owner observed a locally READY helper while the loaded extension rejected native
pairing with "Pair this exact extension ID using the local CLI." Root cause of
that installed-build mismatch remains UNKNOWN. Added a Manual pairing (debug)
native tab with exact-ID entry, explicit token generation, masked/revealable
read-only field, Copy token and Clear displayed token. Reuses State.pair through
Management.pairing_token: explicit local consent, ID-bound digest storage,
rotation of the previous credential, no new file grants, no HTTP token endpoint.
Fixed authority and grants contracts remain unchanged; presentation is fluid.

Verification: scripts/check_project.py and tests/test_management.py cover consent,
invalid ID rejection, old-token invalidation, wrong-origin denial and unchanged
grants. scripts/smoke_desktop.py now exercises the real new widgets, clipboard,
masking and clearing in platform CI. Local environment has no display/Xvfb;
actual Windows widgets/frozen EXE and user's Chrome acceptance require the new
Windows workflow artifact. No claim that manual pairing repairs startup/native
registration or guarantees this user's browser connectivity. Next: download new
artifact, test manual pairing and actual folder listing; inspect the concrete
browser error if HTTP authentication still fails.

Executed local result: management suite PASS (4 tests). Full check_project run:
123 tests, 3 failures, 3 errors, 29 Windows skips; failures/errors concern native
subprocess wake/supervisor startup with missing /proc child identity or helper
not reaching READY in this execution environment. Full suite is NOT PASS. New
management tests passed within that run. Actual Tk smoke NOT_RUN locally (no
Xvfb/display). Windows CI remains the platform-specific build/GUI gate.


## 2026-10-15 — observed Chrome worker GET without Origin

Owner supplied network evidence: GET /v1/health returned INVALID_ORIGIN/403;
Chrome 154 worker sent Sec-Fetch-Site: none and a bearer, but no Origin header.
This was an origin-gate failure before token validation, not proof of an invalid
token. Implemented extension v0.1.1 explicit X-Atlas-Extension-Origin identity
selector. Helper accepts it only for authenticated requests without Origin and
with Sec-Fetch-Site: none; exact enrolled extension identity and bound bearer
remain mandatory. A supplied Origin must match; website/null origins, missing or
wrong tokens, revoked identities and missing identity still fail closed.
Unauthenticated bootstrap/preflight retains real-Origin requirement. This header
is not independent authority and does not grant files. Native consent remains fixed.

Verification: 23 companion HTTP/security tests PASS including the observed GET
shape and negatives; 18/18 Node worker tests PASS. Local native recovery integration
still fails on helper startup in this execution environment; actual Chrome manual
pairing and folder display remain NOT_RUN until owner installs both new builds.
Windows artifact now includes the matching extension ZIP so helper-only updates
do not leave the old request code running. Replace files in the existing unpacked
extension folder and Reload to preserve its ID. Windows CI verifies frozen helper
and actual token widgets separately; it is not actual Chrome acceptance proof.


## 2026-10-15 — preserve Working v1, then improve existing preview

First committed docs/releases/WORKING_V1.md at 1193e7332a63f3211e54c38354903ba926df3a5a,
pinning the owner-confirmed source 6d974083daf7379d55d10a0da92a4cf01bf9da1c.
Only afterward implemented Left/Right and two equivalent buttons in the existing
details preview, current visible sort/filter order, wraparound, persisted
image/audio/video defaults and opt-in text/PDF. Added built-in audio/video controls
and local-blob PDF frame; no separate viewer layout, provider or native transport.
See PREVIEW_CONTINUITY.md and canonical capability.preview-navigation /
decision.preview-continuity. Records preserve requirements; acceptance remains
planned until actual browser verification, rather than equating source with proof.

Node navigation tests and JavaScript syntax/package checks PASS locally. No local
Chromium/Playwright runtime is available: actual keyboard DOM, PDF plugin and
codec playback NOT_RUN. Existing 2 MiB native preview read cap remains; large
media streaming is not implemented. Next: verify folder navigation in installed
Chrome and later design bounded authenticated streaming/document scrolling.

Local full verification: 124 tests; 3 failures, 3 errors in native helper startup/supervisor tests; 29 Windows-only skips. Local model linkage: 19 records valid (not normative schema proof). Full suite is NOT PASS in this environment. Navigation unit checks PASS; actual Chrome preview integration remains NOT_RUN.
