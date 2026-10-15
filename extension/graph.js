// Provider-neutral catalog UI; locators are references, never browser-side authority.
export function createGraphUI({ api, ask, notice, chosen, getGrant }) {
  const $ = (id) => document.getElementById(id);
  let snapshot = null,
    selected = null;
  const el = (tag, value, cls) => {
    const node = document.createElement(tag);
    node.textContent = value;
    if (cls) node.className = cls;
    return node;
  };
  async function load() {
    snapshot = await api("/v1/catalog");
    render();
    return snapshot;
  }
  async function change(action, args) {
    const result = await api("/v1/catalog", {
      action,
      args,
      expected_revision: snapshot.revision,
    });
    snapshot = result;
    render();
    return result.result;
  }
  function run(fn) {
    return async () => {
      try {
        $("library-status").textContent = "";
        await fn();
      } catch (error) {
        $("library-status").textContent = error.message;
      }
    };
  }
  function render() {
    if (!snapshot) return;
    const data = snapshot.data;
    const filter = $("catalog-filter"),
      value = filter.value;
    filter.replaceChildren(el("option", "All resources"));
    filter.firstChild.value = "";
    for (const catalog of Object.values(data.catalogs)) {
      const option = el("option", catalog.title);
      option.value = catalog.id;
      filter.append(option);
    }
    filter.value = value;
    const members = value
      ? new Set(
          data.memberships
            .filter((m) => m.catalog === value)
            .map((m) => m.resource),
        )
      : null;
    const resources = $("library-resources");
    resources.replaceChildren();
    for (const resource of Object.values(data.resources).filter(
      (r) => !members || members.has(r.id),
    )) {
      const card = el("article", "", "resource-card");
      card.classList.toggle("selected", selected === resource.id);
      const title = el("strong", resource.title || "Untitled");
      const kind = el("small", resource.kind);
      card.append(title, kind);
      const tags = data.tags[resource.id] || [];
      if (tags.length)
        card.append(
          el("p", tags.map((t) => "#" + t).join(" "), "resource-tags"),
        );
      if (resource.note) card.append(el("p", resource.note));
      for (const locator of resource.locators) {
        card.append(
          el(
            "small",
            `${locator.provider}: ${locator.reference}`,
            "resource-reference",
          ),
        );
      }
      const links = data.relations.filter((r) => r.from === resource.id);
      for (const link of links)
        card.append(
          el(
            "p",
            `${link.type} → ${data.resources[link.to]?.title || link.to}`,
            "resource-tags",
          ),
        );
      const controls = el("div", "", "resource-controls");
      const button = (name, fn) => {
        const node = el("button", name);
        node.onclick = run(fn);
        controls.append(node);
      };
      button("Tag", async () => {
        const tag = await ask(
          "Add a tag",
          "",
          "Tags are portable metadata; they do not rename the file.",
        );
        if (tag) await change("tag", { resource: resource.id, tag });
      });
      button("Note", async () => {
        const note = await ask(
          "Edit resource note",
          resource.note,
          "Write a portable note for this resource.",
          "Note",
        );
        if (note !== null)
          await change("update_resource", { resource: resource.id, note });
      });
      button("Add to catalog", async () => {
        const catalogs = Object.values(data.catalogs);
        if (!catalogs.length) {
          $("library-status").textContent = "Create a catalog first.";
          return;
        }
        const chosen = await chooseCatalog(catalogs);
        if (chosen)
          await change("assign", { resource: resource.id, catalog: chosen });
      });
      button(
        selected && selected !== resource.id
          ? "Link selected → this"
          : "Select for link",
        async () => {
          if (selected && selected !== resource.id) {
            const type = await ask(
              "Create relationship",
              "reference-for",
              `Link the selected resource to “${resource.title}”.`,
              "Relationship type",
            );
            if (type) {
              await change("link", {
                source: selected,
                target: resource.id,
                relation_type: type,
              });
              selected = null;
              render();
            }
          } else {
            selected = resource.id;
            render();
            $("library-status").textContent =
              "Choose another resource and click “Link selected → this”.";
          }
        },
      );
      if (resource.kind === "bookmark") {
        const url = resource.locators.find(
          (l) => l.provider === "web",
        )?.reference;
        if (url) {
          button("Open bookmark", () => {
            const parsed = new URL(url);
            if (!["http:", "https:"].includes(parsed.protocol))
              throw new Error("Only HTTP(S) bookmarks can be opened.");
            chrome.tabs.create({ url: parsed.href });
          });
        }
      }
      card.append(controls);
      resources.append(card);
    }
    if (!resources.children.length)
      resources.append(
        el(
          "p",
          "No resources here yet. Add a bookmark, or right-click a local file and choose Organize.",
          "library-empty",
        ),
      );
  }
  async function chooseCatalog(catalogs) {
    if (catalogs.length === 1) return catalogs[0].id;
    const title = await ask(
      "Choose catalog",
      catalogs[0].title,
      "Enter a catalog title: " + catalogs.map((c) => c.title).join(" · "),
      "Catalog title",
    );
    if (title === null) return null;
    const existing = catalogs.find((c) => c.title === title);
    if (!existing)
      throw new Error("No catalog has that title. Create it first.");
    return existing.id;
  }
  async function open() {
    try {
      await load();
      $("library-dialog").showModal();
    } catch (error) {
      notice(error.message);
    }
  }
  async function organize() {
    const files = chosen(),
      grant = getGrant();
    if (!files.length || !grant) return;
    try {
      await load();
      for (const file of files) {
        const reference = grant.id + "/" + file.path;
        let resource = Object.values(snapshot.data.resources).find((r) =>
          r.locators.some(
            (l) => l.provider === "local" && l.reference === reference,
          ),
        );
        if (!resource) {
          const id = await change("add_resource", {
            kind: file.kind === "directory" ? "folder" : "file",
            title: file.name,
            locators: [{ provider: "local", reference }],
            note: "",
          });
          resource = snapshot.data.resources[id];
        }
      }
      $("library-dialog").showModal();
      $("library-status").textContent =
        `${files.length} local resource(s) saved. Add tags, notes or catalog membership below.`;
    } catch (error) {
      notice(error.message);
    }
  }
  $("library").onclick = open;
  $("library-close").onclick = () => $("library-dialog").close();
  $("catalog-filter").onchange = render;
  $("catalog-create").onclick = run(async () => {
    const title = await ask(
      "Create catalog",
      "",
      "Catalog membership never relocates the underlying files.",
      "Catalog title",
    );
    if (title) await change("add_catalog", { title });
  });
  $("bookmark-create").onclick = run(async () => {
    const value = await ask(
      "Save a bookmark",
      "https://",
      "Save an HTTP(S) URL as a portable resource.",
      "URL",
    );
    if (!value) return;
    let url;
    try {
      url = new URL(value);
    } catch {
      throw new Error("Enter a valid HTTP(S) URL.");
    }
    if (!["http:", "https:"].includes(url.protocol))
      throw new Error("Bookmarks must use HTTP or HTTPS.");
    const title = await ask("Bookmark title", url.hostname, "", "Title");
    if (title === null) return;
    await change("add_resource", {
      kind: "bookmark",
      title,
      locators: [{ provider: "web", reference: url.href }],
      note: "",
    });
  });
  $("graph-export").onclick = run(async () => {
    await load();
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(snapshot.data, null, 2) + "\n"], {
        type: "application/json",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "atlas-catalog.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  return { open, organize };
}
