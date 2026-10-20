import { broker, safeURL, listing } from "./workspace-providers.js";
import { COVER_KEY, bookmarkCover, safeCover } from "./bookmark-covers.js";
import { previewKind } from "./preview-navigation.js";
const IMAGE_LIMIT = 8 * 1024 * 1024,
  TEXT_LIMIT = 512 * 1024;
const el = (tag, text) => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  return n;
};
export function releasePreview(p) {
  p.previewEpoch++;
  if (p.previewURL) {
    URL.revokeObjectURL(p.previewURL);
    p.previewURL = null;
  }
}
export async function fillPreview(p, root, item, tab) {
  const epoch = p.previewEpoch;
  const current = () => p.previewEpoch === epoch && p.preview === item;
  const append = (n) => {
    if (current()) root.append(n);
  };
  if (!item) return;
  if (tab === "details") {
    const dl = el("dl");
    for (const [label, value] of [
      ["Name", item.name],
      ["Type", item.kind],
      ["ID", item.id],
      ["Size", item.size === undefined ? null : item.size + " bytes"],
      ["URL", item.url],
      ["Location", item.location?.path],
    ]) {
      if (value === undefined || value === null) continue;
      dl.append(el("dt", label), el("dd", String(value)));
    }
    for (const locator of item.locators || [])
      dl.append(el("dt", locator.provider), el("dd", locator.reference));
    append(dl);
    return;
  }
  if (tab === "notes") {
    append(el("p", item.note || "No saved notes for this item."));
    return;
  }
  if (tab === "contents") {
    const contents =
      item.contents ||
      (item.folder ? (await listing(item.location)).entries : []);
    if (!contents.length) {
      append(el("p", "No child items are available."));
      return;
    }
    const list = el("ul");
    for (const entry of contents.slice(0, 200))
      list.append(el("li", entry.name));
    append(list);
    if (contents.length > 200)
      append(
        el(
          "p",
          "Showing the first 200 items. Open the folder to browse all items.",
        ),
      );
    return;
  }
  let image = item.image;
  if (item.kind === "Bookmark") {
    const data = await chrome.storage.local.get(COVER_KEY);
    if (!current()) return;
    image = bookmarkCover(
      { id: item.id, url: item.url },
      data[COVER_KEY] || {},
    );
  }
  if (safeCover(image)) {
    const img = el("img");
    img.alt = item.name;
    img.decoding = "async";
    img.src = image;
    append(img);
    return;
  }
  const location = item.location;
  if (location?.provider === "local" && !item.folder) {
    const kind = previewKind(item.name),
      limit = kind === "image" ? IMAGE_LIMIT : TEXT_LIMIT;
    if (!["image", "text"].includes(kind)) {
      append(
        el(
          "p",
          "Preview unavailable for this file type. Use Explorer for other media.",
        ),
      );
      return;
    }
    if (typeof item.size === "number" && item.size > limit) {
      append(
        el(
          "p",
          `Preview exceeds the ${kind === "image" ? "8 MiB image" : "512 KiB text"} workspace limit. Open Explorer for larger previews.`,
        ),
      );
      return;
    }
    append(el("p", "Loading preview…"));
    const result = await broker("/v1/read", {
      grant: location.id,
      path: location.path,
      max_bytes: limit,
    });
    if (!current()) return;
    if (
      typeof result.data !== "string" ||
      result.data.length > Math.ceil(limit / 3) * 4 + 4
    )
      throw new Error("Preview exceeded the bounded read limit.");
    const bytes = Uint8Array.from(atob(result.data), (c) => c.charCodeAt(0));
    if (bytes.length > limit)
      throw new Error("Preview exceeded the bounded read limit.");
    root.replaceChildren();
    if (
      kind === "image" &&
      /^image\/(png|jpeg|webp|gif|avif|bmp|x-icon)$/.test(result.mime || "")
    ) {
      const img = el("img");
      img.alt = item.name;
      img.decoding = "async";
      p.previewURL = URL.createObjectURL(
        new Blob([bytes], { type: result.mime }),
      );
      img.src = p.previewURL;
      img.onerror = () => {
        if (current())
          root.replaceChildren(el("p", "This image could not be decoded."));
      };
      root.append(img);
    } else if (kind === "text") {
      const text = el("pre", new TextDecoder().decode(bytes));
      root.append(text);
    } else root.append(el("p", "Preview MIME type is unsupported."));
    return;
  }
  if (item.note) append(el("p", item.note));
  else if (item.folder)
    append(
      el("p", "Open this folder to browse its items, or choose Contents."),
    );
  else
    append(
      el(
        "p",
        "No embedded preview is available. Details and source references remain accessible.",
      ),
    );
  // Remote originals are never downloaded merely because an item was selected.
  const source = safeURL(item.url) || safeURL(image);
  if (source) {
    const a = el("a", "Open source ↗");
    a.href = source;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    append(a);
  }
}
