# Proposal — Directory Pinboards, Reusable Objects and Saved Composition States

**Status:** Owner-directed proposal; not implemented by this document.  
**Recorded:** 2026-10-18 (America/Chicago).  
**Scope:** Local/R2 directory views, object selection, grouped data, arrangement snapshots, Recovery and portable reuse.

## Purpose and owner direction

Turn an authorized local directory or Cloudflare R2 directory/prefix into the same polished, enjoyable Atlas pinboard experience. People can browse previews, tag each item, add notes/bookmarks and connect related material, with their work saved durably. Files remain in their chosen storage; the board is a view over resource identities and metadata.

The owner further proposes marking a card or expanded popup as a reusable **Object**, preserving its connected contents as one understandable unit. The arrangement itself can be **saved as a state**. The object remains addressable within the framework, exportable to other projects, and recoverable as a connected whole after deletion.

This extends the existing [Object Grammar and Portable Expressions](PROPOSAL_OBJECT_GRAMMAR_AND_PORTABLE_EXPRESSIONS.md), rather than introducing another store, renderer or unrestricted containment system.

## Directory pinboard

- Select a user-authorized local folder or R2 prefix and apply the shared pinboard presentation and interaction conventions.
- Save per-item human tags, independent model outputs/provenance, notes, bookmarks, relationships and chosen cover.
- Preserve logical resource identity separately from filename, path, bucket/key and content hash. Moves require reconciliation or explicit relinking; identical hashes do not automatically merge independent annotation contexts.
- Refresh directory listings without discarding annotations. Missing/offline resources retain their saved metadata and show honest availability.
- Keep indexing, pagination and preview retrieval bounded. Directory selection does not authorize scanning outside the selected scope.
- Choosing a view does not automatically upload, duplicate, move or publish source files.

## Mark and select an Object

Provide an explicit object-marking control with its own icon and selected appearance. It must be visually distinct from the star that chooses a default image. “Make object” and a linked-box icon are proposed wording/icon choices, not finalized design.

Alongside Notes and Bookmarks in a card popup, offer an expandable **Objects** section. Its selector lists marked objects; selecting one adds a permitted reference/presentation. A compact row or card can expand into that object's rich popup, retaining access to the whole.

The object carries its grouped images/files, notes, bookmarks, tags, model provenance, relationships and permitted nested references. Preserve existing independent image-entry annotations. A preview exposes a deliberate projection of that data; collapsed or omitted content remains in the source object.

Respect existing type and containment rules: an Objects section is not permission for a Pinboard to directly own arbitrary Pages/Projects/Sections. Distinguish references, structural children and host presentations. Detect recursive presentation/containment cycles and bound traversal.

## Arrangement as a saved state

Save a named or versioned composition state containing the object identity/revision, selected content and presentation references, ordering, grouping, layout, cover choice and meaningful expansion/navigation state.

Separate:
1. **Object content:** identity, annotations, assets and relationships.
2. **Composition state:** how selected pieces are arranged and disclosed.
3. **Host placement:** where this expression sits in a particular board/page/project.

A reusable object may include its own internal arrangement while a host retains independent placement. Saving one board's arrangement must not overwrite all other views of its cards.

Use semantic responsive rules and stable item references rather than only a screenshot or absolute desktop coordinates. Reconstruct the composition on phone, desktop and narrow embedded containers while preserving hierarchy, meaning, usable interactions and aesthetic intent. Animation progress, temporary hover and credentials are not portable saved state.

Whether a saved state pins content revisions or follows live content must be explicit. Proposed defaults and exact schema require implementation review; do not silently describe a live reference as a historical snapshot.

## Reuse operations

| Action | Proposed meaning |
| --- | --- |
| Link | Reuse the existing object identity; authorized source edits appear according to the live-reference contract. |
| Snapshot | Preserve a selected object revision and composition state. |
| Duplicate | Create an independently editable object with lineage and explicit shared/copied asset rules. |
| Move | Change an allowed membership/location while retaining object identity; verify destination before source removal. |
| Export/import | Transfer a versioned, permission-safe object package and composition state with explicit dependencies and collision rules. |

These detailed verbs are engineering proposals supporting the owner's grouped-object direction. Export must distinguish reference-only packages from packages with authorized asset bytes. A package with external references may be incomplete offline; report missing dependencies rather than claiming it is self-contained.

Objects must be discoverable/addressable through the framework's existing capability surface, not reconstructed by scraping the current UI. Concrete endpoints and schema are pending.

## Recovery preserves the whole

Deleting an Object sends its connected record and saved composition state to Recovery. Restoration reconstructs its contents, grouping, relationships and arrangement without silently producing duplicate identities.

Distinguish removing a reference from one host from deleting the object itself. Removing one placement must not destroy a shared source object or its other placements. Recovery stores enough versioned membership/reference information to restore the deleted composition while preserving independently shared objects.

Follow [Image Recovery References and Optional R2 Backup](PROPOSAL_IMAGE_RECOVERY_REFERENCES_AND_R2_BACKUP.md) and [Image-entry Gallery and Recovery v1](IMAGE_ENTRY_GALLERY_AND_RECOVERY_V1.md): metadata/reference recovery does not guarantee retention of source bytes. Do not automatically copy media or delete original local/R2 files. Optional verified backup remains a separate explicit operation.

Record recovery data atomically before detaching active data. Make restore/retry idempotent and handle concurrent edits, missing originals and shared dependencies explicitly.

## Portable representation — proposed minimum

A versioned manifest should express stable identity/revision and lineage, selected members, annotations and provenance, typed relationships, composition state, required presentation rules, asset references/digests and availability, and dependency/export completeness.

Preserve unknown fields or reject unsupported versions safely. Define identity collision, migration and import behavior before shipping. Exclude credentials, grants and unrelated private connections; exported metadata must also respect privacy. Imports never grant local/R2 access or execute imported code automatically.

This is a conceptual contract, not a validated Forever Works schema or an implemented export format.

## First vertical slice and acceptance

Implement one directory adapter against the existing shared pinboard and metadata model, then one reusable card Object with one saved arrangement. Audit current source/storage first and migrate additively.

Future verification must demonstrate:
- Local folder and R2-prefix flows independently, with scoped access, pagination, unavailable sources and persisted annotations after restart.
- Object marking and selection alongside Notes/Bookmarks, distinct from default-image starring.
- Linked-object edits versus independent duplication, with original per-image context preserved.
- Save/reopen a composition state without losing arrangement or changing another host's placement.
- Delete/recover the whole object and state; remove a single reference without deleting its source; retry interrupted recovery without duplicates.
- Export/import into another permitted project with preserved meaning, identity/lineage rules and explicit missing assets.
- Privacy filtering, cycle/depth limits, failed destination writes and responsive keyboard/touch presentation.
- An unrelated host reconstructs a supported expression from documented data/rules without importing the entire extension.

**Evidence for this change:** documentation only. No runtime, R2 resources, model configuration, storage migration or UI behavior is changed or newly proven. Next dependency: inventory shared pinboard adapters, image-entry ownership, object grammar and current Recovery transactions before choosing a compatible persisted schema.
