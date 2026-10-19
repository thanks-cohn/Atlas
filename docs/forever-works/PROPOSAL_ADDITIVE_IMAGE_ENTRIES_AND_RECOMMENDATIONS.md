# Proposal — Additive Image Entries and Contextual Recommendations

Status: PROPOSED, documentation only. Recorded 2026-10-18 (America/Chicago).
Source baseline: `db7c5c00e45842b1d4fcd90286a11d1686026691` (extension 0.1.84).
This change does not implement galleries, migrate saved data or connect recommendations.

Related: [Card Expansion and Transitions](PROPOSAL_CARD_EXPANSION_STATE_TRANSITIONS_AND_ROULETTE.md), [Contextual Image Pages and Dated Notes](PROPOSAL_CONTEXTUAL_IMAGE_TAG_ROTUNDA_AND_DATED_NOTES.md), [Tag Provenance](PROPOSAL_TAG_PROVENANCE_RUNS_AND_CURATED_STATE.md), [Shared Pinboard Surface](SHARED_PINBOARD_SURFACE.md), [ONNX Integration](ONNX_TAGGING_INTEGRATION.md).

## Purpose

A card becomes a small navigable collection of images without losing the image-first preview or introducing another studio/dashboard. Adding material must preserve earlier work. Each image is a distinct context: its annotations and model results describe that image, rather than accidentally spreading across everything in its parent card. The same dependable behavior must serve bookmark boards and user-created boards.

## Accepted owner direction

- Image addition is additive from now on: **Add Image** appends; it never overwrites an existing image. Rename the current Change image action accordingly when implementing this proposal.
- Existing images remain until the user explicitly chooses **Remove Image**. Adding, fetching, navigation, generating tags or changing settings must not silently replace/remove them.
- Left/right navigation changes both the displayed image and its associated popup contents.
- A newly added image starts with no human tags, generated tags, notes or linked bookmarks. No content is inherited from another image, even if its bytes or URL are identical.
- Generate tags applies only to the currently displayed image entry, on explicit request. It keeps the current Things/People/Faces and Settings-gated Anime behavior.
- Add Tag reuses the existing picker, targeting the currently displayed entry. Human and model tags share one visual field with distinct origin presentation; duplicate labels display once while source evidence remains separate.
- Tag-based recommendations require tags on that entry. **No tags means no tag-based recommendations.** Parent-card tags and sibling-image tags must not fill the gap.
- Recommendations appear below the Notes/Bookmarks expansion region. Reach them by scrolling down inside the same preview; opening Notes or Bookmarks is not a prerequisite for eligibility.
- Retain elegant image-first presentation, shared left/right insets, existing action-row organization, and minimal controls.

## Proposed interaction contract

This section translates the direction into implementation details; details not explicitly requested remain agent proposals.

| Action | Result |
| --- | --- |
| Add Image, then choose a local image or URL | Validate and persist a new entry, append it, then focus it with an empty content context. Cancel/failure leaves all previous entries unchanged. |
| Left/right buttons or arrow keys | Select the adjacent entry and render that entry's tags, notes, bookmarks, generation status and recommendations together. Loop at both ends, following Atlas's existing preview convention. |
| Generate tags | Capture the selected entry identity and image revision; attach results to that entry, even if the user navigates before completion. |
| Add Tag | Open the existing retained picker for that entry; creation/removal and saved-state feedback remain familiar. |
| Remove Image | Explicitly detach the selected entry from this card, then select the next surviving neighbor, or the previous neighbor at the end. |
| Remove the last image | Keep the parent card/bookmark and show an elegant empty image state with Add Image. Never delete the card or Chrome bookmark. |
| Escape | Preserve existing dialog/disclosure close behavior; do not remove content or reset stored associations. |

Place Add Image and a quieter Remove Image in the source-action row, keeping Visit source on the right. Keep Add Tag beside Generate tags. Navigation affordances should be small, visible on focus/interaction, and have accessible labels plus an unobtrusive position indicator. Disable/hide unavailable navigation for zero/one entry. Do not intercept arrow keys while typing, selecting tags, or operating another control that owns them. Optional transition motion must respect reduced motion and constrained hardware.

