# Proposal — The Portable Personal Computing Environment
## User continuity across machines, operating systems, browsers and execution substrates

**Status:** non-normative research / owner-directed product vision; proposals are **not** claims of implemented ATLAS functionality. **Date:** 2026-10-15. **Applies to:** ATLAS and the broader Chute, Redown, Substrate, proposed RELAY and potential future workspace family. **Compatible principle:** Forever Works Standard 0.1 — contractual fixity, implementation fluidity. This proposal adds no mandatory fields to the normative standard.

## The unifying vision

**The user's computer should be the environment they carry, not merely the machine they sit in front of.** Open a browser on a Windows PC, Garuda Linux laptop, Android device, or future host and recover a recognizable, dependable *personal computing environment*: projects, explorer, bookmarks, resources, tags, relationships, notes, session layouts, applications, configured compatible tools, workflows and working preferences. Where the host cannot support an operation, preserve intent and state, present truthful availability and offer an authorized alternative. Do not copy machine-specific privileges.

The aim is more ambitious than a cloud drive, a browser extension collection or running Linux in a webpage. It is to preserve **personal-environment continuity** even when its execution mechanisms, operating systems, processor architectures, technologies and underlying machines change.

**Primary invariant:** given an approved portable environment snapshot and appropriate authentication, compatible hosts restore the same *meaningful user state and supported outcomes*, despite variable underlying implementation. Identical hardware access, pixels, performance, credentials or OS privileges are **not** promised.

## Proposed layers and responsibilities

1. **Portable Environment Manifest (PEM):** versioned, portable, human-readable declaration of apps/modules and compatible versions, resource identities, catalogs, layout and preferences, workspace/project state, required capabilities, runtime profiles, automation references, dependency pins, restore policies and explicit unresolved device requirements. Describes *desired environment* without embedding machine secrets.
2. **ATLAS resource and relationship plane:** logical identities independent of file locations, bookmarks, local and R2/cloud locators, metadata, search and full explorer actions; relationships among objects, tags, typed clusters and user-chosen catalogs.
3. **Common capability and interoperability protocol:** advertise/resolve available actions, messages, event topics, versioned commands, authority scopes, storage ownership, errors and status; do not equate capability discovery with permission authorization.
4. **RELAY (proposed) orchestration:** user-authorized triggers, schedules, multi-step workflows, recoverable jobs, retries, conditional routing, cross-application actions; no universal privileged backdoor or mandatory central controller.
5. **Execution substrate adapters:** browser JavaScript, WebAssembly, WebVM/CheerpX or alternatives, native Windows/Linux helpers, Android platform services, optional remote/cloud compute. Execution choice may depend on permission, locality, workload, cost, performance and availability.
6. **Durable state and sync/backup:** portable, encrypted where warranted, versioned personal environment exports and backups; optional trusted or self-hosted sync; per-device state separation and conflict resolution; browser caches alone are not authoritative storage.
7. **Client shells:** browser extension side panel, full-tab workspace, PWA where feasible, optional desktop app/shell, mobile application. Adapt presentation responsively without losing discoverability, keyboard navigation, accessibility or user meaning.
8. **Forever Works inheritance:** document WHY, WHAT must survive, what is constrained, what may change, compatibility contracts, migrations, provenance and independent proof. Any-Shape may consume those accepted contracts to derive alternative implementations; no AI agent/tool vendor becomes part of the product's canonical meaning.

## WebVM's valuable but bounded role

WebVM/CheerpX-style Linux userspace in the browser is a **candidate portable execution substrate**, especially for compatible command-line tools, developer environments, file format converters, research toolchains, safe sandboxed workflows and reproducible dependencies. It can reduce dependence on the host OS for *selected execution tasks*, but it is not automatic permission to use the host's actual filesystem, install native services, make unrestricted network connections or run continuously while the browser is closed.

Questions requiring actual experiments: initial and warm startup, memory and CPU use on 4 GB machines, filesystem persistence and export, supported syscalls/toolchains, networking, background lifecycle, VM snapshots, browser storage eviction, security isolation and mobile suitability. WebVM/CheerpX availability and licensing, redistribution rights, Chrome Web Store MV3 remote-code restrictions and bundled runtime obligations must be checked before adopting or shipping. A separately hosted web application may be preferable to shipping VM code inside a Store extension.

