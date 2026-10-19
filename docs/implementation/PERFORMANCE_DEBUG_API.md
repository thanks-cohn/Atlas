# Agent performance debug surface

**Status:** Implemented extension-page instrumentation with deterministic tests;
real owner Chrome latency capture is still required. This is a measurement surface,
not proof that Escape lag or all stutter has been eliminated.

## Why this exists and what was reverted

Owner reports stutter after automatic viewport Fetch was introduced and continuing
Escape lag despite an approximately90MB browser memory reading. Memory size alone
does not identify input queue delay, main-thread work, layout or painting cost.
We must measure those paths instead of treating a no-await close handler as proof
of perceived responsiveness.

The automatic-fetch/two-retry rework is reverted to its pre-change manual fetcher:
`extension/fetch-covers.js` and its Fetch test match commit
`2cb4694129c76da6d1590f24e52f0a235d7b31ce`. Restored the original manual fetch dock
and removed the automatic-fetch checkbox. No requests start merely because cards
enter view. Explicit Visible/All/per-card Fetch still exists with the prior
permission/queue behavior. The new automatic v2/v3 attempt history is not erased,
but the restored manual code only reads its old v1 format, so the new persistent
two-retry policy no longer applies. Saved covers/notes/tags/galleries remain.
Later immediate-preview/progressive-startup changes are retained rather than
resetting the entire repository to an old commit.

## API location and opt-in contract

In the **Atlas extension page's own JavaScript context**:

```js
window.atlasDebug.performance
```

It is installed in Pinboard and the Explorer/shelf. It creates no observers,
requestAnimationFrame sampling loop, heartbeat or keyboard listeners until
explicitly started. Application spans are no-ops while capture is off. Reports
stay in page memory: no automatic storage writes, uploads, networking or new
permissions. Capture defaults to10s and is capped at30s, then disconnects observers,
listeners, frame sampling and timers. Stop explicitly when finished.

To capture startup, append `debugPerformance=1` to the pinboard/explorer URL and
reload. Preserve an existing board query, e.g. `?id=BOARD_ID&debugPerformance=1`.
This starts one30s capture from the head script; it does not enable automatic
Fetch. Ordinary reload without that parameter leaves capture off.

## Minimal manual diagnosis

Open the pinboard, inspect that extension page with Chrome DevTools, then:

```js
atlasDebug.performance.start({durationMs: 15000});
```

While recording, scroll, open a card, expand Notes, then press real Escape several
times. After reproducing:

```js
const report = atlasDebug.performance.stop();
console.log(report);
console.table(atlasDebug.performance.check().rules);
// DevTools-only helper, if a user/agent wants to share a report:
copy(JSON.stringify(report, null, 2));
```

A CDP/browser automation agent can evaluate the same methods inside the extension
page. Real browser input generated through browser automation is preferable to
`dispatchEvent`: synthetic JavaScript events do not establish real input latency.
The returned structure is serializable JSON (`schema: atlas.performance.v1`).
Keep exports with the exact source commit, browser version, viewport, card count,
steps and whether DevTools/CPU throttling were active. Repeat the same scenario
before/after a change; do not compare a cold startup with a warmed-up board.

## API methods

| Method | Purpose |
| --- | --- |
| `start({durationMs:10000})` | Clear previous capture and begin bounded measurement; returns configuration |
| `stop()` | Stop capture, release instrumentation and return snapshot |
| `snapshot()` | Read current/last report without starting capture |
| `clear()` | Clear samples/counters; does not stop an active capture |
| `check({frameGapMs:50,inputMs:100,loopDriftMs:100,interactionMs:100})` | Flag retained samples over exploratory budgets; report insufficient data explicitly |
| `probe({durationMs:2000})` | Start a short capture, wait for its bounded duration, stop and return report |
| `begin('safe.label')` | Return an idempotent end function for an application span; no-op if off |
| `afterPaint('safe.label')` | Measure to a double-rAF paint opportunity; hidden/inactive/cancelled/timeout statuses are explicit |
| `isActive()` | Whether capture is active |
| `register(name, handler)` | Add an explicitly invoked page-specific scenario |
| `run(name, options)` | Execute a registered scenario only during active capture; reject unknown/off captures |

Labels accept a limited64-character identifier alphabet. Avoid private data in
custom labels. The built-in instrumentation does not collect URLs, bookmark/card
names, notes, image contents, typed keys, tokens or error stacks. Resource events
retain only coarse initiator category and duration. Script errors retain a count
and generic category, not their messages or source URLs.

## Built-in Pinboard exercise

With the board loaded and all dialogs closed:

```js
atlasDebug.performance.start({durationMs: 15000});
await atlasDebug.performance.run('pinboard.preview-cycle', {cycles: 3});
const report = atlasDebug.performance.stop();
console.log(report.summary);
```

This opens the first visible card, waits for a paint opportunity, closes it, waits
again and repeats (maximum10 cycles). It never automatically runs on normal page
load. It rejects a pre-existing open dialog and reports if no visible card exists.
It performs ordinary preview behavior; legacy gallery initialization may persist
its normal migration. It does not deliberately generate tags, remove data, edit
notes or fetch covers. Do not call it a purely read-only transaction. The scenario
exercises the close function, not real Escape keyboard delivery; use actual Escape
input separately to investigate event queue latency.

## Measurements and how to interpret them

| Signal | Meaning and limitation |
| --- | --- |
| `longtask` | Browser-observed main-thread long tasks, when supported; duration does not identify an exact function without a DevTools trace |
| `event` | Browser Event Timing duration plus queue/handler components; feature/threshold support varies |
| `input` | Trusted pointer/key/wheel event timestamp to handler arrival; typed key is never stored; not end-to-end INP |
| `paint` | Time to double-rAF opportunity after a named action or input; approximate rendering opportunity, not a pixel-level presentation timestamp |
| `frame` | Gaps between sampled rAF callbacks; a large gap suggests stalled/delayed frames, not automatically a measured GPU root cause |
| `loop` | Drift of a50ms heartbeat while visible; helps distinguish event-loop blocking from slow requests |
| `layout` | Layout-shift values without recent input, when supported; not a complete CLS certification |
| `resource` | Coarse img/fetch/XHR/other response duration; no endpoint stored; slow requests do not alone prove UI blocking |
| `span` | Explicit source paths including `render.window`, `index.generated-tags`, `load.companion-metadata`, preview handlers and `explorer.navigate` |
| `dom` | Snapshot counts for mounted cards, loading images, open dialogs and the pinboard scroll-lock flag |

Startup marks include first cards and saved covers; capture-start-relative `at_ms`
indicates when they are reported. Their `duration_ms` covers the paint opportunity
after the source render call, not the entire startup. Use early query capture to
observe startup rather than starting after the cards already appeared.

API snapshots include UTC capture start, elapsed time, visibility, supported browser
entry types, total counts, bounded samples, dropped-sample count and retained-window
p50/p95/max groups. There are at most8 pending paint probes; excess bursts are coalesced and counted.
The buffer holds at most240 samples and at most60 per type;
frame traffic preferentially evicts frame/loop/resource samples rather than all
interaction spans. Totals count events even when an old sample is dropped.
Percentiles and budget checks refer to retained samples only, not all activity.

Unsupported observers are reported false, not fabricated as zero latency. A budget
with no relevant observations reports insufficient-data. Hidden-tab frames/timer
sampling are excluded/reset; background timer throttling should not masquerade as
foreground stutter. Sampling itself can perturb timings: compare with DevTools
traces and captures off. Debug instrumentation is intentionally not continuous.

## Escape mitigation and investigation still open

The no-await Escape/cancel/X close helper is retained. Board window/layout rebuilds
and resets now defer while the preview/image chooser is open. Existing mounted
cards stay behind the dialog. After close, two frame callbacks plus a task boundary
allow the close to paint before deferred masonry runs. Reopening a dialog keeps
that deferred work pending rather than rebuilding under the user.

This avoids one identified source path for background work competing with Escape;
it does **not** prove that this was the owner's root cause. Existing generated-tag
indexing yields after approximately8ms work slices. Other synchronous work, style,
paint, native-dialog focus restoration or third-party/browser effects can still
require investigation. Backlog016 remains unresolved after the owner's continued
lag report. Use the capture to distinguish input delivery, close-handler duration,
paint delay and deferred render cost; don't close the issue from mocked timings.

## Verification and acceptance

`test_performance_debug.mjs` uses a deterministic clock/browser double to verify
opt-in/off behavior, deadline cleanup, bounded sampling, capability gaps, trusted
input flags, over-budget reporting, data omission, hidden-tab exclusion, paint
cancellation and scenario registration. This validates the API contract, not real
browser speed. The pinboard suite tests delayed startup/preview, unchanged board
nodes on close and deferred background rebuilds. Fetch tests verify the restored
manual implementation. Existing bookmark, explorer-entry, recovery, preview-section,
connection and saved-title suites pass.

This environment has no local Chrome executable; no real Chrome latency capture
or measured before/after improvement is claimed. Required project-suite results
are recorded in STATUS_AND_CONTINUATION. Remaining acceptance: repeatable owner
Chrome Escape trace and viewport scrolling/startup measurements with capture off
and on, then evidence-backed profiling/fixes for the actual over-budget spans.
