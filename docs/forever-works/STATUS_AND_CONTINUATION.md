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
