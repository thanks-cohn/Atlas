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
assert.deepEqual(visiblePanes(state), [0,1], "Expansion never hides another column");
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
