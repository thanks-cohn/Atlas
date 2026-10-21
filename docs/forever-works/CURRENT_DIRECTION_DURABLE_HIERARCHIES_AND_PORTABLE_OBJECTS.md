# Current direction — durable hierarchies and portable Atlas Objects

Date: 2026-10-20 (owner's local date).
Status: explicit owner direction for priorities; technical contracts below are proposed design requirements, not implemented or verified capabilities.

## Priority decision

Atlas currently prioritizes collecting, preserving, organizing and curating reusable Objects: Cards, bookmarks, notes, assets, Collections, Galleries, Pinboards and compositions such as collages. The full website/page editor and publishing builder are deferred to a later phase. Earlier editor proposals remain historical/future design material; they do not override this sequencing.

Atlas is a portable collection and curation workspace with browser integration, rather than a product whose identity depends on being a Chrome extension. Existing extension and authenticated native-companion delivery remain in place; this decision does not authorize a framework rewrite or select a new desktop shell. Do not disrupt unrelated Workspace Dashboard work.

## Owner purpose: the transposable internet

Users can collect supported webpage assets, preserve sources, organize them into deeply nested structures and carry selected Objects or whole branches into another compatible context. Reuse must preserve meaning, identity, relationships and intentional visual quality. A user should be able to build an extensive labyrinth of collections without Atlas losing track of its contents.

Collection creation and curation need not wait for the web editor. Today's Objects should become tomorrow's reusable inputs for galleries, collages, documents, presentations and websites.

## Proposed hierarchy and identity contract

- Give each Object a stable ID independent of title, browser database key or local/R2 path.
- Separate Object identity, ordered placements, containment, references, asset locators and presentation. Moving a branch preserves descendants, annotations, provenance and relationships.
- Support nested Collections and permitted typed Objects. Define compatible parent/child rules; arbitrary nesting does not mean every Object kind can contain every other kind.
- Containment must remain acyclic. Reject self-parenting and placement beneath descendants in the authoritative service, including concurrent changes. Cross-links may connect any permitted related Objects without becoming containment.
- Referencing an Object in multiple collections must not silently duplicate it. An independent copy is explicit and receives a new identity with provenance.
- Preserve Card-local Section ownership: reusing a Section name never merges, copies or synchronizes another Card's contents.
- Provide breadcrumbs, expandable navigation, global search and show-location/all-placements actions. Use bounded/lazy rendering and iterative traversal for deep structures; declare tested limits instead of promising infinite depth.
- Extend the existing resource graph and migrate the current flat Collection contract. Do not create a competing shadow hierarchy.

## Durable persistence, cache and backup

Browser IndexedDB and chrome.storage must not be the sole authoritative copy of durable work. Browser eviction, clearing, profile loss or extension removal must be recoverable by reconnecting to an authorized external library and rebuilding derived indexes/caches.

Proposed durable providers are ordinary companion-managed local files, optional R2, or both. Local database/index choices remain replaceable, but portable manifests and assets must make reconstruction possible. A local-only library survives browser clearing, not disk loss; remote availability and backups have separate failure boundaries.

Persist metadata, ordered hierarchy/placements, notes, tags, source information, asset bytes and presentation settings as appropriate. References alone are not preserved asset bytes. Show whether an asset is externally referenced, browser-only, pending, saved locally or verified remotely. Never show durable success before the chosen provider acknowledges the committed revision.

Use atomic/recoverable writes, versioned migrations, operation receipts and explicit conflict behavior. R2 and local metadata/asset updates need a recoverable commit protocol; an upload acknowledgment alone is not proof that a whole library is consistent.

Backups are separate from synchronization: retain versioned snapshots and recoverable deletions so a mistaken change is not merely replicated everywhere. Verify asset integrity and manifest completeness, demonstrate restoration, and never delete local content for remote offload before the required verified recovery and explicit cleanup authorization.

Grants and credentials remain host-specific, private and reauthorized where needed. Portable exports do not carry live secrets.

## Format direction — proposal, not a newly established public standard

Keep semantic source data separate from renderers:
1. Versioned documented JSON plus JSON Schema for Objects, hierarchy, placements, relationships, provenance and presentation intent.
2. Original assets in an ordinary directory or ZIP with a manifest, relative references and checksums. Include schema version, missing-asset declarations, migration rules and explicit import ID/conflict handling.
3. HTML/CSS/JavaScript as the interoperable interactive presentation layer, with useful independent viewing where supported and authorized host operations behind adapters.
4. PDF as a paginated export of selected content, preserving the editable Atlas source package separately.

JSON, HTML, CSS and ZIP are established building blocks; the Atlas-specific schema/package contract still needs design, documentation, versioning and independent compatibility tests. Do not claim that arbitrary applications understand Atlas relationships simply because they can read JSON or HTML.

PDF does not serve as the canonical editable graph or retain arbitrary web interactions. Round-trip PDF import is not assumed to reconstruct original Objects, hierarchy, layouts or JavaScript behavior.

## HTML/CSS/JavaScript and PDF bridge

CSS print styles and CSS Paged Media describe page size, margins and pagination. Browser Save as PDF is a possible first export path. A later automated adapter can use Chromium through Playwright page.pdf(), or Electron webContents.printToPDF() if a separately justified Electron host is selected. Electron is an option, not an approved migration.

PDF.js is a web PDF viewing/rendering option; it is not an HTML-to-PDF conversion engine or a lossless PDF-to-Atlas editor. Full PDF editing is a separate future scope.

Sources:
- https://www.w3.org/TR/css-page-3/
- https://playwright.dev/docs/api/class-page#page-pdf
- https://www.electronjs.org/docs/latest/api/web-contents#contentsprinttopdfoptions
- https://mozilla.github.io/pdf.js/

## Proposed verification gates and continuation

Before claiming delivery:
- Move and reload deeply nested branches; preserve IDs, order, notes, assets, links and every placement. Reject cycles and test concurrent edits.
- Reuse names and references without accidental merging or duplication; verify explicit copy and deletion semantics.
- Clear browser storage/reinstall against a disposable fixture, reconnect/re-pair and restore the external committed library with matching manifests and asset hashes.
- Interrupt saves and provider uploads; recover the last valid revision, expose pending work and resolve conflicts without silent loss.
- Restore a prior snapshot after deletion; test missing/corrupt assets and unavailable R2 honestly.
- Export/import a complete package in a fresh environment and inspect it independently without Atlas. Verify declared lossiness of each export target.
- Render representative nested collections and galleries at narrow/desktop sizes. For PDF, inspect pagination, selectable text, images, fonts, links and overflow; do not infer accessible PDF conformance without separate proof.

Documentation-only decision: no schema migration, persistence change, hierarchy runtime, R2 backup, PDF export or editor implementation is delivered by this record. Next implementation should inventory existing durable gallery/graph adapters, then propose one versioned hierarchy-and-persistence slice with explicit migration and recovery evidence.
