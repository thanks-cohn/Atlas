# Cold-agent inheritance, verification and promotion protocol
**Historical anchor:** 2026-10-15 · **Revision:** 1 · **All features: proposed unless separately proven**

### First read
Inspect repository `AGENTS.md`, `forever/manifest.json`, `docs/forever-works/STATUS_AND_CONTINUATION.md`, `docs/forever-works/PREMIUM_EXPLORER_PRODUCT_CONTRACT.md`, latest test evidence, `src/atlas_core/`, native helper provider grants, MV3 UI and the original curation proposal. DO NOT assume the dated status ledger is current; inspect actual implementation and tests.

### How to build
1. Identify existing stable logical graph and persistence contracts; propose versioned migration for independent title/note/edge data, never destructively alter historical meaning.
2. Build basic optional-notes Save and bookmark import workflow, pinned catalogs, responsive keyboard-friendly views; test persistence and error cases.
3. Add references for image/gallery/video/document/file, metadata, typed media counts, local/R2 preview and split inspector; preserve provider scopes and byte safety.
4. Specify formally validated AKF JSON Schema with fixtures and a **separate** reader implementation; prove round trip, privacy redaction and independent programmatic consumption.
5. Build interactive graph with controls for frequency, opt-in active time and combined weights, and informative unknown data. Test large graph performance on modest hardware.
6. Compose publications with source-linked or version-pinned blocks, select/omit bookmarks, then generate portable static sites and optional charts/graph pages.
7. Independently security-test graph privacy, token revocation, protected attachments, output HTML and site assets. Do not confuse a working mockup with provider/API integration.

### Test plan
See `acceptance.json`. Store runnable test fixtures, OS/browser versions, executed commands, coverage limits, logs without secrets, and evidence receipts on an eventual **implementation** period. Never change NOT_RUN to PASS without execution. Validation of these drafted JSON records against upstream normative Forever Works 0.1 schemas remains separately required; `akf-contract.json` is a domain idea, not itself a validated JSON Schema.

### Historical append-only rule
For changed beliefs, new requirements or corrections: create a new dated directory with explicit prior package IDs and `amends`/`supersedes` links, separate revision number, reason and compatibility impact. Preserve older records for future reconstruction. Dates record real decisions, not fabricated release dates.

### Canonical manifest promotion
`forever/manifest.json` can be changed **only once the specific capability reaches integrated staging verification AND production-quality user-value acceptance**. Require: owner-accepted behavioral tests, adversarial privacy/authorization tests, real environment verification, backwards compatibility and migration proof, performance/a11y where relevant, and reproducible evidence IDs. Append the verified new canonical record references to existing manifest arrays without deleting/overwriting old entries; if only one of five capabilities is verified, promote only that one. Update documentation through a new dated implementation/progression record. A mere proposal, PR, scaffold, UI rendering test or schema draft is insufficient.

### Fixed vs fluid
Fixed: user enjoyment, independent meaningful notes on all graph entities/edges, privacy boundaries, recoverable data, interactive previews, useful publishing, external readability, honest visit/time weighting. Fluid: frontend framework, renderer, DB, graph layout, extension view topology, JSON serialization implementation and publishing templates.
