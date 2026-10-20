// A small organizational layer around the existing preview rows and editors.
export function createCardSectionControls({ store, getOwner }) {
  const make = (tag, text = "", cls = "") => {
    const e = document.createElement(tag);
    e.textContent = text;
    e.className = cls;
    return e;
  };
  const button = (text, handler, label = text) => {
    const e = make("button", text);
    e.type = "button";
    e.setAttribute("aria-label", label);
    e.onclick = handler;
    return e;
  };
  let key = null,
    owner = null,
    state = null,
    loadError = "",
    epoch = 0,
    redraw = () => {};
  const active = (area) =>
    (state?.document.sections || []).filter(
      (s) => s.area === area && !s.removedAt,
    );
  const label = (s) =>
    state?.names.find((n) => n.id === s.nameId)?.label || "Section";
  async function refresh(token) {
    const next = await store.read(owner);
    if (token !== epoch) return;
    state = next;
    loadError = "";
    redraw();
  }
  async function run(operation, status) {
    const token = epoch,
      focusLabel = document.activeElement?.getAttribute("aria-label");
    try {
      await operation();
      if (token === epoch) {
        await refresh(token);
        if (focusLabel)
          [...document.querySelectorAll("[aria-label]")]
            .find((e) => e.getAttribute("aria-label") === focusLabel)
            ?.focus();
      }
    } catch (error) {
      if (status) status.textContent = error.message;
    }
  }
  function editor(area, section = null) {
    const targetOwner = owner,
      token = epoch,
      dialog = make("dialog", "", "pin-section-editor");
    dialog.setAttribute(
      "aria-label",
      section ? "Rename local Section" : "Add local Section",
    );
    const title = make("h2", section ? "Rename local Section" : "Add Section"),
      help = make("p", "Names are reusable. Contents stay on this Card."),
      controls = make("div", "", "preview-section-actions"),
      body = make("div"),
      status = make("p");
    status.setAttribute("role", "status");
    const close = button("Cancel", () => dialog.close());
    function form(existing) {
      body.replaceChildren();
      const form = make("form"),
        input = make(existing ? "select" : "input"),
        search = make("input");
      input.setAttribute(
        "aria-label",
        existing ? "Existing Section names" : "Section name",
      );
      input.required = true;
      if (existing) {
        search.type = "search";
        search.placeholder = "Find a Section name…";
        search.setAttribute("aria-label", "Search Section names");
        input.size = 6;
        const paint = () => {
          input.replaceChildren();
          for (const n of [...state.names]
            .sort((a, b) =>
              a.label.localeCompare(b.label, undefined, {
                sensitivity: "base",
                numeric: true,
              }),
            )
            .filter((n) =>
              n.key.includes(
                search.value.normalize("NFKC").trim().toLowerCase(),
              ),
            )) {
            const option = make("option", n.label);
            option.value = n.id;
            input.append(option);
          }
        };
        search.oninput = paint;
        paint();
        form.append(search);
      } else {
        input.maxLength = 120;
        input.value = section ? label(section) : "";
      }
      const submit = make("button", section ? "Rename" : "Add Section");
      submit.type = "submit";
      form.append(input, submit);
      body.append(form);
      (existing ? search : input).focus();
      form.onsubmit = async (event) => {
        event.preventDefault();
        if (token !== epoch) {
          dialog.close();
          return;
        }
        submit.disabled = true;
        try {
          if (section) await store.rename(targetOwner, section.id, input.value);
          else
            await store.create(
              targetOwner,
              area,
              existing ? { nameId: input.value } : { label: input.value },
            );
          if (token === epoch) await refresh(token);
          dialog.close();
        } catch (error) {
          status.textContent = error.message;
        } finally {
          submit.disabled = false;
        }
      };
    }
    controls.append(
      button("Create New Section", () => form(false)),
      button("Choose Existing Section", () => form(true)),
    );
    dialog.append(title, help, controls, body, status, close);
    dialog.addEventListener(
      "close",
      () => {
        dialog.remove();
        if (token === epoch)
          document
            .getElementById("preview-" + area + "-panel")
            ?.querySelector(".preview-area-header button")
            ?.focus();
      },
      { once: true },
    );
    document.body.append(dialog);
    dialog.showModal();
    if (section) form(false);
  }
  return {
    setContext(context, callback) {
      redraw = callback;
      const nextOwner = getOwner();
      if (key === context && owner === nextOwner) return;
      key = context;
      owner = nextOwner;
      state = null;
      const token = ++epoch;
      refresh(token).catch((error) => {
        if (token === epoch) {
          loadError = error.message;
          redraw();
        }
      });
    },
    header(area, host) {
      const head = make("div", "", "preview-area-header");
      head.append(make("strong", area === "notes" ? "Notes" : "Bookmarks"));
      const feedback = make("span", loadError, "preview-save-status");
      feedback.setAttribute("role", "status");
      const add = button("+ Section", async () => {
        const token = epoch;
        try {
          await refresh(token);
          if (token === epoch) editor(area);
        } catch (error) {
          feedback.textContent = error.message;
        }
      });
      head.append(add, feedback);
      host.append(head);
    },
    groups(area, host) {
      const targetOwner = owner,
        context = key,
        groups = new Map(),
        status = make("p", "", "preview-save-status");
      status.setAttribute("role", "status");
      const unsectioned = make("div", "", "preview-section-items");
      host.append(unsectioned);
      const sections = active(area);
      for (const [index, s] of sections.entries()) {
        const group = make("section", "", "preview-local-section"),
          head = make("div", "", "preview-area-header"),
          items = make("div", "", "preview-section-items");
        const up = button(
            "↑",
            () => run(() => store.move(targetOwner, s.id, -1), status),
            "Move " + label(s) + " up",
          ),
          down = button(
            "↓",
            () => run(() => store.move(targetOwner, s.id, 1), status),
            "Move " + label(s) + " down",
          );
        up.disabled = index === 0;
        down.disabled = index === sections.length - 1;
        head.append(
          make("h4", label(s)),
          up,
          down,
          button(
            "Rename",
            () => editor(area, s),
            "Rename " + label(s) + " Section",
          ),
          button(
            "Remove",
            () => run(() => store.remove(targetOwner, s.id), status),
            "Remove " + label(s) + " Section; keep contents",
          ),
        );
        group.append(head, items);
        host.append(group);
        groups.set(s.id, items);
      }
      host.append(status);
      return (item, row) => {
        const ref = area === "notes" ? item.id : item.url,
          id = state?.document.memberships[store.reference(context, ref, area)],
          wrapper = make("div", "", "preview-section-item");
        wrapper.append(row);
        if (sections.length) {
          const select = make("select");
          select.setAttribute(
            "aria-label",
            "Section for " + (item.title || "item"),
          );
          for (const [value, text] of [
            ["", "Unsectioned"],
            ...sections.map((s) => [s.id, label(s)]),
          ]) {
            const option = make("option", text);
            option.value = value;
            select.append(option);
          }
          select.value = groups.has(id) ? id : "";
          select.onchange = () =>
            run(
              () => store.assign(targetOwner, area, context, ref, select.value),
              status,
            );
          wrapper.append(select);
        }
        (groups.get(id) || unsectioned).append(wrapper);
      };
    },
  };
}
