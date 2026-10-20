import {
  WORKSPACE_KEY,
  paneState,
  visit,
  ordered,
  select,
  layoutPreferences,
} from "./workspace-model.js";
import { PROVIDERS, listing, safeURL } from "./workspace-providers.js";
import { bindSplitter } from "./workspace-splitter.js";
import { fillPreview, releasePreview } from "./workspace-preview.js";
import { showContextMenu } from "./workspace-menu.js";
import { createWorkspaceWindows } from "./workspace-windows.js";
const $ = (id) => document.getElementById(id),
  panes = [paneState(), paneState("projects")];
let preferences = layoutPreferences(),
  active = 0;
const el = (tag, text) => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  return n;
};
const button = (label, fn) => {
  const n = el("button", label);
  n.type = "button";
  n.onclick = () =>
    Promise.resolve()
      .then(fn)
      .catch((error) => {
        $("notice").textContent = error.message;
      });
  return n;
};
let saveQueue = Promise.resolve();
const splitters = [];
function save(baseline) {
  if (windows.isFocused() && !baseline) return Promise.resolve();
  const snapshot = structuredClone(baseline || preferences);
  saveQueue = saveQueue
    .catch(() => {})
    .then(() => chrome.storage.local.set({ [WORKSPACE_KEY]: snapshot }));
  return saveQueue.catch((error) => {
    $("notice").textContent = "Could not save layout: " + error.message;
  });
}
function expand(mode = "") {
  windows.expand(mode);
}
function layout() {
  const root = $("panes");
  root.classList.toggle("dual", preferences.dual);
  if (
    preferences.dual &&
    typeof matchMedia === "function" &&
    matchMedia("(min-width:1051px)").matches
  ) {
    const width = root.getBoundingClientRect().width - 10;
    const min = Math.min(45, Math.max(20, (260 / Math.max(1, width)) * 100));
    preferences.ratio = Math.max(min, Math.min(100 - min, preferences.ratio));
  }
  root.style.setProperty("--width", preferences.ratio + "fr");
  root.style.setProperty("--rest", 100 - preferences.ratio + "fr");
  panes.forEach((p, index) => {
    p.dom.style.setProperty("--upper", preferences.heights[index] + "fr");
    p.dom.style.setProperty("--lower", 100 - preferences.heights[index] + "fr");
  });
  panes[1].dom.hidden = !preferences.dual;
  $("dual").setAttribute("aria-pressed", String(preferences.dual));
  $("dual").textContent = preferences.dual ? "Single Pane" : "Dual Pane";
  for (const splitter of splitters) splitter.sync();
  windows.apply();
}
function syncNavigation() {
  for (const n of $("navigation").children)
    n.setAttribute(
      "aria-current",
      String(n.dataset.provider === panes[active].location.provider),
    );
}
async function navigate(p, location, record = true) {
  if (!location) return;
  const epoch = visit(p, location, record);
  p.page = 0;
  p.crumbs = [];
  p.error = null;
  p.dom.querySelector(".items").replaceChildren(el("p", "Loading…"));
  p.dom.setAttribute("aria-busy", "true");
  if (!p.pinned) renderPreview(p);
  try {
    const data = await listing(location);
    if (p.epoch !== epoch) return;
    p.entries = data.entries;
    p.title = data.title;
    p.parent = data.parent;
    p.crumbs = data.breadcrumbs || [];
    render(p);
  } catch (error) {
    if (p.epoch !== epoch) return;
    p.entries = [];
    p.error = error.message;
    p.title = PROVIDERS[location.provider];
    p.parent = null;
    render(p);
    const message = el("p", error.message);
    message.className = "empty";
    p.dom.querySelector(".items").replaceChildren(message);
  } finally {
    if (p.epoch === epoch) p.dom.removeAttribute("aria-busy");
  }
}
function render(p) {
  const root = p.dom;
  root.querySelector(".provider").value = p.location.provider;
  root.querySelector(".search").value = p.query;
  const sort = root.querySelector(".sort");
  const local = p.location.provider === "local" && p.location.id;
  for (const option of sort.children)
    if (["size", "modified"].includes(option.value)) {
      option.hidden = !local;
      option.disabled = !local;
    }
  if (!local && ["size", "modified"].includes(p.sort)) p.sort = "name";
  sort.value = p.sort;
  root.querySelector(".back").disabled = p.index <= 0;
  root.querySelector(".forward").disabled = p.index >= p.history.length - 1;
  root.querySelector(".up").disabled = !p.parent;
  const crumbs = root.querySelector(".breadcrumb");
  const chain = [
    {
      name: PROVIDERS[p.location.provider],
      location: { provider: p.location.provider, id: "" },
    },
    ...(p.crumbs || []),
  ];
  crumbs.replaceChildren();
  for (const [i, crumb] of chain.entries()) {
    if (i) crumbs.append(el("span", "/"));
    crumbs.append(button(crumb.name, () => navigate(p, crumb.location)));
  }
  if (!p.crumbs?.length && p.location.id)
    crumbs.append(el("span", " / " + (p.title || "")));
  syncNavigation();
  renderItems(p);
}
function renderItems(p) {
  const items = p.dom.querySelector(".items"),
    scroll = items.scrollTop;
  items.replaceChildren();
  items.classList.toggle("grid", p.view === "grid");
  const all = ordered(p);
  p.page = Math.min(p.page || 0, Math.max(0, Math.ceil(all.length / 200) - 1));
  const entries = all.slice(p.page * 200, (p.page + 1) * 200);
  const footer = p.dom.querySelector(".list-status");
  footer.replaceChildren(
    el(
      "span",
      `${all.length.toLocaleString()} items · ${p.selected.size} selected`,
    ),
  );
  for (const [label, delta] of [
    ["Previous page", -1],
    ["Next page", 1],
  ]) {
    const b = button(label, () => {
      p.page += delta;
      renderItems(p);
      items.scrollTop = 0;
      items.querySelector(".item")?.focus();
    });
    b.disabled = delta < 0 ? p.page === 0 : (p.page + 1) * 200 >= all.length;
    footer.append(b);
  }

  for (const [index, item] of entries.entries()) {
    const row = el("button");
    row.type = "button";
    row.className = "item";
    row.setAttribute("role", "option");
    row.setAttribute("aria-selected", String(p.selected.has(item.id)));
    row.append(
      el("span", (item.folder ? "▰  " : "▤  ") + item.name),
      el("small", item.kind),
    );
    row.onclick = (event) => {
      select(p, all, p.page * 200 + index, event);
      footer.firstChild.textContent = `${all.length.toLocaleString()} items · ${p.selected.size} selected`;
      if (!p.pinned && p.preview !== item) {
        p.preview = item;
        renderPreview(p);
      }
      for (const [i, n] of [...items.children].entries())
        n.setAttribute("aria-selected", String(p.selected.has(entries[i]?.id)));
    };
    row.ondblclick = () => open(p, item);
    row.oncontextmenu = (event) =>
      showContextMenu(event, [
        ["Open", () => open(p, item)],
        [
          "Preview",
          () => {
            p.pinned = false;
            p.preview = item;
            p.previewTab = "preview";
            renderPreview(p);
          },
        ],
        [
          "Pin Preview",
          () => {
            p.preview = item;
            p.pinned = true;
            renderPreview(p);
          },
        ],
        [
          "Properties",
          () => {
            p.pinned = false;
            p.preview = item;
            p.previewTab = "details";
            renderPreview(p);
          },
        ],
      ]);
    row.onkeydown = (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        open(p, item);
      }
      if (
        !event.altKey &&
        ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
      ) {
        event.preventDefault();
        const target =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? entries.length - 1
              : Math.max(
                  0,
                  Math.min(
                    entries.length - 1,
                    index + (event.key === "ArrowDown" ? 1 : -1),
                  ),
                );
        const next = items.children[target];
        next?.focus();
        if (!event.ctrlKey && !event.metaKey) next?.onclick(event);
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "a") {
        event.preventDefault();
        p.selected = new Set(all.map((e) => e.id));
        footer.firstChild.textContent = `${all.length.toLocaleString()} items · ${p.selected.size} selected`;
        for (const n of items.children) n.setAttribute("aria-selected", "true");
      }
    };
    items.append(row);
  }
  if (!entries.length) {
    const empty = el("p", p.query ? "No matching items." : "Nothing here yet.");
    empty.className = "empty";
    items.append(empty);
  }
  items.scrollTop = scroll;
}
function open(p, item) {
  if (item.folder) return navigate(p, item.location);
  const url = safeURL(item.url);
  if (url) return chrome.tabs.create({ url });
  p.preview = item;
  p.pinned = false;
  renderPreview(p);
}
function renderPreview(p) {
  releasePreview(p);
  const root = p.viewerDom || p.dom.querySelector(".viewer");
  root.replaceChildren();
  const head = el("div");
  head.className = "viewer-head";
  head.append(el("h2", p.preview?.name || "Preview"));
  const controls = el("div");
  controls.className = "viewer-actions";
  const pin = button(p.pinned ? "Unpin Preview" : "Pin Preview", () => {
    p.pinned = !p.pinned;
    pin.textContent = p.pinned ? "Unpin Preview" : "Pin Preview";
    pin.setAttribute("aria-pressed", String(p.pinned));
  });
  pin.disabled = !p.preview;
  pin.setAttribute("aria-pressed", String(p.pinned));
  controls.append(pin, windows.titleControls(panes.indexOf(p), "viewer"));
  head.append(controls);
  root.append(head);
  windows.apply();
  if (!p.preview) {
    const empty = el(
      "p",
      "Select an item above to preview it. Pin two previews to compare while browsing.",
    );
    empty.className = "empty";
    root.append(empty);
    return;
  }
  const tabs = el("div");
  tabs.className = "viewer-tabs";
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "Content view");
  const content = el("div");
  content.className = "viewer-content";
  content.id = "viewer-content-" + panes.indexOf(p);
  content.setAttribute("role", "tabpanel");
  for (const [id, label] of [
    ["preview", "Preview"],
    ["contents", "Contents"],
    ["notes", "Notes"],
    ["details", "Details"],
  ]) {
    const b = button(label, () => {
      p.previewTab = id;
      renderPreview(p);
      p.viewerDom.querySelector(`[data-tab="${id}"]`)?.focus();
    });
    b.id = content.id + "-" + id;
    b.dataset.tab = id;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-controls", content.id);
    b.setAttribute("aria-selected", String(p.previewTab === id));
    b.tabIndex = p.previewTab === id ? 0 : -1;
    b.onkeydown = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const ids = ["preview", "contents", "notes", "details"];
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        p.previewTab =
          ids[
            e.key === "Home"
              ? 0
              : e.key === "End"
                ? 3
                : (ids.indexOf(id) + (e.key === "ArrowRight" ? 1 : 3)) % 4
          ];
        renderPreview(p);
        p.viewerDom.querySelector(`[data-tab="${p.previewTab}"]`)?.focus();
      }
    };
    tabs.append(b);
  }
  content.setAttribute("aria-labelledby", content.id + "-" + p.previewTab);
  root.append(tabs, content);
  const epoch = p.previewEpoch;
  fillPreview(p, content, p.preview, p.previewTab).catch((error) => {
    if (p.previewEpoch === epoch)
      content.replaceChildren(el("p", error.message));
  });
}
function buildPane(p, index) {
  const root = el("article");
  root.className = "pane";
  root.setAttribute("aria-label", index ? "Right explorer" : "Left explorer");
  root.addEventListener("focusin", () => {
    active = index;
    syncNavigation();
  });
  root.onpointerdown = () => {
    active = index;
    syncNavigation();
  };
  p.dom = root;
  root.dataset.pane = String(index);
  const head = el("div");
  head.className = "pane-head";
  const provider = el("select");
  provider.className = "provider";
  provider.setAttribute("aria-label", "Location provider");
  for (const [id, label] of Object.entries(PROVIDERS)) {
    const option = el("option", label);
    option.value = id;
    provider.append(option);
  }
  provider.onchange = () => navigate(p, { provider: provider.value, id: "" });
  head.append(provider);
  for (const [label, cls, delta] of [
    ["←", "back", -1],
    ["→", "forward", 1],
  ]) {
    const b = button(label, () => {
      p.index += delta;
      return navigate(p, p.history[p.index], false);
    });
    b.className = cls;
    b.setAttribute("aria-label", cls === "back" ? "Back" : "Forward");
    head.append(b);
  }
  const up = button("↑", () => navigate(p, p.parent));
  up.className = "up";
  up.setAttribute("aria-label", "Parent folder");
  head.append(
    up,
    button("↻", () => navigate(p, p.location, false)),
  );
  const navigation = el("div");
  navigation.className = "explorer-navigation";
  for (const child of [...head.children].slice(1)) navigation.append(child);
  head.append(windows.titleControls(index, "hierarchy"));
  const hierarchy = el("div");
  hierarchy.className = "hierarchy";
  const crumbs = el("nav");
  crumbs.className = "breadcrumb";
  crumbs.setAttribute("aria-label", "Location breadcrumbs");
  const tools = el("div");
  tools.className = "tools";
  const search = el("input");
  search.type = "search";
  search.placeholder = "Search this location";
  search.className = "search";
  search.setAttribute("aria-label", "Search this location");
  search.oninput = () => {
    p.query = search.value;
    p.page = 0;
    renderItems(p);
  };
  const sort = el("select");
  sort.className = "sort";
  sort.setAttribute("aria-label", "Sort items");
  for (const [value, label] of [
    ["name", "Name A–Z"],
    ["descending", "Name Z–A"],
    ["type", "Type"],
    ["size", "Size, largest first"],
    ["modified", "Modified, newest first"],
  ]) {
    const option = el("option", label);
    option.value = value;
    sort.append(option);
  }
  sort.onchange = () => {
    p.sort = sort.value;
    p.page = 0;
    renderItems(p);
  };
  const view = button("Grid view", () => {
    p.view = p.view === "list" ? "grid" : "list";
    view.textContent = p.view === "list" ? "Grid view" : "List view";
    renderItems(p);
  });
  tools.append(search, sort, view);
  const items = el("div");
  items.className = "items";
  items.setAttribute("role", "listbox");
  items.setAttribute("aria-label", "Resources");
  items.setAttribute("aria-multiselectable", "true");
  const status = el("div");
  status.className = "list-status";
  hierarchy.append(navigation, crumbs, tools, items, status);
  const viewer = el("section");
  viewer.className = "viewer";
  p.viewerDom = viewer;
  viewer.setAttribute("aria-label", "Selected item preview");
  const edge = el("div");
  edge.className = "splitter row-splitter";
  edge.setAttribute(
    "aria-label",
    (index ? "Right" : "Left") + " hierarchy height",
  );
  root.append(head, hierarchy, edge, viewer);
  splitters.push(
    bindSplitter(edge, {
      axis: "y",
      value: () =>
        preferences.reversed?.[index]
          ? 100 - windows.height(index)
          : windows.height(index),
      bounds: () => [25, 75],
      geometry: () => {
        const upper = hierarchy.getBoundingClientRect(),
          lower = viewer.getBoundingClientRect();
        return {
          start: preferences.reversed?.[index] ? lower.top : upper.top,
          size: upper.height + lower.height,
        };
      },
      change: (value) => {
        preferences.heights[index] = preferences.reversed?.[index]
          ? 100 - value
          : value;
        windows.resize(index, preferences.heights[index]);
        layout();
      },
      commit: save,
      reset: () => (preferences.reversed?.[index] ? 45 : 55),
    }),
  );
  return root;
}
const windows = createWorkspaceWindows({
  panes,
  getPreferences: () => preferences,
  setPreferences: (value) => {
    preferences = value;
  },
  layout,
  save,
  getActive: () => active,
  setActive: (index) => {
    active = index;
    syncNavigation();
  },
});
for (const [provider, label] of Object.entries(PROVIDERS)) {
  const b = button(label, () => navigate(panes[active], { provider, id: "" }));
  b.dataset.provider = provider;
  $("navigation").append(b);
}
for (const [index, p] of panes.entries())
  $("panes").append(buildPane(p, index));
