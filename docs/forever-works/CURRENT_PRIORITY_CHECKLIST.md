# Current priority checklist — intuitive exploration and transposable Objects

Owner direction: 2026-10-20 (local date).
**IMPORTANT: this is the current product sequence.** Checkboxes are acceptance work, not an audit of implemented features. Leave unchecked until scoped evidence is recorded. Existing accepted functionality, permissions and unrelated work remain obligations.

## Product focus

Be exceptionally good at a few connected things: intuitive local/remote exploration, joyful collecting, reliable organization and portable reusable Objects. Pinboards, bookmarks, tags and notes are the welcoming entry point. They lead naturally into serious collections, galleries and school projects.

Priorities:
1. Make local and remote file exploration intuitive, standardized, dependable and increasingly beautiful.
2. Then formalize the proposed Object structure and qualify intuitive, correct, aesthetic hierarchy arrangement/navigation in the Dashboard.
3. Once the desired interaction surface is proven, establish the stable public API around those workflows.

Transposability, durable storage and migration discipline apply throughout; they are not postponed until the API stage. Small internal contracts remain necessary during implementation, but do not prematurely freeze a broad public API.

The full website builder remains deferred. Interoperable document/article/PDF work consumes the Object foundation and must not displace these priorities.

## 1. Local and remote explorer — first qualification

- [ ] Local and remote resources use familiar, consistent explorer conventions for location, breadcrumbs, search, selection, sorting, views and context menus.
- [ ] Users can identify the current location, selected items, available commands and destination without explanation.
- [ ] Standard mouse, keyboard and touch interactions work predictably, including multi-selection, range selection, drag/drop and clear focus.
- [ ] Supported open/preview, rename, copy, move, send-to, create and recoverable removal operations behave consistently across providers; unsupported operations are honestly unavailable.
- [ ] Multi-item and bulk send/copy/move show actionable per-item progress, outcomes, retry and partial-failure recovery.
- [ ] Distinguish reference, membership change, copy and physical move. A cross-provider move verifies destination content before authorized source removal.
- [ ] Local and remote feel like one continuous workspace while permissions, connectivity, pending work and provider limitations remain intelligible.
- [ ] Apply modest ergonomic improvements where they help; preserve recognizable conventions and discoverable commands.
- [ ] Refine spacing, typography, selection, menus, previews, hierarchy and motion into a coherent aesthetic without compromising clarity.
- [ ] Verify narrow and desktop layouts, reduced motion, keyboard access, long names, large selections and sustained browsing.
- [ ] Record actual local/native and remote-provider evidence separately. A fixture or mock is not proof that R2 transfer works.

Exit question: Can a first-time user confidently find, select, preview and perform supported local/remote operations without being taught Atlas-specific conventions?

## 2. Formalize the transposable Object — after explorer qualification

- [ ] Document versioned Object identity, type, content, assets, sources, notes, tags, versions, relations and presentation intent.
- [ ] Separate source Objects, their placements/references, hierarchy and rendered views.
- [ ] Define Collection, Gallery and Project as distinct supported Object kinds with explicit allowed contents and presentation behavior.
- [ ] Preserve stable identity during normal moves/references; independent copies receive new identity with lineage.
- [ ] Define nested containment, ordering, extraction, reference reuse and cycle rejection through the authoritative existing graph.
- [ ] Define versioned migration from current flat Collections and existing Card/Section stores without losing user work or creating shadow ownership.
- [ ] Preserve Card-local Section ownership; shared names never merge another Card's contents.
- [ ] Preserve original assets and declare missing/external dependencies rather than calling a URL-only package complete.
- [ ] Record fixed obligations, compatibility boundaries, unknowns and observable acceptance tests before changing storage.

## 3. Dashboard hierarchy and Save as Atlas Object — core product qualification

Users arrange material in an intuitive hierarchy, mark or select the desired items and save a named reusable Object.

Examples:
- Atlas Object — Research Collection
- Atlas Object — Fall Gallery
- Atlas Object — School History Project

