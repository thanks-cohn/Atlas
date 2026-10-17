# Associated Pages and the Gallery template

Date: 2026-10-16 (America/Chicago). Extension 0.1.7.
Status: first implemented local page slice; browser/visual acceptance remains NOT_RUN locally.

## Owner direction and rationale

The owner requested an **Associated Items** heading with **Add Item** immediately beneath it, including the ability to create a Page. Template choice must be separate from the Page object. The first default is a polished Gallery template, **not Horizons v1**. Horizons remains a distinct planned option.

Current image sources are **URLs and local files**. R2 integration is future work. When publishing later, local image dependencies must be identified and the user asked to authorize sending them to the proper R2 destination before references are rewritten.

These choices preserve modularity: a Page has stable identity and content independent of its presentation; association with a bookmark is a separate placement.

## Current behavior

Explore a native bookmark through its triangle → image appears above → **Associated Items** → **Add Item** → Page → enter a title → Gallery is the default template → Create Page. The new page link appears immediately under Associated Items. It opens a separate extension page at page.html?id=UUID. Creating and browsing these pages does not require the companion.

The template selector shows Gallery as available and Horizons v1 as planned/unavailable. It does not pretend an unfinished renderer works. The previous suggested plain standard-page default was superseded by the owner's Gallery choice before delivery.

Gallery presentation uses a quiet warm-white editorial layout, a generous title/intro, masonry image columns, restrained gold accents, captions, responsive spacing and a dark expanded-image viewer. Images retain their proportions; a narrow screen uses one column. Hover motion respects reduced-motion preferences.

Edit Gallery provides title, introduction, local file selection, image URL entry, captions, removal and move-earlier ordering. Changes are staged until Save. Cancel discards the staged edits; leaving with unsaved edits requests the browser's usual confirmation where supported.

The expanded viewer has previous/next controls, Left/Right keys, wraparound and native dialog Esc/focus handling. There is no autoplay. Remote failures show an explicit unavailable-image message rather than HTML injection or an inferred substitute.

## Data and resource contracts

Implementation:
- extension/pages-store.js: versioned entities, bookmark placement, validation and revision checks.
- extension/page.html, page.js, page.css: first-party Gallery page/editor/viewer.
- extension/image-file.js: explicit raster-file decode and re-encoding.
- extension/bookmarks.js: creation control and associated-page links.

Page entities use separate extension-local keys atlas.page.v1.UUID; bookmark placements use atlas.items.v1.nativeBookmarkID with the exact bookmark URL guard. A changed URL cannot inherit an old URL's links merely through an ID match. A page retains its own UUID regardless of title changes.

Current page fields: version, id, kind=page, template=gallery, title, text, images and revision. Each image has an independent id, sourceKind (local or url), source and caption. Display source and underlying origin kind remain distinguishable for future publishing checks.

Writes use a shared browser Web Lock and optimistic page revision checks. A stale editor cannot silently overwrite a newer saved revision. Multi-key creation requests page and placement in one storage.set call; no cross-store transaction guarantee is claimed.

The Gallery first-slice bounds are 24 images, title length 200, introduction 100,000 characters, caption length 300, encoded local image length 700,000 characters and whole-page serialized length 4,000,000 characters. Browser extension storage capacity still applies across all pages/covers; a quota error leaves the editor open. UI describes these approximately as storage budgets, not lossless original-file archival.

Chosen local PNG/JPEG/WebP/GIF files up to 10 MiB are decoded, checked against 40 million pixels, resized to a maximum 1600-pixel edge and re-encoded as WebP. This stores a representative working image, not the untouched original. Animated input becomes static. Originals are not deleted or moved. The original local file path is not retained.

Image URLs accept public HTTP(S) references; executable/file schemes, embedded credentials and obvious signed-token URL forms are rejected. Remote images load through the browser image element with no-referrer. The page does not fetch arbitrary HTML, scrape websites or create new host permissions. A public URL already hosted on R2 can behave as an ordinary URL; this is not authenticated bucket integration.

## Publishing readiness, not deployment

Publishing Check reports counts of local versus already referenced images and explains the future R2 transfer requirement. It explicitly states no upload or deployment is available or performed in this build.

Future publication contract: select/confirm an authorized R2 bucket and location → request approval for local-image upload → upload and verify → replace publication references with appropriate durable hosted references → publish only after all required assets are ready. Preserve local working data until verification. Private/authenticated R2 access, retries, destination selection and actual publishing remain unimplemented; no local source is silently treated as publicly reachable.

Local page entities and images are not yet integrated into companion graph export, project ZIP export, cloud sync or an import/migration workflow. Deleting the extension removes this local data. Native bookmark deletion can leave an orphan page entity; no automatic destructive cleanup is implemented. This limited slice must not be represented as the complete durable publishing system.

## Evidence and acceptance

PASS locally:
- scripts/test_pages.mjs: stable creation/linking, Gallery default, disabled unfinished template, save/reload, stale-revision rejection, local/URL preservation, publishing readiness, unsafe-source rejection, editor/viewer behavior through API/DOM doubles.
- scripts/test_bookmarks.mjs: actual Add Item form handler, page creation and visible dedicated-page link; existing exploration/title/image/CRUD checks.
- scripts/test_extension_broker.mjs: 20 unchanged worker authority tests.
- Static HTML control-ID checks, diff whitespace and reproducible unsigned extension packaging.

The new page suite is added to the existing hosted verification workflow. No Python/native code changed, so the prior full-suite native-readiness failure is not relabeled as fixed. Actual Chromium file decoding, Web Locks, visual composition, native dialog/focus, tab navigation and pixel behavior remain NOT_RUN locally.

Owner acceptance: reload the same unpacked extension folder → explore bookmark → Add Item → Page → create Gallery → open link → Edit Gallery → add one local image and one URL → Save → reload → inspect proportions/captions → expand image and test arrows/Esc → verify Publishing Check identifies the local image without uploading anything.

Aesthetic quality is an owner acceptance goal, not established by DOM doubles. Refine it using actual rendered evidence while preserving the data, privacy and interaction contracts.

