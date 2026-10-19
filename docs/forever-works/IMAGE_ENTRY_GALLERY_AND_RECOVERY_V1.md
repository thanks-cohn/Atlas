# Image-entry gallery and reference recovery v1

Implementation source: extension 0.1.89, 2026-10-18 America/Chicago. This is a source implementation with automated DOM/API-double proof; real Chrome visual/runtime and 4 GB hardware acceptance are NOT_RUN in this environment. It is not an R2 backup implementation.

## Purpose and fixed behavior

Preserve the image-first popup while allowing one card to hold multiple independent image contexts. Add Image appends. Left/right selects an entry and its tags, notes, linked bookmarks and model results together. New entries begin empty even for identical image URLs, bytes or SHA-256 values. Stable entry identity, not hash/URL/index, owns associations. A star at the top right of the control row beneath the title (outside the image) explicitly selects the default cover. Adding another image preserves an existing default. Removing the default chooses a surviving neighbor; removing the last leaves the card/bookmark intact.

The bookmark and authored-board sources share the same gallery and preview paths. Board cards project the default entry; image popup actions target the selected entry. Shelf Choose Image appends and selects a cover rather than overwriting old gallery entries. Shelf Add Tags targets the chosen entry after migration. Original Chrome bookmark identities/URLs and legacy native catalog metadata remain; the gallery is an extension-local projection, not a rewrite of the companion graph.

## Source map and data contracts

- `extension/image-entries.js`: locked read/merge/write store, lazy legacy import, append, mutation, default selection, reference-only removal and idempotent restoration; byte-origin observations.
- `extension/pinboard.js` / `.html` / `.css`: shared active-entry adapters, gallery control row, keyboard ownership, generation identity and default card projection.
- `extension/bookmarks.js` / `bookmark-covers.js`: shelf cover/tag interoperability and explicit no-cover sentinel after final removal.
- `extension/image-recovery.js` / explorer HTML/CSS: separate **Recovery** button in the shelf's left column, paginated records, retained connection/provenance JSON, Restore Section and Export JSON. Existing Activity & recovery remains the native-helper/file recovery surface; image Recovery does not pretend to replace it.

Chrome local storage keys:

| Key | Content |
| --- | --- |
| `atlas.image-entries.v1` | Map of exact bookmark URLs or authored-card keys to schema-1 gallery records: parent identity, default ID, ordered entries, event history. Each entry combines origin, image preview/URL, tags, notes, bookmarks, raw model runs, suppressions and edit history. |
| `atlas.image-recovery.v1` | Removal records including original membership/order/default state, origin/hash availability, independent annotations, model evidence, suppression/current state, before/after edit history and restore state. No local image byte copy. |
| `atlas-image-tagging-runs-v1` | Existing raw run store, now keyed by `atlas-image-entry:<id>` for migrated/new entries; originals retained. Entry JSON mirrors generated evidence. |
| `atlas-card-tag-removals-v1` | Legacy suppression evidence copied during import; new entry suppressions live in its combined JSON record. |

Human tags and raw model runs remain separate. Generated presentation still deduplicates labels, honors Things/People/Faces choices and Settings-only Anime, and retains multiple model/run origins. Models run only on explicit request. Late inference cannot recreate a removed entry. Each entry has its own generation/picker/notes context; the tag picker is reused rather than introducing another tagging studio.

Existing single-image material is imported once into the first entry, including legacy note/bookmark identities, human tags, raw runs and suppression evidence. Later additions receive none of it. Native legacy images require one successful companion metadata read before initial popup migration, so an offline empty snapshot cannot silently replace unknown annotations. The initial copy is a snapshot; later edits to unrelated native parent metadata are not automatically merged into independent image contexts. Ambiguous old associations retain their observed IDs rather than invented ownership claims. Authored-card cover mirrors and native cover maps update in the same recovery/default transaction where applicable.

## Origins, hashing and removal