The parent title/source stays stable by default; all image-scoped content changes. Independent per-entry titles/source overrides are a future option, not a requirement to invent now. Adding an image does not silently change the representative cover. Accepted owner direction now requires a top-right star control: selecting it sets the active entry as the default cover, with a highlighted star on that entry. The shelf and board resolve the same explicit default. See the recovery addendum below.

## Ownership and portable identity

Use stable logical identities rather than array indexes, display order, image URLs or browser blob URLs as annotation owners. A possible portable representation is:

```json
{
  "schema_version": 1,
  "card_id": "card-uuid",
  "image_entry_ids": ["entry-a", "entry-b"],
  "representative_entry_id": "entry-a",
  "entries": {
    "entry-a": {
      "id": "entry-a",
      "asset_id": "asset-uuid",
      "image_revision": 1,
      "human_tag_refs": [],
      "model_run_refs": [],
      "note_refs": [],
      "bookmark_refs": []
    },
    "entry-b": {
      "id": "entry-b",
      "asset_id": "another-asset-uuid",
      "image_revision": 1,
      "human_tag_refs": [],
      "model_run_refs": [],
      "note_refs": [],
      "bookmark_refs": []
    }
  }
}
```

This is an illustrative contract, **not an approved production schema** or a new parallel catalog. Map these concepts onto Atlas's existing resource/link APIs and portable storage. References should point to existing independently identified resources, not duplicate whole libraries. Assets can use local, URL and future R2 providers through existing adapters. Two entries may reference one deduplicated asset while retaining independent annotations. Physical deduplication never implies semantic inheritance.

Keep parent/card-level metadata distinguishable from entry metadata. Do not abolish valid parent relationships; do not display them as though they belong to a new image. Model evidence must record entry ID, image identity/revision, model/version, run/batch identity, timings and raw predictions using existing provenance contracts. Current displayed tags are a derived projection; removal/suppression must not erase original runs or the reusable tag vocabulary.

## Transition and asynchronous safety

State includes card identity, ordered entry IDs, active entry ID, entry revision, open disclosure, entry-keyed drafts, in-flight operations and transient scroll/focus. Render the active entry as one coherent context, not an image paired momentarily with the previous entry's tags.

Every read/write/generation operation captures its target before awaiting. Late results may update only their original surviving target and revision; they must not repaint or attach to whichever entry happens to be active later. Removal while generating requires cancellation or a safely detached completion record, never resurrection. Switching entries should reset that entry's visible region to a sensible top position or restore its own stored transient position; it must not reuse the previous entry's scroll accidentally. Retain unsaved note drafts per entry, or explicitly resolve them before switching—never silently discard them.

Append and removal must be atomic/retry-safe. An operation ID prevents duplicate appends after retries; concurrent additions must not clobber each other. Two deliberately added identical images are still independent entries unless the user chooses otherwise. Do not download/infer on all entries merely because the preview opens. Decode/render the current image and a bounded neighboring buffer; release distant image memory while retaining lightweight entry metadata.

## Recommendation eligibility and placement

Compute eligibility from the active entry's effective displayed, unsuppressed tags only, retaining human/model provenance. Zero effective tags: do not run a tag query or show recommendations from previous entries. Keep the region absent or use one small contextual empty state; no promotional/dashboard block. Adding the first tag enables eligibility; removing the last tag immediately clears/invalidates results. A new image therefore has no recommendations until tagged.

Key recommendation requests/cache by entry ID, image revision, normalized tag-set revision, source/privacy scope and recommender version. On navigation or tag changes, invalidate stale presentation and reject late responses for a different context. Present a small bounded set below Notes/Bookmarks, lazy-load as approached, respect existing permissions/private-public boundaries and avoid automatic attachment of suggestions. Recommendations are suggestions, not saved relationships. Clicking a suggestion must follow an explicit viewing/acceptance action.

The engine/provider/scoring method remains open. The owner discussed tag embeddings, but this proposal does not select or install AniTag2Vec, Dart, or any other model. Title-based fallback is not part of this slice and must not bypass the no-tags rule.

## Removal and preservation