**Never make WebVM mandatory:** WASM-only, native-helper-only, remote-execution or non-virtualized browser versions must remain possible. When WebVM is unavailable, degrade clearly or select another approved execution adapter.

## Potential user experiences and product opportunities

The following are **possibilities, not committed features**:

### Personal environment and workspace

- **Restore My Environment:** open a new machine, authenticate, select a versioned snapshot, restore workspace layout, projects, app preferences, bookmarks, catalogs, virtual environment settings and workflows; ask separately for local installs and grants.
- **Portable workspaces:** named profiles for research, design, development, school or client projects; carry tab groups, window layouts, notes, resources, allowed toolchains and view presets.
- **Device-specific overlays:** a shared environment with safe local-only overrides for screen size, filesystem mounts, keyboard, GPU and accessibility; don't overwrite home state with an incompatible machine configuration.
- **Time-travel snapshots and recovery:** rollback selected environment settings and metadata, inspect diffs, export a human-readable recovery bundle and avoid destructive sync loops.
- **Work on a borrowed computer:** ephemeral session; access remote and sandboxed state without automatically copying secrets or sensitive local artifacts onto the host; remote sign-out and local cleanup within supported trust limits.
- **Workspace handoff:** continue a project from Windows to Linux or Android with consistent catalog, notes and permitted workflows; clearly report unavailable device-specific operations.
- **Portable developer workstation:** version-pinned tools and Linux-compatible utilities in WebVM or alternative sandbox, with project templates, terminal and reproducible build tasks.
- **Browser desktop/shell:** optional windowed workspace experience, cross-application drag/drop, universal navigation, command bar and desktop-like organization that never requires a single giant monolith.

### Explorer and information relationships

- **Universal file explorer:** premium keyboard/mouse/right-click copy, paste, cut, move, send-to, rename, multi-selection, previews, archives and provider-aware permissions through ATLAS/native helper.
- **Universal catalogs:** pair a bookmark, local photos, R2 PDFs, ZIP contents, code files and app artifacts in one named catalog, independent of physical placement.
- **Resource graph:** typed 'derived from', 'reference for', 'same project' and provenance relationships; graph view, folder-like view, visual boards and saved smart searches over the same identifiers.
- **Unified search:** metadata and full-text where consented, optional embeddings/local semantic search, related-resource suggestions and cross-provider indexing with offline truth.
- **Universal clipboard/snippets:** optional ECHO component for text, media, file references, transformations and templates; synchronize deliberately, never leak clipboard content invisibly.
- **Local/cloud bridge:** connect Chute's quick handoff, Redown's R2 workflow, Substrate's creation tools and ATLAS's organization in one user-controlled journey.
- **Smart storage:** content-addressed deduplication, versions, alternate locators, selective cache/pinning, offline availability and preservation of resource identity during moves.

### Orchestration, computing and automation

- **RELAY workflows:** 'on bookmark, capture context; index attachments; save to authorized R2; label catalog; notify mobile', with clear prompts and audit receipts.
- **Execution mobility:** choose WASM, WebVM, native, mobile or remote engines behind one capability contract and verify results rather than assuming interchangeability.
- **Sandboxed tool execution:** run compatible Linux converters, scripts, build utilities and search/index jobs in a contained portable environment with explicitly limited mounts and resources.
- **Automation marketplace and recipes:** portable, signed/versioned workflows that declare permissions and required services before execution.
- **Self-healing continuity:** recover MV3 workers and native helpers after sleep/restart as Chute inspired; resume idempotent jobs with clear error/status semantics.
- **Agent-ready interactions:** human- and agent-readable capability descriptions, explainable effects and independently reproducible proofs; no unbounded assistant authority.
- **Local-first AI assistance:** optional indexing, classification, file repair proposals, suggested resource pairings and task drafting, with provenance and opt-in cloud use.

### Reliability, privacy and commercial possibilities