const columnEdge = el("div");
columnEdge.className = "splitter column-splitter";
columnEdge.setAttribute("aria-label", "Pane widths");
$("panes").append(columnEdge);
splitters.push(
  bindSplitter(columnEdge, {
    axis: "x",
    value: () => preferences.ratio,
    bounds: () => {
      const width = $("panes").getBoundingClientRect().width - 10;
      const min = Math.min(45, Math.max(20, (260 / Math.max(1, width)) * 100));
      return [min, 100 - min];
    },
    geometry: () => {
      const rect = $("panes").getBoundingClientRect();
      return { start: rect.left, size: rect.width - 10 };
    },
    change: (value) => {
      preferences.ratio = value;
      layout();
    },
    commit: save,
  }),
);
$("dual").onclick = () => windows.dual();
$("restore").onclick = () => windows.restore();
for (const b of document.querySelectorAll("[data-expand]"))
  b.onclick = () => expand(b.dataset.expand);
document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented) return;
  if (event.key === "Escape") {
    windows.key(event);
    return;
  }
  const p = panes[active];
  if (
    event.altKey &&
    ["ArrowLeft", "ArrowRight", "ArrowUp"].includes(event.key)
  ) {
    event.preventDefault();
    if (event.key === "ArrowUp") {
      if (p.parent) navigate(p, p.parent);
    } else {
      const next = p.index + (event.key === "ArrowLeft" ? -1 : 1);
      if (next >= 0 && next < p.history.length) {
        p.index = next;
        navigate(p, p.history[next], false);
      }
    }
  } else if (
    (event.ctrlKey || event.metaKey) &&
    event.key.toLowerCase() === "f"
  ) {
    event.preventDefault();
    p.dom.querySelector(".search").focus();
  } else if (event.key === "F5") {
    event.preventDefault();
    navigate(p, p.location, false);
  }
});
try {
  preferences = layoutPreferences(
    (await chrome.storage.local.get(WORKSPACE_KEY))[WORKSPACE_KEY],
  );
} catch (error) {
  $("notice").textContent = "Layout preferences unavailable: " + error.message;
}
windows.initialize();
await Promise.all(panes.map((p) => navigate(p, p.location)));

// Recompute effective minimum widths after viewport/sidebar geometry changes.
if (typeof ResizeObserver === "function")
  new ResizeObserver(() => layout()).observe($("panes"));
