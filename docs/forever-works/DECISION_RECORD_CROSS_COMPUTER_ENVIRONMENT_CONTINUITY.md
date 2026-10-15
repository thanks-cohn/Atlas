# Decision record: The same personal environment across computers

**Date:** 2026-10-15. **Status:** owner-directed vision and non-normative architecture proposal. Cross-device restoration, synchronization and WebVM execution are not yet implemented or verified in ATLAS.

## The defining idea

**The user's computer is the personal environment they carry, not any particular physical machine.** A user should be able to move from Windows 10/11 to Garuda Linux, another Linux distribution, Android, a borrowed computer, or a future host; open a compatible browser or client; and resume a recognizable computing environment.

The essential experience is **continuity of meaning and work**: the same catalogs, resource identities, typed links and clusters, browser bookmarks where authorized, notes, preferences, project arrangements, application settings, workflows and portable tools. A machine-specific path, UI library, process, operating-system service or virtual machine may differ. The original user's files and rights do not magically follow them: permissions, available content, runtime capabilities, local installs and machine-specific credentials must be separately established.

This idea arose while considering a family of individually useful, interoperable browser-centered utilities: Chute (file handoff), Redown (remote download/R2), Substrate (creation), ATLAS (premium explorer and relationship catalog), proposed RELAY (orchestration), and possible knowledge, clipboard, launcher and backup modules. Their integration must be stronger than the sum of isolated subscriptions, without requiring all products to be installed or paid for.

## What should appear unchanged

- Logical resource IDs, collections, catalog memberships, tags, free-text metadata, typed relationships and project clusters, independent of provider locators.
- User-chosen organization, saved searches, workspace profiles, preferences, applicable accessibility settings and supported application state.
- Workflows as versioned definitions with clear dependencies, authority requirements, portability and recovery semantics.
- Supported tools and execution profiles, where runtime images or equivalent compatible mechanisms are actually available.
- A recoverable personal history and portable export that remains usable when subscriptions or specific providers disappear.
- A consistent file-explorer conceptual model: multi-selection, right-click copy/cut/paste, move, send-to, searchable folders, previews, recovery and clear failure states.

**Not fixed across computers:** exact pixel layout, absolute drive paths, OS privileges, locally installed executables, native process lifetime, available media codecs, performance, or automatic access to files remaining on another device.

## Concrete example

A user working on Windows creates an 'Aircraft Research' catalog containing a bookmark, local images, an R2 PDF and project notes. They tag resources, define typed relations, save the current workspace and a compatible script environment. On Garuda Linux, restoring the portable snapshot recreates the catalog, identities, relations, project state and accessible R2 references. Windows-specific local paths are marked as unavailable until mapped to granted Linux locations; the browser does not fabricate local content. A WebVM or other approved runner might provide the script environment. On Android, the same catalog appears, while file access relies on Android's Storage Access Framework and background execution is appropriately constrained.

This is a **target acceptance scenario**, not an implemented ATLAS feature.

## The proposed Portable Environment Manifest

A versioned product-level snapshot or manifest (distinct from Forever Works' canonical model and Any-Shape's job specifications) should describe: environment ID/version, state snapshot, app/module IDs and pinned compatible versions, saved catalog references, view layouts, preferences, workspace profiles, workflow IDs, execution/dependency profiles, storage/provider descriptors, restore policy, sync and backup status, device overlays, capability requirements and explicit unknowns. It must **never transport device permission grants, raw credentials or uncontrolled executable authority as if they were portable user preferences**.

Restoration should be staged and inspectable: validate snapshot provenance/integrity; recover portable metadata first; independently negotiate installed components, storage connectivity and permissible runtimes; request fresh grants when needed; report READY, DEGRADED, NEEDS_INSTALL, NEEDS_GRANT, OFFLINE, UNSUPPORTED or FAILED per component; retain unmapped data for later recovery. No failed optional component should erase the rest of the environment.

Potential replication choices include local encrypted export/import, user-owned R2 backups, end-to-end encrypted sync, self-hosted sync and peer-to-peer modes. These are alternatives to research, not decisions about mandatory cloud accounts. Design for conflict detection, versioned migrations and provable restoration before claiming seamless multi-device continuity.

## WebVM and execution portability

WebVM/CheerpX-style Linux userspace in the browser could help carry compatible Linux tools, project dependencies, scripts, format converters and an execution profile from host to host. It is **an optional execution substrate, not the identity of the user's environment**. Alternatives include native helpers, direct WASM, browser JavaScript, platform-specific apps and explicitly authorized remote execution. Browser VM storage is not automatic host filesystem access and cannot guarantee execution while a browser is closed. License/distribution, MV3 policy, Android constraints and practical performance (especially 4 GB devices) require separate verification.