Local selections preserve the original filename, size, MIME and SHA-256 of original file bytes. Chrome file pickers do not reveal full filesystem paths; `path` is null with a filename-only status. Existing/fetched previews lack a provable original path/hash and explicitly record that limitation. A SHA-256 of a URL string is not recorded as an original image checksum. Existing generation `image_reference` values remain presentation-reference identities, distinct from original-byte digests and companion inference payload hashes.

Adding a URL requests origin access to observe bounded source bytes without credentials. A successful observation records SHA-256, time, size, MIME and resolved URL alongside the original URL. Denied access, network failures or responses over the 10 MB observation cap retain the URL with an unavailable hash/reason; they do not fabricate a digest or prevent storing the reference. A digest describes bytes observed at that time; live URL content may later change. Full provider revision verification is future work.

Remove Image writes the recovery record and detaches the active entry in one storage set under the shared Web Lock. Failed storage leaves it in place. Removal never deletes a local source file, remote object, Chrome bookmark or companion model archive. Data URLs are excluded from recovery records. URL images keep their URL; local images keep their known filename/location and metadata, with `bytesRetained:false`. The image record/history is recoverable even when the pixels are not.

Restore Section reinserts the same entry with its notes/bookmarks/tags/evidence and is idempotent. It preserves a newer default selection. URLs remain references; local restored entries may show no image because no backup was retained. Relinking missing original files to restored entries is not yet a dedicated repair flow. JSON export is private user-initiated export of the selected recovery record, not public publishing.

## Limits and remaining work

- Storage remains extension-local Chrome JSON; uninstall/profile deletion can remove it. Recovery JSON export is available, but automatic companion-file persistence, standalone API access, JSONL/snapshot indexing, provider migrations and remote history storage are not implemented here. Do not claim decades-long durability from Chrome local storage alone.
- Active preview/reference storage growth uses the existing configurable Saved image storage budget (64 MiB default). Removal and non-growing writes remain possible above a lowered limit. Original local files retain the existing 10 MB import / 40-megapixel decode bounds.
- Recovery renders 20 records per page; the current storage-key implementation still reads the metadata collection. It is not a terabyte-scale indexed history engine. Full-history growth, asset deduplication and fine-grained event indexing are future storage work.
- Backup to R2, standardized hash-keyed remote assets, verified backup receipts, billing/storage enrollment, local cleanup and tag-based recommendations remain proposed. No Cloudflare resources, model binaries, worker build or native install are changed.
- Editing a parent authored card is distinct from editing an image entry; existing image contexts remain independent. Any future composer changes must append through this adapter rather than use parent image fields as annotation owners.
- Rollback to an older extension leaves new gallery/recovery storage unread by that older version. Preserve/export profile data before downgrading; do not erase the new keys or call the old single-cover UI a complete rollback of new entries.

## Executed proof

`node scripts/test_image_entries.mjs`: idempotent import, independent IDs for identical URL/hash images with zero inherited data, original-byte SHA-256 known vector, permission-denied URL origin, atomic failed removal, alias/default synchronization, independent notes, model evidence, metadata-only recovery, idempotent restore, removed-target rejection and concurrent append.

`node scripts/test_pinboard.mjs`: existing 1,000-bookmark virtualization/ranking/tag/generation/hold/keyboard regressions plus actual gallery/store wiring: add B to A, B starts empty, B tags/note persistence, explicit default star, left/right context isolation, removal to recovery, restore and editor arrow ownership.

Passed: bookmark shelf, preview sections/connections, generation, tag editor, blank board, menu, appearance, image-file and rename suites. Extension packaging and `git diff --check` pass. Full `python scripts/check_project.py`: 160 tests, 3 failures, 3 errors, 33 skipped; failures/errors are native-bootstrap/supervisor readiness paths in this environment, matching the prior local limitation. 22 linkage records valid. This is not a full-suite pass. Real Chrome layout, source permission callbacks, native lifecycle and constrained-hardware acceptance remain separate release gates.
