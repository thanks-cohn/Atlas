# Proposal — Image Recover, Asset References and Optional R2 Backup

Status: PROPOSED; documentation only. Owner direction recorded 2026-10-18 (America/Chicago). Source baseline: `38d47ca8937d76770216c823c30c3758fb08dea7`. No image-gallery, recovery log, hashing service, R2 backup, bucket, endpoint or migration is implemented by this change.

Related: [Additive Image Entries](PROPOSAL_ADDITIVE_IMAGE_ENTRIES_AND_RECOMMENDATIONS.md), [Tag Provenance](PROPOSAL_TAG_PROVENANCE_RUNS_AND_CURATED_STATE.md), [Portable Object Grammar](PROPOSAL_OBJECT_GRAMMAR_AND_PORTABLE_EXPRESSIONS.md).

## Purpose and accepted owner direction

A card is a small image gallery. Add Image appends without replacement. Left/right changes the active image and its independent tags, notes, linked bookmarks and generation context. New entries inherit none of their siblings' annotations. A top-right star sets the current image as the default cover and stays highlighted on that entry; the shelf and board use that same default. Remove Image sends the entry's reference and associated information to Recover before removing it from active presentation.

Recover is a detailed, durable history of connections and changes, intended to remain useful for decades. Its initial contract is **metadata and references**, not automatic image retention. Record an original URL for URL sources and a last known local location for local sources. Keep these even if later unreachable. A browser file picker may supply only a filename; mark full path unavailable instead of inventing a path or treating a browser blob URL as a durable location.

Backup to R2 is explicit opt-in. It saves a copy of image bytes in a standardized location which the whole framework and future API can resolve. Reference-only recording does not itself download/upload an archive or enable cloud services. Existing image-storage behavior is not changed by this proposal.

## Identity and history contract

- A stable entry ID owns the image context and relationships; a stable asset ID resolves storage references. SHA-256 identifies exact bytes, not semantic identity, location, or ownership. Two entries sharing a hash remain independent contexts.
- When authorized bytes are readable, stream SHA-256 computation with bounded memory and record algorithm, digest, byte length, MIME type, observation time and source revision. Never hash a URL string and call it the image hash. If bytes cannot be read, store an explicit pending/unavailable hash state and reason; recovery metadata must still be saved.
- Record original and subsequently observed locators with provider, last-known location, observation time and availability. URL changes do not rewrite historical observations. Sensitive URLs and local paths are private metadata; redact them from diagnostics/public exports unless explicitly authorized. Do not put credentials into public asset identifiers.
- A removal record retains entry/card IDs, original membership/order, default-cover state, asset references/hash state, note identities and versions, bookmark identities/URLs and relation types, human tag assignments, all model evidence references, display/suppression state and operation/time provenance. References must resolve to durable retained records or immutable snapshots; dangling references are insufficient recovery.
- Keep human-authored, human-edited and model-generated assertions distinct. Preserve model ID/version or artifact hash, run/batch ID, process/configuration, timings/confidence where available, raw produced tags and derived/presented tags. Display a repeated label once without erasing its multiple origins. Attribute edits, removals and deltas.

A small versioned event log (JSONL is a candidate), materialized current state and periodic indexed snapshots are proposed implementation tools. Append attributed events rather than repeatedly copying whole libraries; include operation IDs, sequence/revision and idempotent replay. Snapshot compaction must preserve retained evidence and replay semantics. No final file schema or route names are selected here.

## Proposed effects and transitions

| Action | Persistent effect | Visible result |
| --- | --- | --- |
| Add Image | New stable entry with source locator, independent empty associations and hash state | Focus new entry; previous entries/default survive |
| Left/right | Select existing entry; no association copying | Image and its entire context change together |
| Select star | Update default-entry reference atomically | Current star highlighted; shelf/board cover follows |
| Remove Image | Commit Recover record and detach membership as one recoverable transaction | Show surviving neighbor; parent card remains |
| Remove default | Record previous default; choose next surviving entry, otherwise previous, as proposed fallback | Exactly one default when images remain; none for empty card |
| Restore | Restore original entry and retained associations idempotently | Recover relationships even when source bytes are unavailable |
| Enable Backup to R2 | Authorized copy, verified receipt and backup locator | Mark verified backup only after verification |
| Disable backup | Stop future uploads | No implicit deletion of existing remote objects |

Failure to save the recovery record must leave the active entry intact. A successful metadata record is not proof of saved image bytes. A missing URL/local file must produce a clear unavailable-image state while keeping history accessible. Restoration must not overwrite current edits, recreate unrelated deleted objects, or apply late model results to another image; reconcile conflicts explicitly. Restoring an old default must not silently replace a more recent user choice. Source files, shared assets and Chrome bookmarks are never deleted by Remove Image.

## Optional R2 asset contract

Proposed object key inside the user's authorized bucket/prefix: `assets/sha256/<lowercase-sha256>/original`. This names a candidate versioned convention, not an existing route or a publicly readable URL. Use an asset resolver so callers address asset/entry IDs, and provider/bucket locations can change without rewriting every relationship. Store MIME type and byte length in metadata/manifest rather than relying on a filename extension. Preserve original filename separately.

Within a user-authorized storage scope, identical bytes may reuse one verified object. Hash equality never merges notes, entries, privacy scopes or permissions; cross-user deduplication is not assumed. Upload only on explicit opt-in and with scoped authorization. Handle retries/multipart/interruption idempotently, compare byte length and a trusted SHA-256 verification result, and write a backup receipt only after successful verification. Do not treat an object-store ETag as SHA-256. Verify recoverability before offering any separate local-cleanup operation; backup alone never authorizes source deletion.

The resolver may use an available authorized source or verified backup, but must disclose unavailable/stale/mismatched data. If source bytes changed, create a new revision/hash observation and do not attach old inference to new content silently. Preserve the original locator alongside the backup locator. R2 bucket creation, billing, retention and public/private access require their own explicit supported flow; this document performs none of them.

## Decades of history with bounded runtime cost

The ambition is long-lived inexpensive relationship history, not an unlimited-storage promise. Use indexed/paginated history, bounded queues and memory, incremental hashing, and lazy asset retrieval. Avoid loading an entire log or library into a 4 GB machine. Remote history/snapshot storage is a future option; image backup is separate. Metadata and backed-up images have distinct accounting and user-controlled retention/export policies. A terabyte still has storage costs; neither free capacity nor free requests are promised.

## Implementation gates and acceptance

1. Inventory current ownership/storage and add a versioned idempotent migration preserving legacy associations on the first entry only. Reuse existing resource/link/provenance adapters.
2. Implement independent image entries, Add Image, navigation and star/default-cover consistency for bookmark and authored boards; maintain image-first layout, responsive controls and one preview scroller.
3. Implement transactional metadata-only Recover, source observations, hashing states, event/snapshot persistence and restoration before enabling removal.
4. Qualify optional R2 backup/resolution separately; do not couple gallery/recovery usability to cloud enrollment.

Acceptance must cover equal-hash independent entries; URL and filename/path origins; unreadable-source recovery with missing hash; exact-byte digest; default selection/reload/removal; note/bookmark/tag provenance round trips; repeated restore; failed/interrupted recovery writes; concurrent edits; late inference; no source deletion or unsolicited uploads; verified backup hash mismatch rejection; private exports; bounded memory and long-log pagination. Test Chrome and constrained hardware separately from mock/unit checks.

A successor can replace storage, UI or implementation language while preserving stable identities, origin evidence, independent contexts, user-controlled backup, recoverable relationship history and honest availability claims.
