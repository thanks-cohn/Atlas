# 016 — Escape sometimes delays return to board

**Status:** Unresolved — owner reports continued Escape lag after close-path changes.
**Reported:** 2026-10-19 America/Chicago.

Owner requests Escape immediately return from preview to mounted pinboard. No
browser performance trace was supplied; original code relied on native dialog
cancel/close events. A main-thread stall can delay any keyboard handler and is not
proven eliminated by a close-handler change.

Added direct Escape/cancel -> closeDetail path with synchronous media-handler
invalidation and scroll unlock. No await, image completion, storage or board rebuild
is required for close. Preserve top nested image/tag dialogs and event handlers
which intentionally consume Escape. Closing invalidates pending gallery setup;
a late completion cannot reopen the preview. Generated-tag indexing yields after
roughly8ms work slices so background indexing can service other events.

Regression stalls preview setup, invokes Escape, asserts dialog closed and actual
mounted board-card objects unchanged before resolving setup, then confirms it does
not reopen. Actual keyboard-to-paint latency, long tasks and nested Chrome modal
behavior remain owner/browser acceptance. Do not promise to preempt arbitrary
synchronous JavaScript or claim all underlying lag causes diagnosed.


Owner follow-up: Escape still lags, browser page memory around90MB. This supersedes
any inference that the earlier change fixed perceived latency. Added opt-in timing
surface and deferred board layout/reset behind modals, resuming after a close-paint
opportunity. Root cause and real Chrome improvement remain unproven. Keep open.


Owner scroll capture now proves slow render.window work (median138.2ms, max351ms);
scroll caching/signature/cover-reader correction recorded in017. No retained
preview.close span, so Escape-specific before/after proof remains UNKNOWN/open.
