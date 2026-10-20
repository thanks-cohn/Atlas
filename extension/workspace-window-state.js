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
  const target = region === "pane" ? "hierarchy" : region;
  state.regions[index][target] = "normal";
  state.maximized[index] = target;
}
export function restoreWindow(state, index, region = null) {
  if (!state.maximized[index]) return;
  state.maximized[index] =
    region && state.maximized[index] === "both"
      ? region === "viewer"
        ? "hierarchy"
        : "viewer"
      : null;
  if (state.exclusive === index) state.exclusive = null;
  if (!state.maximized.some(Boolean)) restoreWindows(state);
  else if (state.snapshot) {
    state.regions[index] = copy(state.snapshot.regions[index]);
    if (
      state.maximized[index] === "hierarchy" ||
      state.maximized[index] === "both"
    )
      state.regions[index].hierarchy = "normal";
    if (
      state.maximized[index] === "viewer" ||
      state.maximized[index] === "both"
    )
      state.regions[index].viewer = "normal";
  }
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
  return [0, 1].filter((index) => !state.closed[index]);
}
