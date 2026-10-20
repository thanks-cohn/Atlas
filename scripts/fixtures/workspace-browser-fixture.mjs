// Deliberately synthetic data. Browser rendering tests do not prove native/MV3 transport.
export function installWorkspaceFixture() {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 420;
  const c = canvas.getContext("2d");
  const g = c.createLinearGradient(0, 0, 720, 420);
  g.addColorStop(0, "#b5d1e4");
  g.addColorStop(1, "#e7e7d6");
  c.fillStyle = g;
  c.fillRect(0, 0, 720, 420);
  c.fillStyle = "#829f9d";
  c.beginPath();
  c.moveTo(0, 350);
  c.lineTo(220, 90);
  c.lineTo(420, 350);
  c.lineTo(570, 150);
  c.lineTo(720, 330);
  c.lineTo(720, 420);
  c.lineTo(0, 420);
  c.fill();
  c.fillStyle = "#516e73";
  c.beginPath();
  c.moveTo(0, 420);
  c.lineTo(310, 180);
  c.lineTo(570, 420);
  c.fill();
  const image = canvas.toDataURL("image/png");
  const children = Array.from({ length: 260 }, (_, i) => ({
    id: String(i + 10),
    title: i === 0 ? "Alpine study" : `Reference ${String(i).padStart(3, "0")}`,
    url: "https://example.org/" + i,
    parentId: "1",
  }));
  const tree = {
    id: "0",
    children: [{ id: "1", title: "Research", parentId: "0", children }],
  };
  const base = {
    "atlas.workspace.layout.v1": { dual: true, ratio: 50, heights: [55, 55] },
    atlasBookmarkCoversV1: { 10: { url: "https://example.org/0", image } },
  };
  const read = () => ({
    ...base,
    ...JSON.parse(localStorage.getItem("atlas-test-storage") || "{}"),
  });
  const store = {
    get: async (keys) => {
      const data = read();
      if (keys === null) return data;
      return Object.fromEntries(
        (Array.isArray(keys) ? keys : [keys]).map((key) => [key, data[key]]),
      );
    },
    getKeys: async () => Object.keys(read()),
    set: async (values) =>
      localStorage.setItem(
        "atlas-test-storage",
        JSON.stringify({ ...read(), ...values }),
      ),
    remove: async () => {},
  };
  const listeners = { addListener() {}, removeListener() {} };
  globalThis.fixtureCalls = [];
  const find = (id) =>
    id === "0"
      ? tree
      : id === "1"
        ? tree.children[0]
        : children.find((n) => n.id === id);
  globalThis.chrome = {
    runtime: {
      getURL: (path) => new URL(path, location.href).href,
      onMessage: listeners,
      sendMessage: async (message) => {
        fixtureCalls.push(message);
        if (message.type !== "api")
          return { ok: true, state: "OFFLINE", paired: false, grants: [] };
        if (globalThis.fixtureDenied)
          return {
            ok: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Permission revoked. Reconnect in Explorer settings.",
            },
          };
        if (message.path === "/v1/grants")
          return {
            ok: true,
            grants: [{ id: "test-grant", label: "Research files" }],
          };
        if (message.path === "/v1/list")
          return {
            ok: true,
            total: 3,
            entries: [
              { name: "Alpine study.png", kind: "file", size: 12000 },
              { name: "Field notes.txt", kind: "file", size: 120 },
              { name: "Studies", kind: "directory" },
            ],
          };
        if (message.path === "/v1/read")
          return {
            ok: true,
            mime: message.body.path.endsWith(".png")
              ? "image/png"
              : "text/plain",
            data: message.body.path.endsWith(".png")
              ? image.split(",")[1]
              : btoa(
                  "Field notes\n\nKeep the composition quiet. Preserve the source and its context.",
                ),
          };
        if (message.path === "/v1/catalog")
          return {
            ok: true,
            data: {
              resources: {
                note: {
                  id: "note",
                  title: "Composition notes",
                  kind: "note",
                  note: "A place for everything.\n\nCompare the image with the original notes while keeping both hierarchies in view.\n\nPinned previews stay in place as you browse.",
                  locators: [],
                },
              },
              catalogs: {
                collection: { id: "collection", title: "Research collection" },
              },
              memberships: [{ catalog: "collection", resource: "note" }],
              relations: [],
            },
          };
        return { ok: true, receipts: [], entries: [] };
      },
    },
    storage: { local: store, onChanged: listeners },
    bookmarks: {
      getTree: async () => [tree],
      getSubTree: async (id) => [find(id)],
      get: async (id) => [find(id)],
      onCreated: listeners,
      onChanged: listeners,
      onRemoved: listeners,
      onMoved: listeners,
    },
    tabs: {
      create: async ({ url }) => {
        window.open(url);
        return { id: 2 };
      },
      query: async () => [],
      onRemoved: listeners,
    },
    permissions: { contains: async () => false },
    sidePanel: {},
  };
}
