import {
  rearrange,
  regionExpanded,
  exchangeViewerState,
  exchangeViewerSizes,
  canResizeSections,
} from "./workspace-arrangement.js";
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
} from "./workspace-window-state.js";
import { createCommandDock } from "./workspace-command-dock.js";
export function createWorkspaceWindows({
  panes,
  getPreferences,
  setPreferences,
  layout,
  save,
  setActive,
  getActive,
}) {
  const $ = (id) => document.getElementById(id);
  let state = windowState(),
    initialized = false,
    focusMemory = null,
    expandedSizes = null;
  const regionMemory = new Map(),
    paneMemory = new Map();
  const label = (index) =>
    (getPreferences().swapped ? 1 - index : index) ? "right" : "left";
  function capture() {
    return {
      panes: panes.map((p) => ({
        epoch: p.epoch,
        preview: p.preview,
        tab: p.previewTab,
        scroll: [
          ...p.dom.querySelectorAll(".items,.breadcrumb"),
          ...p.viewerDom.querySelectorAll(".viewer-content"),
        ].map((node) => ({ node, top: node.scrollTop, left: node.scrollLeft })),
      })),
      root: { top: $("panes").scrollTop, left: $("panes").scrollLeft },
      page: {
        top: document.scrollingElement.scrollTop,
        left: document.scrollingElement.scrollLeft,
      },
    };
  }
  function restoreScroll(memory, onlyIndex = null, region = null) {
    if (!memory) return;
    const ownerIndex =
      onlyIndex !== null && region === "viewer"
        ? panes.findIndex(
            (p) => p.viewerDom.parentElement === panes[onlyIndex].dom,
          )
        : onlyIndex;
    for (const [i, saved] of memory.panes.entries()) {
      if (onlyIndex !== null && i !== ownerIndex) continue;
      for (const s of saved.scroll) {
        const viewer = s.node.matches(".viewer-content");
        if (region && viewer !== (region === "viewer")) continue;
        if (
          (viewer &&
            panes[i].preview === saved.preview &&
            panes[i].previewTab === saved.tab) ||
          (!viewer && panes[i].epoch === saved.epoch)
        ) {
          s.node.scrollTop = s.top;
          s.node.scrollLeft = s.left;
        }
      }
    }
    if (onlyIndex === null) {
      $("panes").scrollTop = memory.root.top;
      $("panes").scrollLeft = memory.root.left;
      document.scrollingElement.scrollTop = memory.page.top;
      document.scrollingElement.scrollLeft = memory.page.left;
    }
  }
  function keepFocusVisible(fallback) {
    requestAnimationFrame(() => {
      const current = document.activeElement;
      if (typeof current?.getClientRects !== "function") return;
      if (
        !current.getClientRects().length ||
        getComputedStyle(current).visibility === "hidden"
      )
        fallback?.focus({ preventScroll: true });
    });
  }
  function redraw(memory) {
    layout();
    if (memory) requestAnimationFrame(() => restoreScroll(memory));
  }
  function measureSizes() {
    return panes.map((p) => ({
      height: p.dom.getBoundingClientRect().height,
      contentHeight: Math.max(
        0,
        p.dom.clientHeight -
          p.dom.querySelector(".pane-head").getBoundingClientRect().height -
          10,
      ),
      hierarchy: p.dom.querySelector(".hierarchy").getBoundingClientRect()
        .height,
      viewer: p.dom.querySelector(".viewer").getBoundingClientRect().height,
    }));
  }
  function focus(index, region) {
    const entering = !state.snapshot;
    if (entering)
      focusMemory = {
        preferences: structuredClone(getPreferences()),
        scroll: capture(),
        active: document.activeElement,
        sizes: measureSizes(),
      };
    maximizeWindow(state, index, region);
    if (!state.snapshot) finishRestore();
    else {
      redraw();
      keepFocusVisible(
        panes[index].dom.querySelector(
          region === "viewer" ? ".viewer .maximize" : ".pane-head .maximize",
        ),
      );
    }
  }
  function finishRestore() {
    const memory = focusMemory;
    focusMemory = null;
    expandedSizes = null;
    if (memory) setPreferences(structuredClone(memory.preferences));
    redraw(memory?.scroll);
    if (memory) keepFocusVisible(memory.active);
  }
  function restoreOne(index, region) {
    restoreWindow(state, index, region);
    if (!state.snapshot) finishRestore();
    else redraw(focusMemory?.scroll);
  }
  function restoreAll() {
    const memory = focusMemory;
    restoreWindows(state);
    if (memory) finishRestore();
    else {
      redraw();
      requestAnimationFrame(() => {
        for (const [key, saved] of regionMemory)
          restoreScroll(saved, Number(key[0]), key.slice(1));
      });
    }
  }
  function minimize(index, region) {
    const key = index + region;
    const restoring =
      !state.maximized[index] && state.regions[index][region] === "minimized";
    if (!restoring) regionMemory.set(key, capture());
    minimizeWindow(state, index, region);
    if (!state.snapshot && focusMemory) finishRestore();
    redraw();
    if (restoring)
      requestAnimationFrame(() =>
        restoreScroll(regionMemory.get(key), index, region),
      );
  }
  function close(index, region) {
    const memory = capture();
    if (region === "pane") {
      paneMemory.set(index, focusMemory?.scroll || memory);
      if (!closePane(state, index)) return;
      setActive(visiblePanes(state)[0]);
    } else {
      regionMemory.set(index + region, memory);
      if (region === "viewer") closeViewer(state, index);
      else {
        if (state.maximized[index]) restoreWindow(state, index);
        state.regions[index].hierarchy = "closed";
      }
    }
    if (!state.snapshot && focusMemory) finishRestore();
    getPreferences().dual = state.closed.every((closed) => !closed);
    redraw(memory);
    keepFocusVisible(
      panes[index].dom.querySelector(
        region === "hierarchy" ? ".viewer .maximize" : ".provider",
      ),
    );
    save();
  }
  function dual() {
    if (focusMemory) {
      restoreWindows(state);
      finishRestore();
    }
    const reopening = state.closed
      .map((closed, index) => (closed ? index : null))
      .filter((index) => index !== null);
    toggleDual(state, getActive());
    getPreferences().dual = state.closed.every((closed) => !closed);
    setActive(visiblePanes(state)[0]);
    redraw(capture());
    requestAnimationFrame(() => {
      for (const index of reopening) {
        const memory = paneMemory.get(index);
        restoreScroll(memory, index);
        if (memory) $("panes").scrollTop = memory.root.top;
      }
    });
    save();
  }
  function arrange(action, index = 0) {
    const memory = capture();
    if (action === "viewers" || action === "explorers") {
      const exchangeRatio = (preferences, sizes, regions) => {
        // A collapsed title bar is not the section's saved normal dimension.
        const normal = sizes.map((size, index) =>
          canResizeSections(regions[index])
            ? size
            : {
                ...size,
                hierarchy:
                  (size.contentHeight * preferences.heights[index]) / 100,
                viewer:
                  (size.contentHeight * (100 - preferences.heights[index])) /
                  100,
              },
        );
        const next = exchangeViewerSizes(normal);
        preferences.heights = next.map(
          (s) => (100 * s.hierarchy) / Math.max(1, s.hierarchy + s.viewer),
        );
        return next;
      };
      const next = exchangeRatio(
        getPreferences(),
        expandedSizes || measureSizes(),
        state.regions,
      );
      if (focusMemory) {
        focusMemory.sizes = exchangeRatio(
          focusMemory.preferences,
          focusMemory.sizes,
          state.snapshot.regions,
        );
        expandedSizes = next;
      }
      exchangeViewerState(state);
    }
    rearrange(getPreferences(), action, index);
    if (focusMemory) rearrange(focusMemory.preferences, action, index);
    redraw(memory);
    save(focusMemory?.preferences);
  }
  let controls = [];
  function titleControls(index, region) {
    const group = document.createElement("div");
    group.className = "window-controls";
    group.setAttribute("role", "group");
    group.setAttribute(
      "aria-label",
      `${label(index)} ${region} window controls`,
    );
    const make = (action, icon, handler) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = icon;
      b.className = "window-control " + action;
      b.dataset.windowAction = action;
      b.onclick = handler;
      group.append(b);
      return b;
    };
    const position = () => {
      const target =
        region === "viewer"
          ? panes.findIndex(
              (p) => p.dom === panes[index].viewerDom.parentElement,
            )
          : index;
      return target < 0 ? index : target;
    };
    make("rearrange", "⇅", () => arrange("vertical", position())).setAttribute(
      "aria-label",
      `Swap Explorer and Preview vertically in ${label(index)} pane`,
    );
    const side = make("move-side", "⇄", () =>
      arrange(region === "viewer" ? "viewers" : "explorers", position()),
    );
    side.title =
      region === "viewer"
        ? "Swap previews between panes"
        : "Swap explorers between panes";
    side.setAttribute("aria-label", side.title);

    const minus = make("minimize", "−", () => minimize(position(), region));
    const max = make("maximize", "□", () => {
      regionExpanded(state.maximized[position()], region)
        ? restoreOne(position(), region)
        : focus(position(), region);
    });
    const closedRegion = region;
    const x = make("close", "×", () => close(position(), closedRegion));
    controls.push({
      index,
      position,
      side,
      region,
      minus,
      max,
      x,
      closedRegion,
    });
    return group;
  }
  function geometry() {
    if (!initialized) return;
    const visible = visiblePanes(state).filter((i) => !panes[i].dom.hidden),
      focused = visible.filter((i) => state.maximized[i]);
    const corner = visible.length === 2 && focused.length === 2;
    document.body.classList.toggle("workspace-focused", focused.length > 0);
    document.body.classList.toggle("commands-corner", corner);
    const chrome = $("workspace-chrome"),
      main = document.querySelector("main");
    if (focused.length === 1 && visible.length === 2) {
      const free = visible.find((i) => !state.maximized[i]),
        pane = panes[free].dom.getBoundingClientRect(),
        box = main.getBoundingClientRect();
      main.style.setProperty("--chrome-left", pane.left - box.left + "px");
      main.style.setProperty("--chrome-width", pane.width + "px");
      main.style.setProperty(
        "--chrome-space",
        chrome.getBoundingClientRect().height + 12 + "px",
      );
    } else if (visible.length === 1 && focused.length === 1) {
      main.style.setProperty("--chrome-left", "12px");
      main.style.setProperty(
        "--chrome-width",
        Math.max(0, main.getBoundingClientRect().width - 24) + "px",
      );
      main.style.setProperty(
        "--chrome-space",
        chrome.getBoundingClientRect().height + 12 + "px",
      );
    } else main.style.setProperty("--chrome-space", "0px");
    for (const [index, p] of panes.entries()) {
      const saved = (expandedSizes || focusMemory?.sizes)?.[index];
      if (!saved) continue;
      const focused = state.maximized[index];
      p.dom.style.setProperty("--normal-height", saved.height + "px");
      p.dom.style.setProperty("--kept-hierarchy", saved.hierarchy + "px");
      p.dom.style.setProperty("--kept-viewer", saved.viewer + "px");
      p.dom.classList.toggle(
        "keep-normal-height",
        !focused && state.snapshot !== null,
      );
    }
    main.classList.toggle(
      "single-expansion",
      visible.length === 1 && focused.length === 1,
    );
  }
  function apply() {
    if (!initialized) return;
    const logical = visiblePanes(state),
      focused = logical.filter((i) => state.maximized[i]);
    const visible = logical,
      dualVisible = visible.length === 2;
    const root = $("panes");
    root.classList.toggle("dual", dualVisible);
    delete root.dataset.expand;
    for (const [owner, p] of panes.entries()) {
      const host =
        panes[getPreferences().viewerSwapped ? 1 - owner : owner].dom;
      if (p.viewerDom && p.viewerDom.parentElement !== host)
        host.append(p.viewerDom);
    }
    for (const [index, p] of panes.entries()) {
      p.dom.hidden = !visible.includes(index);
      p.dom.classList.toggle(
        "only-pane",
        visible.length === 1 && visible[0] === index,
      );
      p.dom.classList.toggle(
        "reversed",
        getPreferences().reversed?.[index] === true,
      );
      const side = getPreferences().swapped ? 1 - index : index;
      p.dom.style.gridColumn = dualVisible ? (side === 0 ? "1" : "3") : "1";
      if (!state.snapshot) p.dom.classList.remove("keep-normal-height");
      p.dom.dataset.windowMax = state.maximized[index] || "";
      p.dom.dataset.hierarchyState = state.regions[index].hierarchy;
      p.dom.dataset.viewerState = state.regions[index].viewer;
      const edge = p.dom.querySelector(".row-splitter");
      edge.hidden = !canResizeSections(state.regions[index]);
      edge.setAttribute("aria-disabled", String(edge.hidden));
      edge.tabIndex = edge.hidden ? -1 : 0;
    }
    $("dual").textContent = logical.length === 2 ? "Single Pane" : "Dual Pane";
    $("dual").setAttribute("aria-pressed", String(logical.length === 2));
    $("restore").disabled =
      !state.snapshot &&
      !state.regions.some(
        (r) => r.hierarchy !== "normal" || r.viewer !== "normal",
      );
    controls = controls.filter((c) => c.max.isConnected);
    for (const c of controls) {
      const index = c.position();
      c.side.disabled = logical.length < 2;
      c.max.parentElement?.setAttribute(
        "aria-label",
        `${label(index)} ${c.region} window controls`,
      );
      const minimized =
          !state.maximized[index] &&
          state.regions[index][c.region] === "minimized",
        maximized = regionExpanded(state.maximized[index], c.region);
      const minusText = `${minimized ? "Restore" : "Minimize"} ${label(index)} ${c.region}`;
      c.minus.title = minusText;
      c.minus.setAttribute("aria-label", minusText);
      c.minus.setAttribute("aria-pressed", String(minimized));
      const maxText = `${maximized ? "Restore" : "Maximize"} ${label(index)} ${c.region}`;
      c.max.title = maxText;
      c.max.setAttribute("aria-label", maxText);
      c.max.textContent = maximized ? "❐" : "□";
      c.max.classList.toggle("restore", maximized);
      c.x.title = `Close ${label(index)} ${c.closedRegion} view`;
      c.x.setAttribute("aria-label", `Close ${label(index)} ${c.closedRegion}`);
      c.x.disabled =
        state.regions[index][c.region === "viewer" ? "hierarchy" : "viewer"] ===
        "closed";
    }
    for (const b of document.querySelectorAll("[data-expand]"))
      b.setAttribute(
        "aria-pressed",
        String(
          visible.length > 0 &&
            visible.every(
              (i) =>
                state.maximized[i] ===
                (b.dataset.expand === "top" ? "hierarchy" : "viewer"),
            ),
        ),
      );
    geometry();
    dock?.refresh();
  }
  const commands = {
    dual: {
      label: () =>
        visiblePanes(state).length === 2 ? "Single Pane" : "Dual Pane",
      run: dual,
    },
    restore: {
      label: "Restore layout",
      run: restoreAll,
      enabled: () => !$("restore").disabled,
    },
    activity: {
      label: "Activity & recovery",
      run: () => $("activity").click(),
    },
    top: { label: "Maximize hierarchies", run: () => expand("top") },
    bottom: { label: "Maximize viewers", run: () => expand("bottom") },
    left: {
      label: "Expand left Explorer",
      run: () => focus(0, "pane"),
      enabled: () => !state.closed[0],
    },
    right: {
      label: "Expand right Explorer",
      run: () => focus(1, "pane"),
      enabled: () => !state.closed[1],
    },
    swap: { label: "Swap left and right panes", run: () => arrange("columns") },
    viewers: {
      label: "Reopen closed sections",
      run: () => {
        if (state.snapshot) restoreAll();
        state.regions.forEach((r) => {
          r.viewer = "normal";
          r.hierarchy = "normal";
        });
        redraw();
        requestAnimationFrame(() => {
          for (const index of [0, 1])
            restoreScroll(regionMemory.get(index + "viewer"), index, "viewer");
        });
      },
    },
  };
  const dock = createCommandDock({
    commands,
    onError: (error) => {
      $("notice").textContent = error.message;
    },
  });
  document.querySelector(".actions").append(dock.root);
  const swap = document.createElement("button");
  swap.type = "button";
  swap.textContent = "Swap sides";
  swap.onclick = commands.swap.run;
  swap.setAttribute("aria-label", "Swap left and right panes");
  document.querySelector(".actions").append(swap);
  function expand(mode = "") {
    if (!mode) {
      restoreAll();
      return;
    }
    if (mode === "left" || mode === "right") {
      focus(mode === "left" ? 0 : 1, "pane");
      return;
    }
    const region = mode === "top" ? "hierarchy" : "viewer";
    for (const index of visiblePanes(state))
      if (state.maximized[index] !== region) focus(index, region);
  }
  return {
    titleControls,
    height(index) {
      if (!state.snapshot) return getPreferences().heights[index];
      const p = panes[index],
        upper = p.dom
          .querySelector(".hierarchy")
          .getBoundingClientRect().height,
        lower = p.dom.querySelector(".viewer").getBoundingClientRect().height;
      return upper + lower > 0
        ? (100 * upper) / (upper + lower)
        : getPreferences().heights[index];
    },
    resize(index, value) {
      if (!state.snapshot) return;
      expandedSizes ||= structuredClone(focusMemory.sizes);
      const p = panes[index],
        total =
          p.dom.querySelector(".hierarchy").getBoundingClientRect().height +
          p.dom.querySelector(".viewer").getBoundingClientRect().height;
      expandedSizes[index].hierarchy = (total * value) / 100;
      expandedSizes[index].viewer = (total * (100 - value)) / 100;
    },
    apply,
    geometry,
    expand,
    dual,
    restore: restoreAll,
    isFocused: () => !!state.snapshot,
    initialize() {
      state = windowState(getPreferences().dual);
      initialized = true;
      redraw();
      if (typeof ResizeObserver === "function")
        new ResizeObserver(geometry).observe($("workspace-chrome"));
    },
    key(event) {
      if (event.key === "Escape" && !document.querySelector("dialog[open]")) {
        if (state.snapshot) {
          event.preventDefault();
          restoreAll();
        }
      }
    },
  };
}
