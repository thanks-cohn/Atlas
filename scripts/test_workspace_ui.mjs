// Observable renderer flow against a small DOM double; this is not browser proof.
import assert from "node:assert/strict";
class Node {
  constructor(tag = "div") {
    this.tagName = tag;
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.style = { setProperty() {} };
    this.className = "";
    this.value = "";
    this.scrollTop = 0;
    this.scrollLeft = 0;
    this.isConnected = true;
    this.classList = {
      add: (name) => {
        this.className += " " + name;
      },
      remove: (name) => {
        this.className = this.className
          .split(" ")
          .filter((c) => c !== name)
          .join(" ");
      },
      toggle: (name, on) => {
        const set = new Set(this.className.split(" "));
        on ? set.add(name) : set.delete(name);
        this.className = [...set].join(" ");
      },
    };
  }
  get firstChild() {
    return this.children[0];
  }
  append(...nodes) {
    this.children.push(...nodes);
  }
  replaceChildren(...nodes) {
    this.children = [...nodes];
  }
  setAttribute(k, v) {
    this.attributes[k] = v;
  }
  removeAttribute(k) {
    delete this.attributes[k];
  }
  matches(selector) {
    return selector
      .split(",")
      .some((s) =>
        s.startsWith(".")
          ? this.className.split(" ").includes(s.slice(1))
          : this.tagName === s,
      );
  }
  querySelectorAll(selector) {
    return this.children
      .filter((n) => n instanceof Node)
      .flatMap((n) => [
        ...(n.matches(selector) ? [n] : []),
        ...n.querySelectorAll(selector),
      ]);
  }
  querySelector(selector) {
    return this.querySelectorAll(selector)[0];
  }
  contains(node) {
    return (
      this === node ||
      this.children.some((n) => n instanceof Node && n.contains(node))
    );
  }
  addEventListener() {}
  getBoundingClientRect() {
    return { top: 0, left: 0, width: 1000, height: 500 };
  }
  focus() {
    this.focused = true;
    document.activeElement = this;
  }
}
const ids = Object.fromEntries(
  [
    "panes",
    "navigation",
    "dual",
    "restore",
    "width",
    "height",
    "notice",
    "activity",
    "workspace-chrome",
  ].map((id) => [id, new Node()]),
);
const expansions = ["top", "bottom"].map((name) => {
  const n = new Node("button");
  n.dataset.expand = name;
  return n;
});
const body = new Node("body"),
  main = new Node("main"),
  actions = new Node();
actions.className = "actions";
main.append(actions, ...Object.values(ids));
body.append(main);
globalThis.window = { addEventListener() {} };
globalThis.requestAnimationFrame = (fn) => fn();
globalThis.document = {
  body,
  scrollingElement: body,
  activeElement: body,
  querySelector: (selector) => body.querySelector(selector),
  createElement: (tag) => new Node(tag),
  getElementById: (id) => ids[id],
  querySelectorAll: () => expansions,
  addEventListener() {},
};
const writes = [];
globalThis.chrome = {
  runtime: { getURL: (p) => "chrome-extension://test/" + p },
  tabs: { create: async () => {} },
  bookmarks: {
    getTree: async () => [
      { id: "0", children: [{ id: "1", title: "Folder" }] },
    ],
    getSubTree: async () => [
      { id: "1", title: "Folder", parentId: "0", children: [] },
    ],
  },
  storage: {
    local: { get: async () => ({}), set: async (data) => writes.push(data) },
  },
};
await import("../extension/workspace.js");
const [left, right] = ids.panes.children;
assert.equal(right.hidden, true);
assert.equal(left.querySelector(".items").children.length, 1);
ids.dual.onclick();
assert.equal(right.hidden, false);
const row = left.querySelector(".items").children[0];
row.onclick({});
assert.equal(row.attributes["aria-selected"], "true");
let viewer = left.querySelector(".viewer");
assert.equal(viewer.children[0].children[0].textContent, "Folder");
await viewer.children[0].children[1].children[0].onclick();
await row.ondblclick();
assert.equal(
  left.querySelector(".items").children[0].textContent,
  "Nothing here yet.",
);
assert.equal(
  viewer.children[0].children[0].textContent,
  "Folder",
  "Pinned content survives navigation",
);
expansions[1].onclick();
assert.equal(left.dataset.windowMax, "viewer");
assert.equal(right.dataset.windowMax, "viewer");
ids.restore.onclick();
assert.equal(left.dataset.windowMax, "");
assert.equal(
  right.querySelector(".items").children[0].textContent,
  "Nothing here yet.",
  "Other pane unchanged",
);
assert(writes.length > 0);
console.log(
  "Workspace renderer selection, pinned navigation, dual visibility and restore PASS (DOM double)",
);