- **Portable backup/VAULT:** encrypted snapshots, restore drills, integrity digests, version history, optional user-owned R2 storage and clear retention controls.
- **End-to-end privacy model:** workspace data and secrets segmented by device, profile and grant; granular revocation; no stealth sync, telemetry or host access.
- **Team workspaces:** opt-in sharing of catalogs or workflows, capability-scoped collaboration, organization roles, audit events and revision conflicts; no accidental transfer of private local paths/credentials.
- **Modular suite licensing:** each product useful individually; discounted bundle unlocks higher-order workflows. Subscription status must not prevent export or access to user-owned basic data.
- **Interoperability SDK:** third-party tools may register safe adapters for files, cloud, editors, archives, calendars and other resources, with versioned permissions and schema conformance.
- **Migration/reconstitution services:** Any-Shape and Forever Works may enable cross-language, cross-OS adaptation of components while preserving accepted capabilities and proof.
- **Accessibility profiles:** transferable visual scaling, keyboard maps, reduced-motion, themes and screen-reader preferences that adapt to available host capabilities.

## Contractual fixity versus implementation fluidity

| Must endure within an accepted environment profile | May differ or be replaced |
| --- | --- |
| User owns intelligible workspace, catalog, relationship and preference data; portable import/export | JSON layout, database, sync engine, storage provider |
| Stable logical resource IDs and preserved user-authored connections | Absolute paths, object keys, cache layout, filesystem backend |
| Honest capabilities, permission boundaries and revocable grants | Browser API, native messaging, loopback IPC, broker implementation |
| Reproducible restore with explicit unsupported capability report | WebVM, native runtime, JavaScript/WASM, process topology |
| Safe user-authorized effects, byte integrity, recoverable operations | Programming language, helper packaging, OS integration |
| Compatible user-visible behavior at accepted scope | Different visuals, UI toolkit, host windowing/screen size |
| Provenance and independent verification for migrated/reimplemented features | Original source code, compiler, VM technology, agent vendor |

**Environment profiles are necessary:** distinguish full desktop access, browser-only restricted access, offline mode, shared borrowed-machine profile, Android SAF profile, WebVM-ready profile. A manifest documents target capabilities; the host reports what's actually available. Invariant scope must be explicit so 'runs everywhere' does not imply 'has every OS permission everywhere.'

## Portable Environment Manifest: proposed schema outline

The PEM is a **new, versioned product-level format**, not the normative Forever Works manifest and not Any-Shape's `specifications.json`.

Proposed top-level domains (subject to later schema and conformance):
`environmentVersion`, `environmentId`, `snapshotId`, `createdAt`, `owner` (opaque reference), `applications`, `capabilities`, `resourceCatalogs`, `workspaceLayouts`, `preferences`, `executionProfiles`, `automationReferences`, `stateObjects`, `dependencyPins`, `backupPolicy`, `syncPolicy`, `restoreRequirements`, `platformOverlays`, `extensions`.

Each component requires owner/authority, immutable or digest-pinned version where reproducibility matters, device-specific secrets handled **out of band**, explicit optional/required features, fallback behavior, data portability and migration requirements. Avoid embedding sensitive credentials, silently portable permissions, unsupported scripts or untrusted executable payloads in a manifest. Use import preview and signed/hashing receipts for snapshot integrity.

Suggested restore states: `READY`, `AVAILABLE_DEGRADED`, `NEEDS_INSTALL`, `NEEDS_GRANT`, `NEEDS_AUTH`, `OFFLINE`, `UNSUPPORTED`, `INCOMPATIBLE_VERSION`, `CONFLICT`, `FAILED`. Per-component restoration is independent so one failed adapter does not make the entire environment vanish.

## High-value acceptance experiments

