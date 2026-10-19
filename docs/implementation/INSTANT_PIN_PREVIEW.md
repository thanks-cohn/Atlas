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