- [ ] Users can create, name, reorder and nest permitted Objects using familiar tree/breadcrumb and drag/drop conventions.
- [ ] Users can navigate into, out of and across nested Objects without losing location or selection context.
- [ ] Users can understand an Object's type, contents and placement from its presentation.
- [ ] Users can arrange relevant material, then mark multiple items and choose Save as Atlas Object with a type and name.
- [ ] Selection/marking is visually distinct from removal. The owner's “X mark” describes choosing material; do not reuse a destructive X without clear distinct semantics. Resolve the exact selection icon in the UI prototype.
- [ ] Removing an item from a composition does not delete its library original.
- [ ] Saving preserves chosen membership/order and relevant organization, notes, tags, sources, asset references and presentation intent. The source material remains intact.
- [ ] The saved Collection, Gallery or Project reopens with the intended arrangement and can be placed or referenced in another compatible context.
- [ ] Duplicate names, independent copies, references and conflicting edits have explicit outcomes; names alone never determine identity.
- [ ] Whole-branch rearrangement preserves descendants and relationships. Invalid drops explain the issue and cannot introduce containment cycles.
- [ ] Deep hierarchies remain navigable through search, breadcrumbs, expand/collapse and show-location/all-placements.
- [ ] Hierarchy and composition remain aesthetically composed at supported sizes, with readable labels and discoverable operations.
- [ ] Verify a complete school-project scenario: gather bookmarks/images, annotate with notes/tags, arrange sections, select material, save School History Project, reopen and reuse it.

Exit question: Can a first-time user intuitively and correctly arrange an attractive hierarchy, navigate it, and save/reuse a meaningful Object without rebuilding its contents?

## 4. Durability and transposability — obligations throughout

- [ ] Persist organization and content outside browser-only caches using an authorized durable local library and/or supported remote provider.
- [ ] Clearly distinguish browser-only, pending, locally committed and remotely verified states.
- [ ] Clearing browser data or reinstalling the extension can rebuild the working cache from the external committed library after appropriate reconnection.
- [ ] Preserve metadata, hierarchy, order, notes, tags, assets, sources and relationships across restore.
- [ ] Export/download individual Objects, nested subtrees and whole Projects/Galleries/Collections, with complete manifests and dependency handling.
- [ ] Import into a fresh environment and verify content, relationships and appropriate identity/lineage.
- [ ] Keep original assets and versioned structured data independently inspectable; provide useful standard-format outputs as their adapters are qualified.
- [ ] Verify recoverable writes, interrupted operations, migration, conflicts, versioned backup and actual restoration.
- [ ] Future renderers/editors consume existing Objects; users do not rebuild their collections for a new presentation or output.
- [ ] State export fidelity and unsupported features honestly; PDF/DOCX/HTML/text compatibility is qualified per operation, not assumed universally.

## 5. Public API — after interaction qualification

- [ ] Extract stable operations from proven workflows rather than designing a competing product model.
- [ ] Expose versioned discovery, query, Object reads, hierarchy, references, export/import and separately authorized mutations.
- [ ] Keep identity, provenance and relationships independent of UI layout and provider locations.
- [ ] Declare capabilities, permission scopes, idempotency, concurrency/conflicts, bulk results and recoverable errors.
- [ ] Verify the same real user scenarios through both the UI and API.
- [ ] Preserve portable use without an AI partner account. Permission-based AI access is a later adapter, not a reason to expose private libraries automatically.

## Audience and experience qualification

Owner especially wants students and school-centered communities, including Chinese and Korean audiences, to enjoy Atlas. These are audiences to learn from, not grounds to assume uniform preferences.

- [ ] Test familiar conventions with actual target users; observe unassisted task completion and confusion.
- [ ] Support Unicode names/search, Chinese and Korean text input/IME, mixed scripts, long labels and appropriate font fallback.
- [ ] Plan localization-ready strings, dates and sorting; qualify translations before claiming localized support.
- [ ] Keep bookmark discovery, tag exploration and notes fun and useful without requiring users to understand the Object schema.
- [ ] Prioritize understandable, dependable and polished interactions over feature count.

## Evidence and continuation

For each completed checkbox record the implementation revision, environment, scenario, expected outcome, observed result and limitations. This checklist itself does not certify completion.

Next implementation planning: inventory existing explorer behavior and evidence, identify the earliest unmet item in Stage 1, and deliver one qualified slice. Object specifications may be documented in parallel with ordinary work, but do not claim the explorer gate or Dashboard qualification passed without evidence. Preserve unrelated ongoing Dashboard development.

Related:
- [Current direction — the transposable Object](CURRENT_DIRECTION_DURABLE_HIERARCHIES_AND_PORTABLE_OBJECTS.md)
- [Important preservation and AI partnership vision](IMPORTANT_WHOLE_OBJECT_PRESERVATION_AND_AI_PARTNERSHIP.md)

This sequencing supersedes earlier broad editor-first plans. AI partnership and dataset ambitions remain future strategic ideas.
