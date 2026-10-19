# 017 — Reported stutter after automatic cover fetching

**Status:** Automatic/retry rework reverted; root-cause latency diagnosis unresolved.
**Reported:** 2026-10-19 America/Chicago.

Owner reports lag/stalls/stutter since fetch rework and asks to revert it and add
an agent performance surface. No owner trace establishes causation. Reverted manual
fetch module/test to2cb4694 and restored manual UI; preserved preview/startup fixes
and existing user data. Historical automatic specification is retained as reverted.

Added opt-in bounded page-local atlasDebug.performance API for long tasks, event
queue/handler timing, frame gaps, timer drift, layout shifts, coarse resource timing,
source spans and mounted/loading DOM counts. Real Escape diagnosis remains016,
now explicitly unresolved after a continued report at about90MB memory usage.
Memory figure alone cannot identify timing cause. Default profiler is inactive;
all captures have deadline/cleanup and omit content/URLs. See PERFORMANCE_DEBUG_API.

Close only after real Chrome before/after/reproduction traces, no unsolicited
fetching, and acceptable measured scrolling/preview/Escape/startup behavior. API
unit tests and mock no-await close assertions are not measured latency evidence.


## 2026-10-19 owner scrolling capture and source correction

Owner reports scrolling stutters, lags and jumps. Supplied capture is saved at
`docs/evidence/performance-2026-10-19/OWNER_SCROLL_CAPTURE.json`. Exact source commit
of that capture is UNKNOWN; received after d95c7ac. In 15.224 seconds it counted29
long tasks and29 spans; retained28 render.window spans: median138.2ms, p95 219ms,
maximum351ms. Retained input queue delay median92.5ms, maximum245.8ms. Only24 cards
were mounted at end; one dialog was open. Retained spans do not include preview.close:
this establishes slow board rendering, not an isolated Escape root cause.

Source inspection found whole-board masonry recalculated on every scroll,
image-sized JSON signatures for mounted cards, and repeated linear saved-cover
alias scans/validation. These are observed source costs; their individual share of
the owner's timing is not yet measured. Lazy loading was never removed.

Correction: scroll reuses layout while item sequence, width, column count, gap and
held rectangles match. Data/image changes invalidate it; queued invalidation wins
over scroll. Resize rebuilds. Known unchanged image ratios reuse layout. Per-card
identity compares fields directly without serializing image bytes. A storage-
snapshot reader indexes aliases once and memoizes validation, preserving exact-ID
precedence, null suppression, safe reference checks and first-alias behavior. New
cover snapshots replace the reader. Unchanged card style values are not rewritten.
Layout ends are copied before composer adjustments so cached positions stay intact.

Fixed obligations: all cards remain reachable; viewport DOM stays bounded; images
remain lazy; manual Fetch and stored images/tags/notes stay unchanged. Constrained:
image dimensions, ranking/filtering, resize and hold changes must invalidate layout.
Fluid: ephemeral cache and rendering strategy. No storage schema/migration changes.

Added render.layout span for the next Chrome capture. Node DOM/API regression
checks pass for1,000 cards, scrolling/mounting, invalidation, snapshot cover safety,
large saved image references, gallery/navigation/tags and immediate close. These
are behavior checks, not measured real-browser speed. Owner before/after scrolling
and Escape acceptance remain OPEN.
