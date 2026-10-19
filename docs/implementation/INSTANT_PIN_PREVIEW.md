# Immediate pin preview and independent media

Owner intent: a pin opens a usable card immediately for notes and linked items.
The photograph must not gate those interactions. This is separate from tagging
worker background completion (backlog007), which remains unresolved.

Before: openDetail awaited ensureImages before opening the dialog. ensureImages
reads Chrome gallery storage and can initialize a legacy gallery from companion
annotations. Those waits could prevent any preview interaction.

Implemented: showModal and cached title, notes, bookmarks, tags and source controls
are populated synchronously. A cached gallery needs no new setup wait on opening.
Otherwise initialization continues after the shell opens. Late completion cannot
reopen a closed preview or replace another selected card. Same-card hydration
preserves the open connection panel and typed note draft, rekeying it to the real
image-entry identity. Cached metadata is immediately usable; unknown metadata is
still reported unavailable rather than fabricated. Writes retain existing adapters
and permission/transaction boundaries.

The image starts hidden behind a small Atlas A placeholder. load reveals it;
error leaves a clear unavailable message while connections remain usable. Missing
images show No image saved. Per-request image versions reject stale callbacks.
Linked bookmark image swaps use the same loader. Closing clears media handlers
and invalidates pending work. Same-card hydration keeps an already focused linked
image rather than unnecessarily switching back to the main photograph.

The screenshot's board perimeter also receives a 6px outward focus-outline offset,
keeping focus indication clear of card edges without changing masonry positions.
Cause/acceptance caveats are in backlog014; preview delay evidence is in013.

Verification: pinboard and preview-sections suites pass delayed-initialization,
close-before-resolution, placeholder load/error, stale callback and open-note draft
hydration regressions. Existing connected-item persistence tests pass. Browser
visual/perceived-latency acceptance is pending. No claim to remove unrelated main
thread stalls or instantly retrieve uncached companion records.


## Progressive pinboard startup and Escape follow-up

Owner also reports first-open blank canvas until all metadata finishes, and delayed
Escape returning to the board. Baseline before this follow-up:1bff1dda2b53669eab6110926ee9401520dab2ae.
refresh now draws bookmark cards after tree/collection selection, before saved-cover
storage, companion catalog or generated-index completion. Missing cover projections
have interactive Atlas placeholder/title rows. Saved covers/galleries load in
parallel, then cards reconcile; catalog/tags follow. Saved-board scope resolves
before initial paint. Filters remain in force, so image/tag-only collections may
need their corresponding metadata before displaying matches. Saved-title loading
still precedes initial cards to avoid the previously reported stale-title flash.

Automatic cover fetching treats cards as ineligible until local asset state is
known, preserving selected-cover checks and preventing needless initial network
requests for existing covers. Provisional preview gallery migration also awaits
that same local asset promise without delaying the open dialog. This avoids
creating an empty gallery while a previously saved cover is still unread.

Escape and native cancel call a direct no-await close helper: invalidate pending
preview/media callbacks, remove image source, unlock board scrolling and close.
No waiting for reads/inference/images and no board reconstruction. Nested image/tag
dialog handling is retained. Roughly8ms slices of generated-index work yield to
the event loop. JavaScript cannot service key input while an unrelated synchronous
long task blocks the browser; actual owner latency remains unmeasured.

Tests exercise blocked saved-image storage, blocked companion response and Escape
during pending setup, confirming visible cards and unchanged mounted board nodes.
Existing pinboard, preview-sections, Fetch and title regressions pass. See backlog
015/016 for accepted behavior versus source evidence and browser closure criteria.
