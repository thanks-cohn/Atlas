# Pinboard v1 — bookmarks become a presentation

## Owner purpose and scope

Atlas should turn existing organizing work into a publishable presentation. The first Pinboard template draws on familiar Pinterest-style browsing conventions without requiring users to retype bookmark titles, reconnect links or upload the same representative images again. This slice is an extension-local, bookmark-backed preview, not Cloudflare publishing or a generic page composer.

Owner decisions: image click explores inside Atlas; the linked title/URL opens the original source. Existing covers take priority, then known associated image references. With no known image, show a slim URL card and an accessible + action to add one. No automatic site scraping is necessary to start. The existing gallery and Story templates remain available as separate choices.

## Entry points and records

- Shelf sidebar: **Pinboard** opens `extension/pinboard.html`, immediately browsing all native web bookmarks.
- Bookmark Associated Items → Add Item → **Pinboard**: enter a title, choose All bookmarks or a native folder, and create a live board reference. Open its associated link to browse it. Delete removes the board definition, not bookmarks or covers.
- `extension/pinboard-model.js`: version-1 `atlas.pinboards.v1` map. Each board has a UUID, title, folderId and exact sourceBookmark ID/URL binding. Up to 100 board definitions. Actual bookmarks remain Chrome's authoritative tree; the board does not copy their records or reorder Chrome bookmarks.
- `extension/pinboard.js`, `.html`, `.css`: standalone extension page. Browser APIs are adapters; tree filtering and record checks live in the pure model.

Board definitions and covers are currently Chrome-profile local storage. They are not saved in the companion SQLite library. Removing the extension/profile can remove them. This is an explicit limitation, not a fulfilled portability claim. No R2, authorization, upload or deployment operation is added.

## Interaction and data boundaries

HTTP(S) bookmarks without embedded credentials are browsable. Script/file/internal URLs never become clickable pinboard links. DOM text uses textContent, not HTML interpolation. Public image references pass existing image URL validation; uploaded covers use the existing bookmark cover map and exact bookmark ID/URL matching. The shelf and pinboard use the same browser lock when merging cover updates. New uploads use the existing bounded raster conversion with a 60,000-character preview budget and existing 4,000,000-character total cover quota; errors preserve previous records. Originals are not separately archived by this cover operation.

Each card either presents an image, linked title and source hostname, or a narrow full-URL card with +. Image click opens an in-page modal with the full uncropped image, bookmark title, known associated notes/tags and explicit source link. Escape closes the modal; background scrolling is locked while open. Source links open a separate tab with noopener/noreferrer, retaining board position. A broken card image falls back to the narrow URL/+ presentation.

A single optional authenticated `/v1/catalog` read supplies exact URL-matched Atlas notes/tags and known related image URLs. A URL/resource index avoids per-bookmark network requests. No Open Graph crawl, favicon-as-cover substitution, screenshot capture or HTML fetch is implemented. Offline/companion-unpaired browsing still works with native bookmarks and saved covers. Refresh rereads bookmarks/covers; live subscriptions and automatic remote refresh are not implemented.

## Scale and deliberate tradeoff

Read bookmark metadata once through chrome.bookmarks.getTree. Render 24 cards first; IntersectionObserver adds batches of 24 near the bottom. The mounted window caps at 96 cards, after which **Next set** replaces it with the next window. Previous set and a manual Show more action are available. Image elements use native loading=lazy and decoding=async. Search debounces for 160ms and filters titles/URLs; folder views include descendants. CSS multi-column masonry provides variable image heights with no layout library.

This is bounded incremental rendering with paging, not a fully virtualized continuous infinite canvas. The explicit window boundary keeps the implementation inspectable and avoids retaining 1,000 rendered cards/decoded image elements. Chrome may retain its own image caches; remote direct-image sizes are not controlled. 1,000 bookmark metadata records are still held in memory. A 4 GB machine is a design target, not a verified performance guarantee. Real hardware network, memory and scrolling measurements are NOT_RUN.

## Verification and continuation

`node scripts/test_pinboard.mjs` exercises 1,000 bookmark records, DOM cap, batch/paging behavior, folder filtering, unsafe URL rejection, record identity, separate image/source actions and image-free + cards using DOM/API doubles. `scripts/test_bookmarks.mjs` covers creation/deletion from Add Item and exact association. Existing gallery behavior checks remain green. Extension packaging includes the four new runtime files without added dependencies.

Not yet verified: actual Chrome visual ordering, keyboard/focus behavior, resize/column reflow, image decoding/memory on constrained hardware, cross-tab conflict behavior under real user activity. Not implemented: standalone React wrapper, portable pinboard export, companion backup, publishing, drag ordering or inherited project privacy rules. Before public publishing is added, define explicit bookmark/folder selection and private/public filtering; browsing native bookmarks is not consent to publish all of them.


## 0.1.38 — Continuous bounded scrolling and image-source choice

Owner replaces explicit Next set browsing with a configurable nearby-card window. The image filter is labeled **Only show bookmarks with images** and uses known covers/direct-image references/associated images; it does not crawl sites. Pinboard settings persist a 24/48/72/96/144-card maximum (default 72) and filter preference under `atlas.pinboard.settings.v1`. Invalid stored caps fall back to 72.

The renderer keeps a window of 24-card masonry blocks around the current scroll position. Removed blocks retain only estimated/measured heights in a lightweight map; top/bottom spacers preserve the scrollable extent. Scroll processing is coalesced with requestAnimationFrame; ResizeObserver remeasures mounted blocks after image/column changes. Above-view height corrections adjust the anchor. Distant blocks are removed and reconstructed when users scroll back. A stable board container receives focus if a focused card must be evicted. This block-based implementation preserves the hard DOM cap; block height estimates and image reflow still need real-browser QA, particularly at extreme scroll speed and resize.

Image cards show a static Atlas A mark and Loading image… until loaded, then a short opacity reveal. There is no animated shimmer or per-card polling loop. Failed images become URL/+ cards. Browser/network caches and decoded images remain browser-managed; removing DOM nodes cannot guarantee immediate memory reclamation. A 4 GB machine remains an unverified target, not a crash-proof guarantee.

**+** and Change image now open an image-source dialog: Upload image (existing bounded local preview conversion) or Use image URL (a validated public HTTP(S) reference up to 8192 characters). The reference is stored in the existing shared bookmark-cover record, without downloading a durable copy. `safeCoverReference` broadens the existing cover representation to accept explicit public URL references as well as safe raster data previews; script/data-SVG/credential-bearing/signed-token references are rejected. Older extension versions may ignore URL covers. Chrome-profile storage and the total cover quota remain unchanged.

Verification: 1,000-bookmark fixture tests exercise forward/back eviction/recreation, hard caps across extreme jumps, spacer extent, saved limit/filter settings, placeholder readiness, source URL validation and shared cover resolution. Existing bookmark and gallery checks plus packaging PASS. Real Chrome 4 GB memory/frame-time, focus and masonry scroll-anchor verification NOT_RUN.
