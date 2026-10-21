# Current direction — the transposable Object

Date: 2026-10-20 (owner's local date).
Status: explicit owner direction for priorities; technical contracts below are proposed design requirements, not implemented or verified capabilities.

## Focal principle: create once, transpose and reuse

**The transposable Object is the focal point of Atlas's current stage.** An Object is an independently addressable, reusable unit of content and meaning, not a disposable rendering tied to a board, editor, storage provider or export format. Cards, notes, Article Objects, images, documents, Galleries, Collections and compositions retain their appropriate identity, lineage, original assets, sources and relationships when moved, referenced, nested, extracted or presented elsewhere.

Atlas aims to be a single workspace for modifying supported content, moving, bulk sending/transferring, organizing and curating authorized local and remote resources. Local and remote should feel continuous in the interface. Real permissions, network availability, transfer progress, provider capabilities and failures must remain explicit. Logical rearrangement, referencing, copying bytes and moving bytes are different operations; remote moves verify destination integrity before any authorized source removal.

## Priority decision

Atlas currently prioritizes collecting, preserving, organizing and curating reusable Objects: Cards, bookmarks, notes, assets, Collections, Galleries, Pinboards and compositions such as collages. The full website/page editor and publishing builder are deferred to a later phase. The current foundation also includes interoperable document workflows: PDF, Word/DOCX, plain text, HTML and other formats selected for practical interoperability, implemented incrementally through declared capabilities. Earlier editor proposals remain historical/future design material; they do not override this sequencing.

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

## Interoperable document foundation and gradual composition

Owner direction: build reusable Objects and a focused document/article composition path gradually, rather than introducing Puck as the foundation for this stage. This is a direction decision, not a completed Puck removal or permission to delete existing working features without replacement proof.

A student should be able to gather sources and assets, write and order sections, create an Article Object, and reuse that same source as a website-ready article or paginated PDF. A focused composer can begin with text, images, citations, section ordering and a polished template; a general website builder remains later work.

Format targets and boundaries:
- Plain text and Markdown: portable textual content, with explicit encoding and formatting limits.
- HTML/CSS with optional JavaScript: independently useful web presentation and reusable templates.
- PDF: original-document preservation, viewing/organization, and paginated export; arbitrary PDF editing and lossless reverse conversion are separate capabilities requiring evidence.
- Word/DOCX: preserve originals and progressively support documented import/export/editing subsets through separate adapters. Complex layout, comments, tracked changes, equations and embedded content must have declared fidelity or loss reports; universal Word compatibility is not assumed.
- Versioned Atlas JSON plus assets: preserve Object structure, identity/lineage, relationships and presentation intent independently of any output engine. File-format interoperability and full Atlas semantic round trips are distinct acceptance gates.

For every format, separately declare preserve, preview, import, edit, export and round-trip support. Unsupported conversion must not destroy original bytes or silently discard content. Allow bulk operations over supported local/remote resources with recoverable per-item results.

Paged.js and Vivliostyle are candidate HTML/CSS pagination/typesetting bridges. Evaluate and choose an engine behind a small replaceable adapter; do not require both. Atlas provides the editing UI and semantic Objects. These engines can reuse the same HTML/CSS-oriented source for paginated presentation/PDF; they do not automatically provide DOCX conversion or universal bidirectional PDF editing. Preserve a shared semantic source with web and print style variants rather than promise identical layout in every medium.

**Build once, reuse later:** adding a future editor, template, host or output adapter should consume existing Objects and composition contracts instead of forcing users to rebuild their content. Keep semantic source, editor controls, storage adapters and renderers separate.

## HTML/CSS/JavaScript and PDF bridge

CSS print styles and CSS Paged Media describe page size, margins and pagination. Browser Save as PDF is a possible first export path. A later automated adapter can use Chromium through Playwright page.pdf(), or Electron webContents.printToPDF() if a separately justified Electron host is selected. Electron is an option, not an approved migration.

PDF.js is a web PDF viewing/rendering option; it is not an HTML-to-PDF conversion engine or a lossless PDF-to-Atlas editor. Full PDF editing is a separate future scope.

Sources:
- https://pagedjs.org/en/documentation/2-getting-started-with-paged.js/
- https://vivliostyle.org/
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
- Exercise supported PDF/DOCX/text/HTML adapters against declared fidelity fixtures; retain originals, report losses, and reuse one Article Object for web and paginated output without rebuilding its source.
- Bulk-transfer a mixed local/remote selection with partial failures; verify per-item receipts, destination integrity and preservation of original sources on failed moves.
- Export/import a complete package in a fresh environment and inspect it independently without Atlas. Verify declared lossiness of each export target.
- Render representative nested collections and galleries at narrow/desktop sizes. For PDF, inspect pagination, selectable text, images, fonts, links and overflow; do not infer accessible PDF conformance without separate proof.

Documentation-only decision: no schema migration, persistence change, hierarchy runtime, R2 backup, PDF export or editor implementation is delivered by this record. Next implementation should inventory existing durable gallery/graph adapters, then propose one versioned hierarchy-and-persistence slice with explicit migration and recovery evidence.


## IMPORTANT — preservation and future AI partnership

The transposable Object also serves long-term preservation: capture permitted content, assets, source context, versions and relationships from the beginning. The owner wants eventual permission-based ChatGPT access to selected collections, with optional structured-data contributions kept separate from assistance consent, and proposes a $2 price split equally with a distribution partner. See [the important preservation, AI access and partnership record](IMPORTANT_WHOLE_OBJECT_PRESERVATION_AND_AI_PARTNERSHIP.md) for the complete owner vision, economics, boundaries and verification plan. No partnership, sharing capability or training program is established; this future opportunity does not supersede current durable/interoperable Object foundation work.


## Current execution sequence — owner clarification

The [Current Priority Checklist](CURRENT_PRIORITY_CHECKLIST.md) governs near-term sequencing: qualify intuitive standardized local/remote exploration first; then formalize Object structure and qualify aesthetic Dashboard hierarchy arrangement/navigation and Save as Atlas Object; establish the stable public API after the interaction surface is proven. Transposability, durable external persistence and individual/whole export remain obligations throughout. Existing Dashboard work is preserved. Focused document/PDF adapters build on this foundation rather than taking priority over it. Pinboards/bookmarks/tags/notes are the enjoyable entry point; students and Chinese/Korean audiences are explicit experience-research priorities.
