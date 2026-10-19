# Fast scrolling stalls, missed image clicks and delayed Escape

Status: source corrections and debug tooling implemented; real-browser acceptance OPEN.

Owner direction: investigate real solutions and make the debug surface useful to
future agents without requiring the owner to describe/reproduce every issue.
Owner observes fast up/down scrolling causes catch-up/jumps, several image clicks
do not open previews, and Escape is slower after interaction than at first load.
No post-e1a7f77 trace or exact running source version has been supplied.

Atlas already windowed cards, used lazy images and coalesced scroll callbacks.
The prior owner trace ended with24 mounted cards, not the complete bookmark set.
Do not blame unlimited DOM growth, claim AJAX would fix it or claim an Escape
handler can preempt an already-running long task. Missed click root cause UNKNOWN.

Follow-up removes remaining full-list sorts/scans on cached scroll, uses indexed
viewport selection, reuses position maps/card identity, skips scroll anchor reads
and clears evicted image handlers so their late load/error events cannot schedule
more layout. Scroll eviction also removes the detached image src; layout/ranking
changes retain visual sources for bounded exit animations. Source and original
saved bytes remain intact. Reset/replaced cards release old image handlers too.

Debug API records numeric renderer state and capture-wide phase/work aggregates,
including mount/reuse and candidate counts; includes click timing, non-overlapping
scoped scenarios and explicit scroll-stress. An isolated Chromium fixture runner
adds trusted wheel/click/Escape inputs, CPU throttling and budget checks. Chromium
execution was attempted but BLOCKED by missing browser/truncated download here.
Node behavior tests are not actual timing proof. See
`docs/implementation/PINBOARD_SCROLL_PERFORMANCE.md` for exact continuation,
commands, measured evidence, unknowns and primary references.

Acceptance: repeated fast scrolling must remain smooth; current-viewport image
clicks open reliably; Escape closes promptly even after prolonged interaction;
DOM/handlers/queued updates remain bounded. Preserve lazy loading, images/tags,
held-card behavior, all-visible coverage and manual Fetch. Obtain real browser
before/after evidence and keep016/017 open until their acceptance passes too.
