import { PAGE_PREFIX, validatePage } from "./pages-store.js";
export const PROVIDERS = Object.freeze({
  bookmarks: "Bookmarks",
  projects: "Projects",
  objects: "Objects",
  collections: "Collections",
  local: "Local Files",
  r2: "Cloudflare R2",
});
export async function broker(path, body) {
  const result = await chrome.runtime.sendMessage({
    type: "api",
    path,
    ...(body === undefined ? {} : { body }),
  });
  if (!result || result.ok === false)
    throw new Error(
      result?.error?.message ||
        "Companion unavailable. Open Explorer settings to reconnect.",
    );
  return result;
}
export async function listing(location) {
  const { provider, id } = location;
  if (provider === "r2")
    throw new Error(
      "Cloudflare R2 is not connected. R2 browsing and transfers are not implemented yet.",
    );
  if (provider === "bookmarks") {
    const node = id
      ? (await chrome.bookmarks.getSubTree(id))[0]
      : (await chrome.bookmarks.getTree())[0];
    if (!node) throw new Error("Bookmark folder no longer exists.");
    const breadcrumbs = [];
    let current = node;
    for (let depth = 0; current?.parentId && depth < 64; depth++) {
      breadcrumbs.unshift({
        name: current.title || "Bookmarks",
        location: { provider, id: current.id },
      });
      current = chrome.bookmarks.get
        ? (await chrome.bookmarks.get(current.parentId))[0]
        : null;
    }
    return {
      breadcrumbs,
      title: node.title || "Bookmarks",
      parent: node.parentId ? { provider, id: node.parentId } : null,
      entries: (node.children || []).map((n) => ({
        id: n.id,
        name: n.title || n.url || "Untitled",
        kind: n.url ? "Bookmark" : "Folder",
        folder: !n.url,
        url: n.url,
        location: { provider, id: n.id },
      })),
    };
  }
  if (provider === "projects") {
    const keys = chrome.storage.local.getKeys
      ? (await chrome.storage.local.getKeys()).filter((key) =>
          key.startsWith(PAGE_PREFIX),
        )
      : null;
    const records = await chrome.storage.local.get(keys);
    return {
      title: "Projects",
      entries: Object.entries(records)
        .filter(([key, p]) => key.startsWith(PAGE_PREFIX) && !p.deleted)
        .map(([, p]) => {
          validatePage(p);
          return {
            id: p.id,
            name: p.title,
            kind: "Project",
            note: p.text,
            image: p.images?.[0]?.source,
            contents: p.images.map((image) => ({
              id: image.id,
              name: image.title || image.caption || "Image",
            })),
            url:
              chrome.runtime.getURL("page.html") +
              "?id=" +
              encodeURIComponent(p.id),
          };
        }),
    };
  }
  if (provider === "objects" || provider === "collections") {
    const { data } = await broker("/v1/catalog");
    const entry = (r) => ({
      ...resource(r),
      contents: (data.relations || [])
        .filter((rel) => rel.from === r.id)
        .map((rel) => data.resources[rel.to])
        .filter(Boolean)
        .map(resource),
    });
    if (provider === "collections")
      return {
        title: id ? data.catalogs[id]?.title || "Collection" : "Collections",
        parent: id ? { provider, id: "" } : null,
        entries: id
          ? data.memberships
              .filter((m) => m.catalog === id)
              .map((m) => entry(data.resources[m.resource]))
          : Object.values(data.catalogs).map((c) => ({
              id: c.id,
              name: c.title,
              kind: "Collection",
              folder: true,
              location: { provider, id: c.id },
              contents: data.memberships
                .filter((m) => m.catalog === c.id)
                .map((m) => resource(data.resources[m.resource])),
            })),
      };
    return {
      title: "Objects",
      entries: Object.values(data.resources).map(entry),
    };
  }
  if (provider === "local") {
    if (!id) {
      const { grants } = await broker("/v1/grants");
      return {
        title: "Authorized folders",
        entries: (grants || []).map((g) => ({
          id: g.id,
          name: g.label || g.root || g.id,
          kind: "Authorized folder",
          folder: true,
          location: { provider, id: g.id, path: "" },
        })),
      };
    }
    const path = location.path || "";
    let entries = [],
      total = 0;
    do {
      const result = await broker("/v1/list", {
        grant: id,
        path,
        offset: entries.length,
        limit: 1000,
      });
      total = result.total || 0;
      if (!result.entries?.length) break;
      entries.push(...result.entries);
      if (entries.length > 20000)
        throw new Error(
          "Folder exceeds 20,000 items. Open a narrower folder in Explorer.",
        );
    } while (entries.length < total);
    return {
      title: path.split("/").at(-1) || "Authorized folder",
      breadcrumbs: [
        { name: "Authorized folder", location: { provider, id, path: "" } },
        ...path
          .split("/")
          .filter(Boolean)
          .map((part, index, array) => ({
            name: part,
            location: {
              provider,
              id,
              path: array.slice(0, index + 1).join("/"),
            },
          })),
      ],
      parent: path
        ? { provider, id, path: path.split("/").slice(0, -1).join("/") }
        : { provider, id: "" },
      entries: entries.map((e) => {
        const p = e.path ?? [path, e.name].filter(Boolean).join("/");
        return {
          ...e,
          id: p,
          name: e.name,
          kind: e.kind || e.type || "File",
          folder:
            e.kind === "directory" ||
            e.type === "directory" ||
            e.is_dir === true,
          location: { provider, id, path: p },
        };
      }),
    };
  }
  throw new Error("Unsupported location");
}
function resource(r) {
  return {
    id: r.id,
    name: r.title || "Untitled",
    kind: r.kind,
    note: r.note,
    locators: r.locators,
  };
}
export function safeURL(value) {
  try {
    const u = new URL(value);
    return ["http:", "https:", "chrome-extension:"].includes(u.protocol)
      ? u.href
      : null;
  } catch {
    return null;
  }
}
