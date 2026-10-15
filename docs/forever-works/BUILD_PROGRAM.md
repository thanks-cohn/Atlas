# ATLAS — implementation-independent construction program

**Status:** P001 owner-directed architecture; no implemented ATLAS functionality is claimed. **Audience:** any unfamiliar human or software agent, today or decades hence. **External normative reference:** [Forever Works Standard 0.1](https://github.com/thanks-cohn/forever-works/blob/main/docs/STANDARD.md). This document is not a substitute for canonical validated records.

## Foundational proposition

ATLAS is a **universal, user-sovereign resource and relationship explorer**: one coherent experience for authorized local files, browser bookmarks and web captures, remote object stores (R2 initially), archives and cooperating applications. A resource's identity, meaning and user-defined relationships outlive its storage address, provider, interface and implementation language. Users choose catalogs and clusters, type arbitrary descriptive text and tags, and relate resources without forcing duplication or relocation.

The first intended implementation is a Chrome MV3 extension with a separately user-installed local companion packaged using Python/PyInstaller, a locally authenticated service and Native Messaging for approved bootstrap/wake. This mechanism arose from Chute's practical success, but **is not an immutable contract**. A future agent may replace Python, PyInstaller, Chromium, native messaging, loopback HTTP, Windows registry, file index or UI if required capabilities, security, privacy, identity, interoperability and migration evidence survive.

No Chrome extension may silently install a native executable. Companion installation is explicit and consented. Chrome Web Store compliance is a design gate, not guaranteed approval.

## Preservation and authority model

Records MUST distinguish: explicit owner direction, accepted independently reviewed product requirements, observations of reference systems, inferred needs, historical decisions and agent-proposed options. In particular, a working Chute precedent is not evidence that ATLAS already works. Any executable proof must name the actual artifact, environment, oracle and test result.

Forever Works canonical kinds are **intent, capability, invariant, constraint, dependency, decision, compatibility, migration, implementation, evidence**. Dependency classifications are LOCKED, SEMANTIC, CAPABILITY, TRANSITIONAL, LEGACY, OPTIONAL. Canonical UTF-8 manifest/record JSON and exact references belong in a future compliant inheritance package validated against the upstream standard. The optional ecosystem-composition profile can describe participating clients, providers, state ownership, ports, interactions, authority, and alternative deployments, without modifying the normative core.

This program is the human-readable specification of WHY/WHAT/WHAT MAY CHANGE/HOW WE KNOW. Implementations and acceptance packets are versioned subordinate realizations; programming-language translations are not the definition of reconstruction.

## Product capability domains

**D1 Identity and graph:** immutable logical resource IDs; multiple provider locators; content digests/versions; typed directed relationships; user-defined clusters; catalogs with multiple memberships; tags and free text; identity conflict and merge resolution; migration-safe referential integrity.

**D2 Discovery and experience:** native browser side panel/full-page views, saved search and faceted navigation; configurable file table, tiles, graph, spatial board and conventional hierarchy projections over one coherent model; accessible keyboard navigation and screen-reader semantics; bulk operations with preview/undo where safe.

**D3 Local access:** narrow, auditable, revocable user folder grants; bounded list/read/preview/search/index and explicit mutation verbs; filesystem watcher reconciliation, atomic write/rename when supported, trash/recovery semantics, virtual views inside archives. No arbitrary-shell endpoint.

**D4 Provider ecosystem:** browser bookmarks and captures; Cloudflare R2 through scoped provider credentials; Chute/Redown/Substrate interop when explicitly authorized and technically supported; later adapters through a published versioned capability protocol. No privilege transference by simply declaring a connection.

**D5 Continuity:** native service health/wake/restart; MV3 worker lifecycle; loss of network/provider and filesystem mounts; durable catalog and operation journal; bounded background jobs; idempotent retries; clean uninstallation, recovery and portable export.

**D6 Intelligence:** conventional exact/metadata/full-text search first; optional local semantic search, similarity, proposed links and automatic grouping later. AI-proposed relations are distinguishable from explicit user relations and require review before assuming authority. Indexing scopes and retention are user controlled.

**D7 Portability:** Windows and Linux full companion, Chrome Web Store extension; Android app using Storage Access Framework/document grants and Android background limits. Same intent and resource contract, independently scoped platform capabilities and proof, not pixel equivalence or universal OS access.

**D8 Commercial readiness:** standalone free value, optional paid advanced features, licensing/entitlement without trapping user graph data; opt-in telemetry; privacy disclosures, accessible UX, safe updates, support diagnostics, reproducible packaging and payments only after user value demonstrated.

## Fixed / constrained / fluid

**FIXED subject to accepted scope:** logical identifiers survive moving resources; user-authored metadata/relations and catalog membership survive restarts; only authorized effects touch content; no silent system-wide scans; honest offline/unavailable status; portable export; user-controlled revocation; accepted cross-product capability semantics; recoverable and independently evidenced replacement.

**CONSTRAINED:** search freshness, indexing costs, throughput, preview size, offline cache, recovery latency, storage consistency, destructive-operation undo windows. Each requires explicit measurable envelopes before a result can pass.

**FLUID:** Python, PyInstaller, C/Rust/Zig, Electron/Avalonia/web view/native UI, SQLite/other database, HTTP/native messaging/IPC, process topology, folder layout, index design, cloud SDK, background execution method and platform-specific prompts.

When a platform supplies an intrinsically better mechanism, replace the historical workaround while retaining accepted outcomes. If a prior invariant can no longer be met, create a **new versioned contract with explicit incompatibility and migration**; never label a regression a 'fluid choice.'

## Dependency graph and parallel construction lanes

`F0 contracts+security+data model` is the prerequisite for any privileged effects or public integration. Thereafter concurrent lanes are:

- **L1 Core:** persistence, graph IDs, tags, catalogs, links, revisions, migrations, import/export, deterministic conformance fixtures.
- **L2 Companion:** user grants, safe path/handle resolution, authenticated local API, Windows/Linux packaging, Native Messaging wake/reconnect.
- **L3 Browser:** MV3 panel/full-tab explorer, explicit pairing, search, previews, status/permission UX, keyboard/a11y.
- **L4 Providers:** bookmarks first, local file system, R2 read-only, then writes; archives and ecosystem adapters later.
- **L5 Proof:** threat-model tests, held-out behavior suites, corruption/recovery, offline matrix, real OS/browser/installer integration and provenance digests.
- **L6 Sustainability:** accessibility, observability, migrations, performance, documentation, installer updates, store readiness and commercial validation.

Each lane may proceed concurrently **only against version-pinned contracts**. Integration must pass compatibility/provenance/release gates before a feature is accepted. No lane can replace another lane's failing proof with an assumed PASS.

## Milestone dependency and exit criteria

**M0 — Inheritance baseline.** Define stable record IDs, requirements traceability, threat model, accepted P001 scope, graph data schema and provider/transport API version. Pass: schemas plus positive/negative conformance fixtures and clear unreviewed gaps.

**M1 — Headless graph and portable storage.** Implement real resources, catalogs, tags, notes, typed pairings, multiple locators, persistence, export/import and deterministic tests. Pass: restart and migration preserve all IDs/relations; deliberate corrupt/duplicate/unknown references are handled safely. No extension needed yet.

**M2 — Secure headless companion.** Read-only grant roots, path-safe listing and file metadata/streaming, strong session pairing/authentication, scoped capability tokens, local-only listener, bounded requests, negative localhost/CSRF/origin tests. Pass: real authorized file returned; unrelated path denied; hostile webpage and unpaired client denied. No mutation endpoints yet.

**M3 — Actual MV3 browser client.** Working sidebar and full explorer, pairing/installation guide, resources and graph UI, bookmark capture, file preview, search, tags and pairing. Pass: independently demonstrated user journey; no repeated Chrome picker for previously granted helper scope.

**M4 — Life-cycle hardening and native delivery.** PyInstaller Windows installer with per-user native-host registration, wake/reconnect and uninstall; Linux counterpart with distro-appropriate integration; kill/relaunch/sleep/reboot tests; installer artifact hashing and signatures where feasible. Pass: crashes and Chrome restarts retain graph, permissions appropriately revalidated, reconnect success captured. Chute's specific Windows RC1 commit is reference, not ATLAS's proof.

**M5 — Multi-provider and virtual exploration.** R2 read-only auth and pagination; multi-locator resource/cluster behavior; local file watching and full text; archive traversal guards; offline catalog browsing. Pass: bookmark + local image + R2 object linked and persisted across interruption.

**M6 — Safe writes and richer media.** Per-provider copy/move/rename/delete with precise consent, conflict resolution, trash/undo or irreversible confirmation, atomic journaling, thumbnails, PDF/archive and optional 3D media preview under sandboxed/resource-limited parsing. Pass: negative tests for grant escape, unauthorized bulk action, partial failure and retry duplicate.

**M7 — Interoperation and alternate clients.** Documented capability discovery and grants for Chute, Redown and Substrate; Windows/Linux client implementations and Android SAF-based client. Pass: actual counterpart integration and distinct platform proofs; mock/compile is not sufficient.

**M8 — Release readiness.** Real Chrome Web Store pre-submission policy audit, self-contained installer, signing/reputation plan, privacy/support documentation, upgrade/downgrade/migration verification, load/accessibility/performance and paid-demand experiment. A Store listing only counts after provider confirmation.

**M9 — Reconstitution experiment.** Withhold original implementation from independent cold agent. Provide accepted Forever Works model, contracts, tests and necessary hardware/platform constraints. Request a different language/transport realization of one component. Prove compatibility against held-out tests and document evidence, failures and migration; expand from one component to interacting suite.

## Cross-cutting non-negotiable gates

Security gate: authenticated origin/client binding *and* scoped grants; no wildcard CORS trust, no origin-prefix authorization, DNS rebinding/path traversal/symlink race defense, no network exposure by default, no hidden update installer, no execution of imported untrusted code.

Evidence gate: model/schema valid ≠ code built ≠ behavior passed; record each separately. State PASS only for reproduced tests against exact versioned artifacts. Partial/unknown/failure is a useful, truthful engineering outcome.

Contract gate: every modification declares whether it preserves/revises invariants, introduces new authority or state ownership, breaks compatibility, needs migration, or changes an implementation-only detail.

Resource sovereignty gate: preserve bookmarks and file locators only under user permission, avoid scanning outside grants, revoke secrets cleanly, offer interoperable exports and delete user data on request within defined scope.

Recovery gate: after browser/worker/native restarts, known idempotent retries must not duplicate moves/uploads/deletes. A service may exit; the *capability* must return safely.

## First narrow end-to-end acceptance test

On a Windows test system: user explicitly installs helper, pairs Chrome extension and grants a test folder. User creates catalog 'Aircraft Research', saves a bookmark, indexes one real local image, tags both and creates a 'reference-for' link. Restart browser and kill helper: UI recovers when helper wakes, catalogs and links persist, authorized image preview works; arbitrary ungranted path is denied. All effects produce traceable receipts. This is an acceptance target; not a current feature.

## Handing the project to any future agent

Read the project index; read/validate canonical records and extensions with specified versions; inspect gaps before source code; trace intent→invariant→capability→implementation→evidence; select one milestone and prove it on the actual target; update migrations/history without erasing old decisions; perform a cold reconstitution check when replacing technologies. A generic agent must not need a hidden prompt, one proprietary tool, a second repository, a framework-specific assumption or personal oral history to understand ATLAS.

## Premium product completion requirement

Milestone completion must ultimately satisfy [PREMIUM_EXPLORER_PRODUCT_CONTRACT.md](PREMIUM_EXPLORER_PRODUCT_CONTRACT.md), particularly familiar real file explorer fundamentals: context-menu actions, clipboard, multi-selection, drag/drop, safe copy/move/rename/new-folder/trash, preview, directory navigation, permission-aware provider interoperability and polished accessible interactions. Building only a resource catalog graph is an intermediate step, not the destination.
