// Layout operations permute positions; they never invoke window restoration.
// Apply the same operation to the restore baseline so later Restore changes size,
// not the deliberate placement the user just chose.
export function rearrange(preferences, action, index = 0) {
  if (action === "vertical") {
    preferences.reversed[index] = !preferences.reversed[index];
  } else if (action === "columns") {
    preferences.swapped = !preferences.swapped;
    preferences.ratio = 100 - preferences.ratio;
  } else if (action === "viewers") {
    preferences.viewerSwapped = !preferences.viewerSwapped;
  } else if (action === "explorers") {
    rearrange(preferences, "columns");
    rearrange(preferences, "viewers");
  }
}

export const regionExpanded = (mode, region) =>
  mode === region || mode === "both";
// A Preview's minimized/closed/expanded state follows its existing DOM/identity.
export function exchangeViewerState(state) {
  for (const target of [state, state.snapshot].filter(Boolean)) {
    [target.regions[0].viewer, target.regions[1].viewer] = [
      target.regions[1].viewer,
      target.regions[0].viewer,
    ];
  }
  const modes = state.maximized.slice();
  state.maximized = modes.map((mode, index) => {
    const hierarchy = regionExpanded(mode, "hierarchy");
    const viewer = regionExpanded(modes[1 - index], "viewer");
    return hierarchy && viewer
      ? "both"
      : hierarchy
        ? "hierarchy"
        : viewer
          ? "viewer"
          : null;
  });
}
export function exchangeViewerSizes(sizes) {
  const viewers = sizes.map((size) => size.viewer);
  return sizes.map((size, index) => ({
    ...size,
    viewer: viewers[1 - index],
    height: size.height - size.viewer + viewers[1 - index],
    ...(Number.isFinite(size.contentHeight)
      ? { contentHeight: size.hierarchy + viewers[1 - index] }
      : {}),
  }));
}
export const canResizeSections = (regions) =>
  regions.hierarchy === "normal" && regions.viewer === "normal";