1. **Continuity baseline:** create workspace with bookmarks, ATLAS catalog, local-file metadata locator, R2 object locator, tags, relations, view preferences and a RELAY workflow definition. Export snapshot; import on another browser profile and recover identities without copying machine credentials.
2. **Cross-OS test:** restore on Windows 10/11 and Garuda Linux, then Android. Compare catalog semantics, preferences and supported workflows. Mark actual permission differences, not fabricated parity.
3. **Restricted-host test:** browser-only machine without helper restores metadata and remote resources; local-native effects display `NEEDS_INSTALL` or `NEEDS_GRANT` with explicit next actions and no stealth bypass.
4. **WebVM test:** execute one compatible real tool from a pinned Linux environment, preserve inputs/outputs and repeat on a different host. Benchmark memory/startup/network constraints and document exceptions.
5. **Recovery:** suspend/restart Chrome, terminate helper, sleep/reboot machines and re-open environment without losing user-authored state or duplicating destructive actions; quantify performance.
6. **Privacy:** stolen snapshot, malicious webpage and wrong-device credential attempts do not grant machine access or leak storage secrets.
7. **Migration:** replace VM engine, language or helper transport while preserving externally accepted semantics and independently verified results.
8. **Cold-agent reconstruction:** an unfamiliar agent receives the Forever Works inheritance, portable contract, independent fixtures and held-out tests; reconstructs one component using a different implementation, then verifies multi-component compatibility.

## Suggested staged research and implementation order

**Stage A — define meaning before software:** classify fixed/constrained/fluid obligations; derive threat model and versioned PEM draft; define provider-neutral capability and resource identity contracts; identify authoritative data, device overlays and snapshot restore boundaries.

**Stage B — ATLAS core first:** deliver actual Chrome + helper premium explorer, graph, tagging, catalogs and provider-separated permissions under existing roadmap. Treat this as the tangible daily-use and revenue anchor.

**Stage C — portable snapshots:** implement export/import of user-controlled environment state and manifest, with deterministic migration and browser-only degraded restore, independent of WebVM.

**Stage D — optional execution sandbox:** compare WASM-only versus WebVM/CheerpX and alternatives using representative workload and actual 4 GB RAM tests; document licensing, MV3, security and Android constraints.

**Stage E — RELAY and capability federation:** design discoverable authorized operations, event journal and retry semantics; integrate Chute, Redown and Substrate through safe opt-in adapters.

**Stage F — multi-host proof and commercialization:** Windows, Linux and Android conformance; Chute-like recovery; premium UX, backup, privacy, billing and bundle integration, with customer validation.

**Stage G — long-horizon reconstitution:** package a complete Forever Works inheritance corpus and ask independent cold agents to reimplement key parts using a different runtime, with retained test evidence.

Workstreams may proceed concurrently after the shared contracts are accepted. Maintain per-platform, per-feature truth tables and explicit failure/unknown states. Avoid building a mandatory monolithic VM or backend.

## Major open questions

- Is cross-device state self-hosted, E2EE cloud synchronized, peer-to-peer, export/import only, or several user-selectable modes?
- What is a dependable portable app identity and state schema across browser extensions, mobile apps, native apps and virtualized Linux utilities?
- How much of WebVM can be shipped/distributed commercially, and what license and Chrome Store constraints apply at the moment of packaging?
- How should the platform handle semantic conflicts between concurrent device edits without silently overwriting user work?
- Which workflows require browser to stay open versus native or remote durable runners?
- What trust and identity model allows a borrowed machine to restore a profile without retaining secrets?
- How much resource indexing/search belongs in ATLAS versus specialized modules? What are clear feature and pricing boundaries?
- Which runtime packages must be available offline, and how much memory/startup latency is acceptable on a 4 GB host?
- How to guarantee meaningful portability without requiring exact OS-native filesystem behavior on Android or locked-down machines?
- Who owns the protocol version policy and independent conformance fixtures while keeping applications separately useful?

## Forever Works relationship

This proposal is intended to become accepted `intent`, `capability`, `invariant`, `constraint`, `decision`, `compatibility` and `migration` records **only after review and testable scoping**. The normative Forever Works corpus does not yet guarantee this environment exists. The optional ecosystem-composition profile can describe ATLAS/RELAY/Substrate/Chute/Redown plus clients, providers, multiple execution runners, events and distributed state while preserving alternate topologies. Any-Shape can subsequently generate or port compatible implementations; none of these projects should be treated as an unreviewed universal authority.

**Closing design axiom:** **Preserve the person's environment, not the host machine. Preserve its purpose, not one workaround. Preserve its contracts, not one language or runtime.**
