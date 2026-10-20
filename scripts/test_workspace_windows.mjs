import assert from "node:assert/strict";
import {
  windowState,
  maximizeWindow,
  restoreWindows,
  restoreWindow,
  minimizeWindow,
  closePane,
  closeViewer,
  toggleDual,
  visiblePanes,
} from "../extension/workspace-window-state.js";
const state = windowState(true);
minimizeWindow(state, 1, "hierarchy");
assert.equal(state.regions[1].hierarchy, "minimized");
maximizeWindow(state, 0, "viewer");
maximizeWindow(state, 1, "viewer");
assert.deepEqual(state.maximized, ["viewer", "viewer"]);
restoreWindow(state, 0);
assert.equal(state.maximized[1], "viewer");
restoreWindow(state, 1);
assert.equal(state.regions[1].hierarchy, "minimized");
assert.equal(state.snapshot, null);
assert(closePane(state, 0));
assert.deepEqual(visiblePanes(state), [1]);
assert.equal(
  state.regions[1].hierarchy,
  "minimized",
  "Close preserves the other region",
);
assert.equal(closePane(state, 1), false, "Last usable pane cannot close");
toggleDual(state);
assert.deepEqual(visiblePanes(state), [0, 1]);
assert.equal(
  state.regions[1].hierarchy,
  "minimized",
  "Dual reopens without clearing region state",
);
closeViewer(state, 0);
assert.equal(state.regions[0].viewer, "closed");
maximizeWindow(state, 1, "hierarchy");
restoreWindows(state);
assert.equal(
  state.regions[0].viewer,
  "closed",
  "Focus restore preserves closed regions",
);
maximizeWindow(state, 0, "pane");
assert.deepEqual(
  visiblePanes(state),
  [0, 1],
  "Expansion never hides another column",
);
restoreWindows(state);
assert.deepEqual(visiblePanes(state), [0, 1]);
assert.equal("resources" in state, false);
assert.equal("preferences" in state, false);
console.log(
  "PASS independent window modes, close/reopen, last-pane protection and exact session-state restoration",
);

const minimized = windowState(true);
minimizeWindow(minimized, 0, "viewer");
maximizeWindow(minimized, 0, "viewer");
minimizeWindow(minimized, 0, "viewer");
assert.equal(
  minimized.regions[0].viewer,
  "minimized",
  "Minimize a maximized region must retract even if the pre-focus state was minimized",
);

const activeRight = windowState(true);
toggleDual(activeRight, 1);
assert.deepEqual(
  visiblePanes(activeRight),
  [1],
  "Single Pane keeps the active column",
);
toggleDual(activeRight, 1);
assert.deepEqual(visiblePanes(activeRight), [0, 1]);

const {
  rearrange,
  exchangeViewerState,
  exchangeViewerSizes,
  canResizeSections,
  regionExpanded,
} = await import("../extension/workspace-arrangement.js");
for (const region of ["hierarchy", "viewer"]) {
  const s = windowState(true);
  minimizeWindow(s, 0, region);
  assert(!canResizeSections(s.regions[0]));
  maximizeWindow(s, 0, region);
  assert(
    canResizeSections(s.regions[0]),
    "Maximize normalizes the chosen minimized section",
  );
  restoreWindows(s);
  assert.equal(
    s.regions[0][region],
    "minimized",
    "Restore retains the intentional pre-expansion state",
  );
  minimizeWindow(s, 0, region);
  assert(canResizeSections(s.regions[0]));
}
const preferences = {
  ratio: 37,
  heights: [31, 68],
  swapped: false,
  viewerSwapped: false,
  reversed: [false, true],
};
const initial = structuredClone(preferences),
  expanded = windowState(true);
maximizeWindow(expanded, 0, "hierarchy");
maximizeWindow(expanded, 1, "viewer");
const initialWindows = structuredClone(expanded);
for (let repeat = 0; repeat < 40; repeat++) {
  for (const action of ["columns", "vertical", "viewers", "explorers"]) {
    rearrange(preferences, action, repeat % 2);
    rearrange(preferences, action, repeat % 2);
    assert.deepEqual(preferences, initial);
    assert.deepEqual(
      expanded,
      initialWindows,
      "Arrangement does not restore window state",
    );
  }
  exchangeViewerState(expanded);
  assert.deepEqual(expanded.maximized, ["both", null]);
  assert(regionExpanded(expanded.maximized[0], "hierarchy"));
  assert(regionExpanded(expanded.maximized[0], "viewer"));
  exchangeViewerState(expanded);
  assert.deepEqual(
    expanded,
    initialWindows,
    "Moved preview expansion is losslessly reversible",
  );
}
const minimizedExchange = windowState(true);
minimizeWindow(minimizedExchange, 0, "viewer");
maximizeWindow(minimizedExchange, 1, "hierarchy");
exchangeViewerState(minimizedExchange);
assert.equal(minimizedExchange.regions[1].viewer, "minimized");
assert(!canResizeSections(minimizedExchange.regions[1]));
restoreWindows(minimizedExchange);
assert.equal(
  minimizedExchange.regions[1].viewer,
  "minimized",
  "Restore baseline follows the moved Preview",
);
const sizes = [
  { height: 700, hierarchy: 300, viewer: 350 },
  { height: 700, hierarchy: 450, viewer: 200 },
];
assert.deepEqual(
  exchangeViewerSizes(exchangeViewerSizes(sizes)),
  sizes,
  "Allocation follows the Preview, not its destination slot",
);
console.log(
  "PASS arrangement round trips, moved expansion/minimize/restore state, normalized rail availability and panel-associated size metadata.",
);
