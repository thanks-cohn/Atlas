> Current follow-up: renderer revision3 limits mounted cards to the viewport plus
> ONE preceding/following card per column; see backlog020. Older count-driven
> buffer descriptions below are historical. Startup tiny batches remain planned.

# Pinboard scrolling performance and autonomous reproduction

Owner reports: rapid up/down scrolling stutters, jumps and seems to catch up;
clicking several images sometimes fails to open them, and Escape slows after use.
These symptoms remain open until actual browser evidence confirms the correction.

## Evidence and implementation

The owner's supplied capture is `docs/evidence/performance-2026-10-19/OWNER_SCROLL_CAPTURE.json`.
It retained28 board render samples: median138.2ms, maximum351ms. Only24 cards were
mounted at capture end. Lazy `img.loading` and bounded card eviction were present.
Thus rendering every bookmark in the DOM is not established as the cause. The
capture has no retained preview.close span and does not isolate missed clicks.

Commit e1a7f77 added layout caching, snapshot cover lookup and direct card signature
comparison. This follow-up removes the remaining per-scroll full-array sort and
full-array viewport scans. A Y-sorted position index with prefix maximum bottom
edges allows binary search around the viewport, including irregular held cards.
Nearby cards are selected by walking outward until the buffer budget is full.
Only chosen indices are sorted/grouped. Position maps and sorted indices rebuild
when layout changes, not while scrolling an unchanged board. Mounted card image
signatures need not be reread when the layout/data snapshot is unchanged. Ordinary
scrolling also skips per-card anchor rectangle reads; image/layout changes retain
anchor preservation. Existing animation, modal deferral and manual Fetch remain.

The existing scheduler already coalesced scroll requests into one animation-frame
callback. This change reduces its work; it does not claim to newly introduce that
coalescing or to preempt arbitrary synchronous JavaScript. A 1,000-event regression
checks one queued callback, latest viewport coverage, fewer than200 inspected
positions for1,000 cards, and zero card creation for an unchanged viewport. Existing
all-visible-card, eviction, held-card, ranking, geometry and gallery tests pass.
These are algorithm/behavior proofs, not measured Chromium latency.

Fixed: retain saved content, lazy images, reachable cards, viewport mounting and
permissions. Constrained: resize, image size/error, source data, filters/ranking and
hold changes invalidate geometry; visible cards can exceed a tiny buffer budget.
Fluid: ephemeral indices/cache, selection algorithm and performance instrumentation.

## Debug API additions

`atlasDebug.performance.snapshot()` includes numeric-only `application.pinboard`:
renderer_revision2, total_items, mounted_cards, nearby_budget, layout_dirty,
window_update_pending, layout_blocked, assets_ready, held_cards, layout_positions.
No card content, URLs, notes or typed keys are included.

Capture-wide bounded aggregates (`measurements`, up to32 names) retain count,
sum, minimum, maximum, last and mean even when individual samples are evicted:

- `render.positions-inspected`: actual viewport/neighbor candidates examined.
- `render.layout-reused`:1 for reuse,0 for rebuild.
- `render.cards-created` and `render.cards-reused`: DOM work per update.
- `time.render.window`, `time.render.layout`, `time.render.select`,
  `time.render.mount`: timed source phases; individual span samples also remain.

Input capture now includes clicks alongside pointerdown/keydown/wheel. Capture is
still opt-in, bounded to30 seconds, deadline-cleaned and never uploads itself.
State readers return only finite numbers/booleans, max8 readers and32 fields each.
Measurements are inactive until capture starts. Real trusted input and synthetic
scenarios must not be presented as interchangeable evidence.

```js
const p = atlasDebug.performance;
p.start({durationMs: 30000});
await p.run('pinboard.scroll-stress', {steps: 24, distance: 1500});
await p.run('pinboard.preview-cycle', {cycles: 3});
const report = {check: p.check(), capture: p.stop()};
copy(JSON.stringify(report, null, 2));
```

Scroll-stress is explicit, max60 steps, restores initial scroll and refuses an
already-open dialog. It measures synthetic scroll, not human wheel input. Scenarios
cannot overlap; stopping/restarting invalidates the running scenario's capture
scope. Preview-cycle can invoke normal legacy gallery initialization; use fixture
storage when exercising this automatically rather than a person's profile.

## Browser runner for future agents

`scripts/benchmark_pinboard_browser.mjs` runs actual Chromium layout/paint and
trusted Playwright wheel/click/Escape input against the unchanged extension UI
served on loopback, with a clearly isolated synthetic Chrome API/storage shim.
It creates1,000 bookmarks by default, substantial data-URI saved covers, a24-card
nearby budget and deterministic local image responses. External network requests
are blocked. It uses a fresh browser profile and never reads a user's bookmarks,
extension storage, credentials or companion. It is NOT an MV3/native integration
test and does not reproduce the owner's hardware automatically.

Requires an existing Playwright installation and Chromium executable:

```sh
node scripts/benchmark_pinboard_browser.mjs --chromium /path/to/chromium \
  --cards 1000 --budget 24 --cpu 4 --output /tmp/atlas-browser-performance.json
```

Use `--source-root /path/to/other/Atlas` to benchmark another checkout with the
same harness. Compare d95c7ac, e1a7f77 and the current source under identical browser,
fixture, CPU and viewport settings. Add `--require-budget` for a nonzero exit when
an observed responsiveness budget fails. Missing observations remain insufficient
rather than passing. Open/close failures or page errors fail regardless of timing.
Capture includes fixture/browser identity, phase measurements and checks. Source
revision should be recorded separately with each experiment. HTTP/shim results
must be followed by actual extension testing for worker, permissions and native IO.

Execution here: deterministic Node regression suites PASS and runner syntax PASS.
Chromium execution BLOCKED: no local executable; Playwright's download returned
truncated/non-ZIP data. No browser speedup or successful runner execution is claimed.
Next agent should run the browser runner when Chromium is available, persist the
before/after JSON, then investigate render.mount/image decode/GC or native callbacks
if they still dominate. Owner Escape/missed-click acceptance remains open in018/016.

## Primary references consulted

- https://web.dev/articles/virtualize-long-lists-react-window — visible window and bounded overscan.
- https://www.w3.org/TR/longtasks-1/ — long tasks and queued input.
- https://developer.chrome.com/docs/devtools/performance/reference — separate scripting, rendering and interaction timing.

No framework dependency is needed for this plain-JavaScript position index.

## One-row follow-up

Per-column sorted lists replace nearest-neighbor count filling. Every visible card
is retained; up to one offscreen card per column above and below is allowed. A
large old buffer setting cannot enlarge the spatial bound. Debug renderer revision3
adds overscan_rows1, visible/buffer counts, viewport bounds and evicted-card counts.
Performance DOM snapshots also report total elements, image elements and tag buttons
so future traces need not infer whole-page size from mounted cards alone.
Node fast-reversal/desktop/mobile tests pass; real Chromium timing remains pending.
