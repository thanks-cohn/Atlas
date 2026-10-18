# ATLAS premium file explorer — enduring product contract

**Status:** explicit owner-requested product target; NOT an implemented feature or approval guarantee. **Reference:** Forever Works Standard 0.1. **Audience:** every cold agent and developer, independently of implementation framework.

## Destination

Build a **premium-grade, full-featured, highly polished file explorer as a Chrome Web Store-compatible Manifest V3 extension**, supported by a separately, explicitly installed native companion. The core value is not merely visualizing tags: ATLAS must let users **actually browse, manage, transfer, preview, organize and retrieve** real files with the fluency of a desktop file manager, including multiple authorized local drives/folders, Cloudflare R2 and later providers, in a single consistent interface. Chrome's file-picker should not appear for every operation after relevant native helper grants are obtained. Do not misstate privilege: Chrome does not silently install native software, and a helper only accesses expressly granted roots.

Treat familiar file-explorer ergonomics as **acceptance obligations**, not optional decorations. Favor genuine, reliably functioning features over interface mockups.

## P0 — everyday file management

1. Directory tree/sidebar; multiple granted roots; folders, parent/home, breadcrumbs and editable location display; back/forward history, refresh, search and clear empty/error/loading states.
2. Detailed list/table and rich thumbnail/grid; sortable and optionally resizable columns (name, size, type, modified, location/provider/status), folders-first preferences, responsive density, virtualization/pagination for large directories and persistent view configuration.
3. Mouse and keyboard selection: click, Ctrl/Shift ranges, Ctrl+A, keyboard arrows, Enter, Backspace, Escape, type-to-find; multi-selection correctly survives context menu operations.
4. **Native-feeling right-click menus** for items, selections and blank space: Open, Open With/Preview where supported, Copy, Cut, Paste, Rename, Duplicate, New Folder, Move To, Copy To, Send To, Download/Export, Delete/Trash, Properties, Refresh, Select All. Context-sensitive commands must be hidden/disabled with useful reasons for unsupported provider/scope states.
5. Real copy/cut/paste across granted folders and explorer views, Ctrl+C/X/V, explicit conflict-resolution dialog (replace, rename, skip, apply to all), multi-selection, clipboard expiration and non-destructive cancellation. Integrate with OS clipboard only where feasible and permission-safe; internal clipboard semantics must work independently.
6. Drag and drop between directories and supported providers, with clear copy/move/link intent, destination preview, undo/recovery where supported, and safeguards against unintended move across provider semantics.
7. Rename, new directory, multi-file copy/move, duplicate, delete-to-trash where supported, permanent delete with explicit confirmation, selection-based batch operations, progress/cancel/retry, transfer queue and truthful partial-failure receipts.
8. Previews for common image, text, PDF, audio/video (within browser codecs), ZIP/CBZ virtual folders; safe rendering of HTML and other risky types; later GLB/3D, additional document formats and plugin preview capability. Never execute unknown active content merely to preview it.
9. Metadata/details pane: type, bytes, dates, dimensions where available, hashes on demand, provider, grant scope, provenance, tags, catalogs, links and available actions.
10. Fast search/filter by name, path, type, size, date, tags and content where separately enabled; incremental results and accurate indexing/offline status.

## P1 — differentiated universal explorer

- Multiple R2 buckets and scoped connections; directory/prefix emulation, pagination, object properties, signed/authorized download and permitted upload/copy/move/delete; explain that cloud object stores differ from filesystem semantics.
- User-created catalogs, tags, free-form text notes and **cluster pairings** between bookmarks, local resources and R2 objects; grouping is logical, independent of where physical bytes live. Nested collections, saved searches and relationship graph/board views share a canonical resource model.
- Bookmarks, captures, selected text and browser page references integrated with local and cloud resources; preserve provenance, original source URLs and offline availability truth.
- Chute, Redown and Substrate adapters only through explicit user authorization and versioned, optional interfaces; no assumption that they are installed.
- Bulk rename, duplicate detection, thumbnail/index caches, advanced search, configurable columns, queue controls and catalog export/import.
- Full-tab explorer for immersive work and responsive side panel for browsing-adjacent workflows. Maintain excellent usability at 1366×768 and resizable narrow side-panel widths, keyboard/accessibility, low resource consumption and graceful degraded preview on 4 GB class hardware where feasible.

## P2 — mature commercial product

- Advanced previews, rich asset relationships, optional local semantic search and suggested pairing with provenance; desktop Windows/Linux clients; Android client using Storage Access Framework and platform-specific restrictions; secure multi-device synchronization only if separately designed and consented.
- Stable extension/helper update compatibility, signed Windows builds when practical, installer and uninstaller, Chrome Web Store listing/policy audit, accessible UX, non-extractive pricing, portable export and sustainable support diagnostics.

## Core workflows to prove in real environments

A. Install native helper once with consent; open Chrome extension; pair securely; grant a folder; browse 1,000+ mixed files without repeated Chrome file-picker prompts.

B. Select several files via Ctrl/Shift and right-click Copy; enter another granted directory; right-click Paste; verify exact bytes and no altered originals. Repeat with Cut/Move and cancellation. Confirm denied scope never performs effects.

C. Right-click selected files → Move To / Copy To / Send To, see only permitted destinations; exercise rename/new folder/duplicate/trash/undo with real filesystem outcomes.

D. Import/select an R2 connection; browse alongside a local directory, copy/download authorized objects, handle offline credentials and partial transfers without false success.

E. Pair a browser bookmark with a local image and R2 PDF in one catalog; restart browser and helper; links, tags and resource identities survive while unavailable locations are accurately shown.

F. Kill helper and restart browser; native host wake/reconnect restores the authorized workflow without duplicating pending operations.

