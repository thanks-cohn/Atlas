// View state only. Provider identities and authority remain in their existing stores.
export const WORKSPACE_KEY = "atlas.workspace.layout.v1";
export function paneState(provider = "bookmarks") {
  return {
    location: { provider, id: "" },
    history: [],
    index: -1,
    entries: [],
    selected: new Set(),
    anchor: 0,
    query: "",
    sort: "name",
    view: "list",
    pinned: false,
    preview: null,
    epoch: 0,
    previewTab: "preview",
    previewEpoch: 0,
  };
}
export function visit(pane, location, record = true) {
  pane.location = { ...location };
  pane.selected.clear();
  pane.query = "";
  if (!pane.pinned) pane.preview = null;
  if (record) {
    pane.history = pane.history.slice(0, pane.index + 1);
    pane.history.push({ ...location });
    pane.index++;
  }
  return ++pane.epoch;
}
export function ordered(pane) {
  const byName = (a, b) =>
    a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    }) || a.id.localeCompare(b.id);
  const number = (entry, key) =>
    Number.isFinite(entry[key]) ? entry[key] : -Infinity;
  return pane.entries
    .filter((entry) =>
      entry.name.toLocaleLowerCase().includes(pane.query.toLocaleLowerCase()),
    )
    .sort((a, b) => {
      if (pane.sort === "type")
        return (
          String(a.kind || "").localeCompare(String(b.kind || "")) ||
          byName(a, b)
        );
      if (pane.sort === "size" || pane.sort === "modified")
        return number(b, pane.sort) - number(a, pane.sort) || byName(a, b);
      return (pane.sort === "descending" ? -1 : 1) * byName(a, b);
    });
}
export function select(
  pane,
  entries,
  index,
  { ctrlKey = false, metaKey = false, shiftKey = false } = {},
) {
  const id = entries[index]?.id;
  if (!id) return;
  if (shiftKey) {
    if (!ctrlKey && !metaKey) pane.selected.clear();
    for (const e of entries.slice(
      Math.min(pane.anchor, index),
      Math.max(pane.anchor, index) + 1,
    ))
      pane.selected.add(e.id);
  } else if (ctrlKey || metaKey) {
    pane.selected.has(id) ? pane.selected.delete(id) : pane.selected.add(id);
    pane.anchor = index;
  } else {
    pane.selected = new Set([id]);
    pane.anchor = index;
  }
}
export function layoutPreferences(value = {}) {
  if (!value || typeof value !== "object") value = {};
  const clamp = (n, fallback, min, max) =>
    Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  const legacy = clamp(value.height, 55, 25, 75);
  return {
    dual: value.dual === true,
    ratio: clamp(value.ratio, 50, 20, 80),
    heights: [0, 1].map((index) =>
      clamp(value.heights?.[index], legacy, 25, 75),
    ),
  };
}