Remove Image detaches only this card's selected entry. It does not delete a user's source file, remote object, Chrome bookmark, another card's shared asset, or model provenance archive. Retain an attributed removal/tombstone and offer lightweight undo where feasible. Physical asset garbage collection is a separate verified lifecycle decision; never couple it to a preview button without an explicit policy. A failed removal leaves visible/stored state intact and gives concise recoverable feedback.

## Existing data and staged implementation

Current 0.1.84 implements a single chosen image and item-keyed tags/results/connections. It does **not** yet establish the independent entry ownership above. Implementing only an image array would be incomplete and unsafe.

1. Inventory existing cover, catalog-tag, model-run, authored-card and note/bookmark storage paths. Preserve real user data and describe exact ownership before migration.
2. Introduce stable entry ownership and a versioned, idempotent migration. Preserve old single-image content on the first legacy entry only, with its original provenance; do not copy it to new entries. Ambiguous parent-vs-image metadata stays explicitly legacy/parent-scoped until resolved.
3. Add transactional append/removal and shared preview navigation for both board sources. Preserve empty-card behavior and old data readability/export or supply a documented rollback restore path.
4. Route tag picker, generation, suppression, notes and linked-bookmark writes through active-entry adapters. Reuse existing modules; isolate legacy mappings at the boundary.
5. Add tag-eligible recommendation presentation through a replaceable provider. It can remain unconnected until ownership and navigation gates pass; do not fabricate recommendations.
6. Verify runtime on Chrome and a 4 GB class machine, update Forever Works implementation/evidence records, then mark each proven slice implemented.

## Acceptance and replacement obligations

- Add B to existing A: A and all its information survive; B begins empty. Add C repeats the behavior.
- Navigate A/B repeatedly: tags, notes, linked bookmarks, statuses and recommendations always match the active entry.
- Generate on B then navigate A: completion belongs only to B. Repeat/model overlap accumulates evidence while each label displays once.
- Add a human tag to B using the reused picker: A remains unchanged. X removes only B's association while preserving vocabulary/evidence.
- No tags on B: no tag-based query/results. First tag enables recommendations; last removal clears them; old A results never flash on B.
- Remove B: A survives. Remove last image: card/bookmark survives. Source files and other cards' assets remain.
- Verify reload, partial failure/retry, concurrent appends, entry removal during inference, interrupted migration and recovery/export.
- Verify duplicate URLs/assets do not merge entry metadata; legacy migration runs twice without duplication or lost annotations.
- Verify bounded decoded-image memory, one preview scroller, both themes, edge alignment, keyboard ownership and reduced motion.

A successor implementation may change language, storage mechanism, UI framework or recommendation provider. It must preserve additive ownership, explicit removal, per-entry isolation, provenance, permission boundaries, recoverability and the tested interaction semantics. This proposal is rationale and planned acceptance evidence, not proof of implemented functionality.

## Accepted addendum · Default cover, Recover and opt-in backup · 2026-10-18

Owner clarification supersedes any implication that Remove Image automatically archives image bytes: **Recover initially preserves references, SHA-256 when readable, and relationship/history metadata. It does not create a backup copy by default.** Preserve the original URL or last known authorized local location (filename-only if the browser withholds the full path). Optional Backup to R2 stores a separately verified copy in a standardized asset namespace used by the framework/API.

The top-right star selects the default entry and highlights it. Removal saves a durable recovery record before detaching the entry; restoring associations is distinct from retrieving unavailable image bytes. See [Recover, Asset References and Optional R2 Backup](PROPOSAL_IMAGE_RECOVERY_REFERENCES_AND_R2_BACKUP.md) for effects, failure semantics and acceptance gates. Everything in this addendum remains proposed, not implemented by this documentation change.

## Implementation follow-up · 0.1.89

A first extension-local vertical slice now implements additive independent image entries, cover stars and reference-only shelf Recovery. See [Image-entry Gallery and Recovery v1](IMAGE_ENTRY_GALLERY_AND_RECOVERY_V1.md) for actual code/storage, migration and proof. This does not mark the entire proposal implemented: R2 backup, durable external history/API, scalable indexing and recommendations remain future work. Chrome visual/runtime acceptance remains separate.
