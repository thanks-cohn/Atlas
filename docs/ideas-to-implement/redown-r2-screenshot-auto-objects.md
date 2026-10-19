# Future idea: ReDown screenshots → R2 → Atlas Objects

**Status:** Proposal only (not implemented).
**Products:** ReDown captures/transfers screenshots; Atlas discovers, indexes, and presents them as Objects.

## Vision
A user takes a screenshot using ReDown, and ReDown sends it directly to a user-configured Cloudflare R2 directory/prefix. Atlas connects to that directory and automatically regards each screenshot as an **Atlas Object**, making new screenshots appear in the Atlas Objects area without manual imports.

## Proposed flow
1. Configure screenshot capture and an R2 bucket/prefix destination in ReDown.
2. Capture a screenshot; ReDown uploads the image to R2 and confirms successful upload.
3. Atlas connects to the specified R2 bucket/prefix with appropriate permissions and discovers new screenshot assets.
4. For each asset, Atlas creates or updates an Object record referencing the R2 location. The original R2 object remains the backing asset.
5. Screenshots appear in Atlas Objects and can be viewed, tagged, annotated, linked to bookmarks, boards, notes and other Objects, grouped, and reused.
6. Optional future automation can group screenshots into composite Objects, preserving source links and all relationships.

## Key principles
- **Separate responsibilities:** ReDown handles screenshot capture and R2 transfer; Atlas handles Object indexing, relationships, visual presentation and portability.
- **Reference-first:** avoid downloading or duplicating entire screenshots by default. Offer explicit backup, caching, migration or offload controls later.
- **No accidental loss:** deleting or removing an Atlas Object does not silently delete the underlying R2 screenshot. Support recovery/tombstones.
- **Identity and deduplication:** track bucket, key, version/ETag and optional SHA-256; avoid duplicate Object creation after re-scan, rename or sync.
- **Private by default:** R2 assets and Atlas Objects must not become publicly accessible or publishable without deliberate approval.
- **Index incrementally:** poll/list a configured prefix initially; consider event-driven sync later, including additions, changes and removals. Show sync health/errors and avoid claiming a partial inventory is complete.
- **Portable Object manifest:** retain references, tags, notes, relationships, origin (ReDown screenshot), timestamps and storage provenance in exportable structured data.
- **Failure handling:** retries, idempotency and transparent partial-failure states.

## Acceptance criteria for a future implementation
- Newly uploaded ReDown screenshot appears as an Atlas Object without manually creating a card.
- Re-sync does not duplicate it.
- Object preserves links to remote original and all Atlas metadata.
- R2 remains source-of-truth for the screenshot file; access is permission-controlled.
- Disconnection, upload failure, deleted remote file and absent credentials degrade safely and clearly.
- No accidental publication or remote deletion.

Related to Atlas Notes/Bookmarks/Images/Objects pop-out proposal: https://github.com/thanks-cohn/Atlas/issues/2
