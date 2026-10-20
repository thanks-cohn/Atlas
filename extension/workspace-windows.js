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
    focusMemory = null;
  const regionMemory = new Map(),
    paneMemory = new Map();
  const label = (index) => (index ? "right" : "left");
  function capture() {
    return {
      panes: panes.map((p) => ({
        epoch: p.epoch,
        preview: p.preview,
        tab: p.previewTab,
        scroll: [
          ...p.dom.querySelectorAll(".items,.viewer-content,.breadcrumb"),
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
    for (const [i, saved] of memory.panes.entries()) {
      if (onlyIndex !== null && i !== onlyIndex) continue;
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
  function focus(index, region) {
    const entering = !state.snapshot;
    if (entering)
      focusMemory = {
        preferences: structuredClone(getPreferences()),
        scroll: capture(),
        active: document.activeElement,
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
    if (memory) setPreferences(structuredClone(memory.preferences));
    redraw(memory?.scroll);
    if (memory) keepFocusVisible(memory.active);
  }
  function restoreOne(index) {
    restoreWindow(state, index);
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
      regionMemory.set(index + "viewer", memory);
      closeViewer(state, index);
    }
    if (!state.snapshot && focusMemory) finishRestore();
    getPreferences().dual = state.closed.every((closed) => !closed);
    redraw(memory);
    keepFocusVisible(
      panes[visiblePanes(state)[0]].dom.querySelector(".provider"),
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
    const minus = make("minimize", "−", () => minimize(index, region));
    const max = make("maximize", "□", () => {
      state.maximized[index] ? restoreOne(index) : focus(index, region);
    });
    const closedRegion = region === "hierarchy" ? "pane" : "viewer";
    const x = make("close", "×", () => close(index, closedRegion));
    controls.push({ index, region, minus, max, x, closedRegion });
    return group;
  }
  function geometry() {
    if (!initialized) return;
    const visible = visiblePanes(state).filter((i) => !panes[i].dom.hidden),
      focused = visible.filter((i) => state.maximized[i]);
    const corner =
      focused.length > 0 &&
      (visible.length === 1 || focused.length === visible.length);
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
    } else main.style.setProperty("--chrome-space", "0px");
  }
  function apply() {
    if (!initialized) return;
    const logical = visiblePanes(state),
      focused = logical.filter((i) => state.maximized[i]);
    const narrow =
      typeof matchMedia === "function" &&
      matchMedia("(max-width:1050px)").matches;
    const visible = narrow && focused.length === 1 ? focused : logical,
      dualVisible = visible.length === 2;
    const root = $("panes");
    root.classList.toggle("dual", dualVisible);
    delete root.dataset.expand;
    for (const [index, p] of panes.entries()) {
      p.dom.hidden = !visible.includes(index);
      p.dom.classList.toggle(
        "only-pane",
        visible.length === 1 && visible[0] === index,
      );
      p.dom.dataset.windowMax = state.maximized[index] || "";
      p.dom.dataset.hierarchyState = state.regions[index].hierarchy;
      p.dom.dataset.viewerState = state.regions[index].viewer;
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
      const minimized =
          !state.maximized[c.index] &&
          state.regions[c.index][c.region] === "minimized",
        maximized = !!state.maximized[c.index];
      const minusText = `${minimized ? "Restore" : "Minimize"} ${label(c.index)} ${c.region}`;
      c.minus.title = minusText;
      c.minus.setAttribute("aria-label", minusText);
      c.minus.setAttribute("aria-pressed", String(minimized));
      const maxText = `${maximized ? "Restore" : "Maximize"} ${label(c.index)} ${c.region}`;
      c.max.title = maxText;
      c.max.setAttribute("aria-label", maxText);
      c.max.textContent = maximized ? "❐" : "□";
      c.max.classList.toggle("restore", maximized);
      c.x.title = `Close ${label(c.index)} ${c.closedRegion} view`;
      c.x.setAttribute(
        "aria-label",
        `Close ${label(c.index)} ${c.closedRegion}`,
      );
      c.x.disabled =
        c.closedRegion === "pane" &&
        state.closed.filter((closed) => !closed).length === 1;
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
      label: "Focus left pane",
      run: () => focus(0, "pane"),
      enabled: () => !state.closed[0],
    },
    right: {
      label: "Focus right pane",
      run: () => focus(1, "pane"),
      enabled: () => !state.closed[1],
    },
    viewers: {
      label: "Show content viewers",
      run: () => {
        if (state.snapshot) restoreAll();
        state.regions.forEach((r) => (r.viewer = "normal"));
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