G. Threat test malicious webpages, unpaired clients, forged origins/tokens, symlink escape, archive traversal, destructive multi-selection and leaked cloud credentials.

## Fixed vs fluid

**Fixed:** trustworthy familiar operations, coherent selection/clipboard/context menu behavior, user-authorized effects, accurate byte/content outcomes, persistent cross-location relationships, safe recoverability, accessible navigation, portable data and truthful status.

**Constrained:** responsiveness/latency, directory indexing and queue concurrency, memory use, recoverability time, search freshness and previews under explicit tested performance envelopes.

**Fluid:** Python/PyInstaller vs another native runtime, HTTP vs future IPC, OS host registration, list virtualization library, UI framework, storage engine, search index, thumbnail processor, filesystem API and R2 SDK. Alter mechanisms freely once independent conformance establishes preserved user value.

## Engineering boundaries

Publish the smallest coherent vertical slice first but **architect for the entire premium destination**. No generic shell command or unconstrained path API; enforce explicit directory grants, authenticated and scoped local operations, robust against DNS rebinding/CSRF and race/symlink attacks. Treat move/copy and trash as provider-defined, record actual results, allow idempotent retries. Native Messaging bootstrap is a practical Chute-derived mechanism; treat Chrome Web Store approval as an external decision, never a proof inferred from a manifest. Maintain Forever Works records and evidence for every accepted change.

## Relationship to the implementation program

This is the **target product contract** complementing `BUILD_PROGRAM.md`. Milestones may stage implementation, but may not quietly redefine the final target into a toy graph viewer or minimalist bookmark extension. Every agent should know the premium explorer is the ultimate objective.


## Proposal addendum — Drag web images into authorized local folders (2026-10-18)

**Status:** Owner-directed future feature proposal, not a claim of implementation. Builds on the existing general cross-directory drag-and-drop obligation and the documented Chute companion precedent. This adds a specific **browser image → Atlas-authorized local destination** flow; it is not merely dragging files already visible inside the explorer.

### Experience and intent

- A user should be able to drag an image from an ordinary browser webpage and drop it onto a visible, authorized local folder in Atlas, ideally with the fluency of dragging an existing file between desktop folders.
- Atlas shows the destination, item count/type, a clear **Copy / Save image here** action, a drop highlight and useful success/failure feedback. The default is to **copy**; never delete or mutate the web source or silently move it.
- Reuse the same attractive folder tree, breadcrumb targets and file card/grid presentation as the canonical Atlas explorer. Drag-over can briefly expand a closed destination folder, auto-scroll long trees, and make the current destination unmistakable. Support keyboard and explicit **Save image to…** fallback.
- Where browser-to-extension drag transfer is not supported across windows/contexts, provide a **Chute-inspired extension handoff**: image context-menu action or Atlas shelf destination picker backed by its explicitly paired native companion, without implying arbitrary web pages can write to local files.
- Input possibilities include browser drag payloads containing actual image File/Blob bytes, URL text, or HTML with image references. Inspect and validate the payload; do not assume a dragged image URL is equivalent to its rendered image bytes. Where a source requires authentication, blocks cross-origin fetching, expires, or returns HTML instead of image bytes, present an intelligible retry, explicitly user-mediated save, or unsupported state instead of silently saving the wrong file.
- Support batch/multi-image drops when the browser actually provides multiple valid items, with per-item results and duplicates/collision handling. No guarantee every webpage or third-party browser supplies equivalent drag data.

### Trust boundary and storage

- The companion is the only component that writes into the user's **previously consented folder scopes**, with properly paired, authenticated and narrow extension-to-helper requests. HTML pages and untrusted drag payloads cannot choose arbitrary host paths or bypass grants.
- Verify actual image file signatures, size/decode limits, safe filenames/extensions and destination identity. Treat remote URLs as untrusted; enforce safe protocols, SSRF/network egress restrictions where the fetching component has network authority, redirects/timeouts, and reject credential-bearing or prohibited URLs. Avoid SVG/script execution and HTML disguised as images.
- Use staged streaming/atomic writes, collision naming options (rename, skip, replace with confirmation), integrity/completion checks, bounded retries and useful progress/error states. Do not claim an operation succeeded until the destination has durably received the selected bytes.
- Keep **Save to local folder**, **Add to Atlas library**, and **Archive to R2** as independent actions. A local drop should not automatically create a public pinboard entry or R2 upload; optional post-save association is user-controlled. Respect private library authorization and visibility boundaries.
- Examine Chute's proven user flow, helper pairing, wake/reconnect and file handoff as *engineering experience*, but independently implement code subject to license and current Chrome/OS permission constraints; its historical success is not proof this exact image-drop flow works today.

### Acceptance before shipping

1. Drag an ordinary webpage image into a pre-authorized Atlas local directory; a correct, viewable original image appears at the target location without source mutation.
2. A drag that supplies only a URL or inaccessible/protected resource is handled truthfully; no HTML error page is misidentified as an image.
3. Unpaired/offline companion, unauthorized folder, blocked network URL and interrupted transfer fail safely with clear recovery.
4. Drag over nested folder tree and grid works at desktop and narrow widths; drop destination and copy intent remain obvious.
5. Duplicate filenames, long names, multi-file payloads, large files, MIME mismatch and retry are handled without silent overwrite or truncated saves.
6. Equivalent **Save image to…** context-menu/button path remains usable when native webpage drag data cannot be captured.
7. Only explicitly user-authorized local storage is modified; no silent publishing or remote archival.

**Guiding outcome:** Treat browser-to-local image capture as a natural, visually polished operation within the unified Atlas explorer, using lessons from Chute without pretending the browser has unrestricted filesystem privileges.
