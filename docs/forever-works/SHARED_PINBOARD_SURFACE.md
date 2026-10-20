# Shared pinboard surface — 0.1.73

## Owner intent

Every repair and improvement to the bookmarks pinboard should also benefit newly created boards. Keep the image-first presentation and compact controls; do not grow a second editor/dashboard or duplicate the saved-card renderer.

## Fixed, constrained and fluid

Fixed: stable card identities, existing saved records, human/model provenance separation, explicit generation, per-card removal, graded tag ranking and permission boundaries. Constrained: Chrome-profile storage quota, bounded image mounting, raster preview limits and existing companion availability for generation. Fluid: composition, styling and collection sources through small adapters.

## Implemented boundary

`extension/pinboard.js` owns one card renderer, virtual masonry, preview, image-source dialog, tag controls, ranking and motion for both collection sources. `pinboard-blank.js` now owns only authored-card storage, the adjacent composer and edit/remove operations. Its source contract exposes load/nodes/metadata/patch/tagAdapter and composer placement; it does not render saved cards. The former authored-card renderer and its CSS are removed.

Bookmarks retain their existing URL identity and revision-checked companion mutation. Authored cards use a stable scoped `atlas-card:<scope>:<id>` key, including when two cards link to the same bookmark URL. Tags and images on those cards are independent. Importing a bookmark copies its human tags, text, image and link; it does not silently promote model predictions to human input. Local tag mutations use the existing tag picker through an adapter. Generated runs and display decisions use the scoped identity and existing provenance pipeline. No new inference stage, background generation or helper installation is introduced.

The `atlas.pinboard.cards.v1` storage shape and existing IDs remain readable. Edits preserve unknown record fields; removal marks a record deleted rather than deleting associated evidence. The composer remains beside the saved cards in the shared layout. Preview hides only the composer. Switching collections resets preview so returning to a blank board cannot leave its composer permanently hidden. Existing saved cards can be edited/removed from the common image preview.

## Proof and limits

The source-adapter and integrated pinboard tests cover legacy cards, independent scopes, shared cards/preview/ranking, per-card tag removal and re-addition, model generation identity, cover replacement, editing, soft deletion, drafts and preview switching. These use DOM/API doubles. CI now includes the authored-board test. Actual Chrome visual acceptance, production companion interaction and low-memory hardware performance remain unverified for this change: the local Playwright browser download failed. Storage remains in the Chrome profile; this is not a durable-library or publishing migration.

Continue by testing an existing blank board and a newly created board in Chrome: image preview, local and URL images, tag picker, ranking, explicit generation, preview Escape, edit/remove, scrolling, narrow viewport and reduced motion. Keep future surface fixes in the shared renderer and source-specific persistence in adapters. The separate retired-tag-system backlog audit remains open.

## 2026-10-20 — Searchable tags and local organizational Sections

The existing tag picker now searches and resolves normalized existing labels before creation. The shared preview accepts an optional organization adapter for Card-owned Notes/Bookmarks Sections. A global name ID is categorization only; every local instance has its own ID, owner, area and reference memberships. Removal leaves existing content unsectioned and retains evidence. Content adapters and permissions remain unchanged. See [implementation, portable contract and proof boundaries](../implementation/PINBOARD_SEARCH_AND_LOCAL_SECTIONS.md). Dashboard aggregation/composition and native export adapters remain future work.
