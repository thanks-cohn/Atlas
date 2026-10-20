// Session-only presentation state. Never owns resources, grants or background jobs.
export function windowState(dual = false) {
  return {
    closed: [false, !dual],
    regions: [
      { hierarchy: "normal", viewer: "normal" },
      { hierarchy: "normal", viewer: "normal" },
    ],
    maximized: [null, null],
    exclusive: null,
    snapshot: null,
  };
}
const copy = (value) => structuredClone(value);
export function restoreWindows(state) {
  if (state.snapshot) {
    const { closed, regions } = state.snapshot;
    state.closed = copy(closed);
    state.regions = copy(regions);
    state.snapshot = null;
  } else
    state.regions.forEach((region) => {
      region.hierarchy = "normal";
      region.viewer = "normal";
    });
  state.maximized = [null, null];
  state.exclusive = null;
}
export function maximizeWindow(state, index, region) {
  if (state.closed[index]) return;
  if (state.maximized[index] === region) {
    restoreWindow(state, index);
    return;
  }
  if (!state.snapshot)
    state.snapshot = {
      closed: copy(state.closed),
      regions: copy(state.regions),
    };
  state.maximized[index] = region === "pane" ? "hierarchy" : region;
}
export function restoreWindow(state, index) {
  if (!state.maximized[index]) return;
  state.maximized[index] = null;
  if (state.exclusive === index) state.exclusive = null;
  if (!state.maximized.some(Boolean)) restoreWindows(state);
  else if (state.snapshot)
    state.regions[index] = copy(state.snapshot.regions[index]);
}
export function minimizeWindow(state, index, region) {
  const restoring =
    !state.maximized[index] && state.regions[index][region] === "minimized";
  if (state.maximized[index]) restoreWindow(state, index);
  state.regions[index][region] = restoring ? "normal" : "minimized";
}
export function closePane(state, index) {
  if (state.closed.filter((closed) => !closed).length <= 1) return false;
  if (state.snapshot) restoreWindows(state);
  state.closed[index] = true;
  return true;
}
export function closeViewer(state, index) {
  if (state.maximized[index]) restoreWindow(state, index);
  state.regions[index].viewer = "closed";
}
export function toggleDual(state, keepIndex = 0) {
  if (state.snapshot) restoreWindows(state);
  state.closed = state.closed.some(Boolean)
    ? [false, false]
    : [keepIndex !== 0, keepIndex !== 1];
}
export function visiblePanes(state) {
  return [0, 1].filter(
    (index) =>
      !state.closed[index],
  );
}
