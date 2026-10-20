import assert from "node:assert/strict";
import { fillPreview, releasePreview } from "../extension/workspace-preview.js";
class Node {
  constructor(tag, text) {
    this.tagName = tag;
    this.children = [];
    this.textContent = text;
  }
  append(...nodes) {
    this.children.push(...nodes);
  }
  replaceChildren(...nodes) {
    this.children = nodes;
  }
}
globalThis.document = { createElement: (tag) => new Node(tag) };
let calls = 0,
  response = {
    ok: true,
    data: btoa("<script>not executable</script>"),
    mime: "text/html",
  };
globalThis.chrome = {
  runtime: {
    sendMessage: async () => {
      calls++;
      return response;
    },
    getURL: (p) => "chrome-extension://test/" + p,
  },
  storage: { local: { get: async () => ({}) } },
};
const item = {
  id: "file",
  name: "sample.html",
  kind: "file",
  location: { provider: "local", id: "grant", path: "sample.html" },
  size: 32,
};
const p = { preview: item, previewEpoch: 0 },
  root = new Node("div");
await fillPreview(p, root, item, "preview");
assert.equal(root.children[0].tagName, "pre");
assert.equal(root.children[0].textContent, "<script>not executable</script>");
const before = calls;
item.size = 900000;
root.replaceChildren();
await fillPreview(p, root, item, "preview");
assert.equal(calls, before);
assert.match(root.children[0].textContent, /limit/);
item.size = 32;
let resolveRead;
chrome.runtime.sendMessage = () =>
  new Promise((resolve) => {
    resolveRead = resolve;
  });
root.replaceChildren();
const pending = fillPreview(p, root, item, "preview");
releasePreview(p);
resolveRead(response);
await pending;
assert.equal(root.children.length, 1);
assert.equal(
  root.children[0].textContent,
  "Loading preview…",
  "Stale read cannot replace viewer",
);
chrome.runtime.sendMessage = async () => ({
  ok: false,
  error: { message: "Permission revoked" },
});
await assert.rejects(
  fillPreview(p, root, item, "preview"),
  /Permission revoked/,
);
const remote = {
  id: "remote",
  name: "Remote image",
  kind: "image",
  image: "https://example.org/large.png",
};
p.preview = remote;
root.replaceChildren();
await fillPreview(p, root, remote, "preview");
assert(
  !root.children.some((n) => n.tagName === "img"),
  "Remote original is not implicitly fetched",
);
assert(root.children.some((n) => n.tagName === "a"));
console.log(
  "PASS bounded previews, text as text, stale-result suppression, permission denial and no implicit remote downloads",
);
