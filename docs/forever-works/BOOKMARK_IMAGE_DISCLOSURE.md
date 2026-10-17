# Bookmark disclosure, representative images and current-tab navigation

Date: 2026-10-16 (America/Chicago). Extension 0.1.6.
Status: implemented first slice; actual Chrome acceptance remains NOT_RUN locally.

## Owner purpose and fixed behavior

The owner distinguishes exploration from visiting a website. The right-pointing triangle explores a bookmark, displaying its representative image above the associated hierarchy. It becomes a left-pointing return arrow. Clicking the bookmark title visits its URL in the current browser tab. Available images should display by default.

This continues the shelf-first card design without implementing Horizons or redesigning the whole shelf. Future frameworks/storage may change; separate actions, correct object identity, image-above-content placement and reversible context must survive.

## Shipped implementation

- extension/bookmarks.js renders a selected-object region above the list. A triangle opens it; a left arrow, Up or Esc returns through nested exploration, restoring list selection and scroll position.
- Folder exploration shows its Chrome children below the image. Native URL bookmarks have no Chrome child/notes/tag fields. When paired, the existing read-only catalog API can supply matching Atlas resource notes, tags and outgoing relationship rows below the image.
- Catalog matching uses exact web URL locator equality and kind bookmark. Native bookmark IDs are not Atlas resource IDs; this is an explicit limited adapter, not a completed stable identity mapping. No prefix/domain relationship inference is made.
- Image priority: chosen local cover, direct raster-image bookmark URL, then an explicitly related Atlas image with a direct HTTP(S) raster-image URL. Images render automatically when available in the explored view. No Open Graph scraper, arbitrary website fetch or favicon-as-cover assumption.
- Choose image accepts PNG/JPEG/WebP/GIF from an explicit file picker (up to 10 MiB), checks decoded dimensions (at most 40 million pixels), resizes the longest edge to at most 1200 pixels and stores a WebP cover. Animated input becomes a static representative frame.
- Covers use extension-local storage key atlasBookmarkCoversV1, keyed by native bookmark ID and guarded by exact current URL. Maximum encoded cover length 700,000 characters; cover-map serialized budget 4,000,000 characters. Save rejects over-budget or unsupported values. Remove chosen image clears the override, allowing the automatic source again.
- Cover references only permit bounded raster data URLs. Direct remote images use HTTP(S), recognized raster suffixes and no-referrer. Broken-image fallback leaves the title, return control and image chooser usable.
- Title activation queries the active tab in the last-focused browser window and updates that tab. It never falls back to creating a new tab. Executable and unsupported URL schemes remain blocked. Folder title activation retains folder navigation.
- Live native bookmark refresh, search, CRUD and folder ordering remain. Search exits the focused preview to show matching native bookmarks. Creating a bookmark while exploring a folder targets that folder; creation is disabled while exploring a URL bookmark.

No new extension permission, helper endpoint, native grant or third-party UI dependency was introduced.

## Implementation choices and limits

Local covers keep the first slice independent of helper availability. They are not yet part of portable Atlas graph export, browser bookmark sync or cross-device sync. Stable cross-provider identity, cover export/import and graph-linked local/R2 binary previews need a later coherent migration. Duplicate saved URLs can match multiple Atlas bookmark resources; all matching notes/tags are displayed rather than silently merging records.

Remote images contact their host when displayed; there is no background sweep of saved websites. Image URLs requiring unavailable authentication, hotlink permission or unsupported delivery can fail visibly. User-facing selection never grants arbitrary filesystem access.

The cover map uses a read/merge/write on current extension-local storage, not a transactional multi-window database. Concurrent edits to different covers can still race. Removed native bookmark covers are not automatically pruned in this slice; extension deletion clears that storage. No claim of complete lifecycle/export support.

Native URL bookmarks without matching connected graph metadata have no associated items to invent. The interface explains this. Companion failure must not prevent native bookmark or saved-cover browsing.

## Trace and evidence

- Owner direction: explicit discussion 2026-10-16, accepted triangle/title distinction and image-above-content placement.
- Logic: extension/bookmarks.js and extension/bookmark-covers.js.
- Presentation: extension/explorer.html and extension/explorer.css.
- Verification: scripts/test_bookmarks.mjs exercises current-tab update, no title/arrow double action, left-arrow/Esc restoration, persisted raster covers, picker encode path, rejected SVG selection, exact graph associations, blocked executable URLs, existing native CRUD and storage bounds using API/DOM doubles.
- Existing worker authority suite remains independent and must run unchanged.
- Packaging: scripts/package_extension.py emits unsigned development ZIP 0.1.6. Actual Chrome tab behavior, file picker/decoder, rendered proportions, screen reader behavior and native integration remain platform/browser acceptance gates.

## Owner acceptance steps

Reload the updated extension in the same unpacked folder to preserve its ID. Keep the current helper; no helper update is required.

Open Bookmarks → a folder. Click a bookmark triangle: image/chooser above, associated items below, left arrow visible. Choose a small image and confirm it survives Refresh and reopening. Click left arrow/Esc to return. Click a bookmark title and verify the current browser tab changes rather than a new tab opening.

For graph metadata, pair the existing helper and create an Atlas bookmark resource with exactly the same web URL, notes/tags and explicit outgoing links. Explore the native bookmark again. Verify metadata below the image. Verify disconnected operation separately. An image preview of a bookmark whose URL is a direct image should need no chosen cover.

This document records source and bounded tests, not owner-confirmed browser acceptance.

