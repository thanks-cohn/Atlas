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