The proposed invariant is an operation's authorized, observable meaning and recoverable state. The language, operating system, VM, bundler, transport, helper topology and implementation framework remain fluid where accepted compatibility is proven.

## Why Chute matters

The Chute project provides an important practical precedent: an extension interface communicating with a separately installed native companion, with wake/reconnect behavior after disconnection or process termination. The owner reports long-running operation and recovery across multiple Windows and Linux machines. Preserve that **purpose and usability**, rather than treating the historical Python/Native Messaging/localhost implementation as eternal.

For ATLAS, an explicitly user-installed, permission-controlled helper enables repeated access to previously authorized roots without Chrome prompting for every file. PyInstaller bundles a Python runtime; it does not allow silent executable installation from Chrome Web Store. This design must improve upon any weaker origin-only local HTTP authorization by using exact client binding, authentication, scoped grants and independent negative tests.

## What was actually built by 2026-10-15

The latest recorded implementation commit `f1e873ad4` introduced a Linux development file explorer with an MV3 extension source, authenticated, scoped Python loopback companion, Linux native bootstrap/wake prototype, real filesystem copy/move/rename/trash operations, persistent catalog/relationship graph, and tests. The engineering handoff records 54 passing Python tests, nine worker tests, real CLI/HTTP proof and browser DOM workflows through a **test-only transport bridge**. These are Codex-reported evidence, not independent execution in this decision-record session.

Actual installed Chrome MV3/Native Messaging end-to-end runtime remained **unverified** because the test Chromium was policy-blocked. Windows/PyInstaller distributables, R2 live provider, Android, secure cross-computer sync, full environment restoration, WebVM execution and Chrome Web Store acceptance remained **not implemented or not proven**. Forever Works canonical structural validation was reported against a pinned upstream version; it does not establish feature parity.

## Sequential and concurrent research milestones

1. **Preserve today's working slice:** run reproducible regression tests, independently verify real Chrome extension-to-native helper behavior on an authorized machine and document current Linux security, recovery and crash consistency gaps.
2. **Define portable-state contracts:** design an explicit, versioned environment manifest with schema, accepted ownership rules, export/import, conflict-resolution policy and conformance fixtures. Keep it separate from Forever Works canonical records.
3. **Demonstrate transfer between two browser profiles on one machine:** export a catalog/workspace, import and reconstruct it without copying secret grants or changing resource IDs. Show truthful missing-resource states.
4. **Prove cross-machine restoration:** move the snapshot between Windows and Garuda Linux. Keep workspace meaning while requiring separate machine-appropriate native installations and local grants.
5. **Broaden execution portability:** trial WebVM/WASM/native runners with identical accepted tasks and independently measured behavior, memory, startup, data integrity and offline limitations.
6. **Integrate other products:** define narrow, versioned capability/event contracts for Chute, Redown, Substrate and RELAY, with explicit opt-in. Restore workflows without borrowing permissions from previous machines.
7. **Exercise Android and borrowed-device cases:** compare deliberately scoped capabilities, secret retention, ephemeral sessions and honest degraded modes.
8. **Prove long-horizon rebuildability:** package Forever Works inheritance and independently reconstruct one environment component in a different language or runtime using held-out tests.

Parallel work may cover browser UI, catalog graph, security reviews, runtime research, backup formats and integration contracts **after** agreeing on stable reference identities and the portable-state schema. Do not substitute many in-progress feature claims for an end-to-end restore that has actually passed.

## Forever Works preservation mapping

**Intent:** users can resume their personal digital workspace on a new compatible machine without rebuilding their life from scratch.

**Fixed invariants:** persistent meaning, stable reference identity, transparent availability, portable user data, correct migration, bounded and independently reauthorized privilege, safe recovery.

**Constrained variables:** latency, search freshness, offline cache, performance, presentation, number of concurrently active runners; specify testable profile-dependent bounds.

**Fluid mechanisms:** WebVM vs WASM vs native, Chrome vs other browser, Python vs another language, SQLite vs other storage, localhost vs another transport, operating-system-specific installation and view layout.

**Evidence requirements:** per-machine/platform/browser versions, actual restore before/after snapshots and hashes, negative permission tests, operation receipts, and independent tests of any runtime substitution. Mark unmet work UNKNOWN/NOT_RUN.

**Long-horizon principle:** Preserve the person's environment, not the host machine. Preserve the purpose, not the workaround. Preserve essential contracts, not today's runtime.
