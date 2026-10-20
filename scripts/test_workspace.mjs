import assert from "node:assert/strict";
import {
  paneState,
  visit,
  ordered,
  select,
  layoutPreferences,
} from "../extension/workspace-model.js";
import { listing, safeURL } from "../extension/workspace-providers.js";
const left = paneState(),
  right = paneState("projects");
visit(left, { provider: "bookmarks", id: "" });
visit(left, { provider: "bookmarks", id: "nested" });
assert.equal(right.index, -1);
assert.equal(right.location.provider, "projects");
left.entries = [
  { id: "b", name: "Zulu" },
  { id: "a", name: "alpha" },
  { id: "c", name: "Beta" },
];
assert.deepEqual(
  ordered(left).map((e) => e.id),
  ["a", "c", "b"],
);
select(left, ordered(left), 0);
select(left, ordered(left), 2, { shiftKey: true });
assert.equal(left.selected.size, 3);
select(left, ordered(left), 1, { ctrlKey: true });
assert.equal(left.selected.size, 2);
assert.equal(right.selected.size, 0);
left.sort = "descending";
assert.equal(ordered(left)[0].id, "b");
left.query = "ALP";
assert.equal(ordered(left).length, 1);
left.preview = { id: "p" };
left.pinned = true;
visit(left, { provider: "local", id: "" });
assert.equal(left.preview.id, "p");
left.index = 0;
visit(left, left.history[0], false);
visit(left, { provider: "objects", id: "" });
assert.equal(left.history.length, 2);
left.pinned = false;
visit(left, { provider: "projects", id: "" });
assert.equal(left.preview, null);
assert.deepEqual(layoutPreferences({ dual: true, ratio: 99, height: -1 }), {
  dual: true,
  ratio: 70,
  height: 25,
});
assert.equal(safeURL("javascript:alert(1)"), null);
assert.equal(safeURL("file:///etc/passwd"), null);
const calls = [];
globalThis.chrome = {
  runtime: {
    getURL: (p) => "chrome-extension://test/" + p,
    sendMessage: async (m) => {
      calls.push(m);
      if (m.path === "/v1/grants")
        return { ok: true, grants: [{ id: "g", label: "Granted" }] };
      if (m.path === "/v1/list")
        return {
          ok: true,
          total: 1,
          entries: [{ name: "child", kind: "directory" }],
        };
      if (m.path === "/v1/catalog")
        return {
          ok: true,
          data: {
            resources: {
              r: {
                id: "r",
                title: "Original",
                kind: "image",
                note: "Saved",
                locators: [{ provider: "r2", reference: "bucket/key" }],
              },
            },
            catalogs: { c: { id: "c", title: "Collection" } },
            memberships: [{ resource: "r", catalog: "c" }],
          },
        };
    },
  },
  bookmarks: {
    getTree: async () => [
      { id: "0", children: [{ id: "1", title: "Folder", children: [] }] },
    ],
    getSubTree: async () => [
      {
        id: "1",
        parentId: "0",
        children: [{ id: "2", title: "Source", url: "https://example.org" }],
      },
    ],
  },
  storage: { local: { get: async () => ({}) } },
};
assert.equal(
  (await listing({ provider: "bookmarks", id: "" })).entries[0].folder,
  true,
);
assert.equal(
  (await listing({ provider: "bookmarks", id: "1" })).parent.id,
  "0",
);
assert.equal(
  (await listing({ provider: "local", id: "" })).entries[0].location.id,
  "g",
);
assert.equal(
  (await listing({ provider: "local", id: "g", path: "parent" })).entries[0]
    .location.path,
  "parent/child",
);
assert.equal(
  (await listing({ provider: "collections", id: "c" })).entries[0].id,
  "r",
);
assert.equal(
  (await listing({ provider: "objects", id: "" })).entries[0].locators[0]
    .reference,
  "bucket/key",
);
await assert.rejects(listing({ provider: "r2", id: "" }), /not implemented/);
chrome.runtime.sendMessage = async () => ({
  ok: false,
  error: { message: "Permission revoked" },
});
await assert.rejects(
  listing({ provider: "local", id: "g", path: "" }),
  /Permission revoked/,
);
assert(calls.every((c) => c.type === "api" && !c.path.includes("write")));
console.log(
  "Workspace independent state, history, selection, pinning, adapters and denial tests PASS",
);
