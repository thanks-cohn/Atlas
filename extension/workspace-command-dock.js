// A single shared command surface, moved by CSS between toolbar and corner dock.
export function createCommandDock({ commands, onError, delay = 1400 }) {
  const root = document.createElement("div");
  root.className = "command-dock";
  const launcher = document.createElement("button");
  launcher.className = "command-launcher";
  launcher.textContent = "☰";
  launcher.type = "button";
  launcher.title = "Workspace commands";
  launcher.setAttribute("aria-label", "Workspace commands");
  launcher.setAttribute("aria-haspopup", "menu");
  launcher.setAttribute("aria-expanded", "false");
  const menu = document.createElement("div");
  menu.className = "command-flyout";
  menu.id = "workspace-command-menu";
  menu.hidden = true;
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", "Workspace commands");
  launcher.setAttribute("aria-controls", menu.id);
  root.append(launcher, menu);
  let timer = null,
    hovered = false;
  const cancel = () => {
    clearTimeout(timer);
    timer = null;
    root.classList.remove("quiet");
  };
  const modalOpen = () => !!document.querySelector("dialog[open]");
  function close(returnFocus = false) {
    cancel();
    menu.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    if (returnFocus) launcher.focus({ preventScroll: true });
    schedule();
  }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (hovered || root.contains(document.activeElement) || modalOpen())
        return;
      if (!menu.hidden) close();
      else root.classList.add("quiet");
    }, delay);
  }
  function refresh() {
    for (const b of menu.children) {
      const command = commands[b.dataset.command];
      b.textContent =
        typeof command.label === "function" ? command.label() : command.label;
      b.disabled = command.enabled ? !command.enabled() : false;
    }
  }
  for (const [id, command] of Object.entries(commands)) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.command = id;
    b.setAttribute("role", "menuitem");
    b.onclick = () => {
      cancel();
      Promise.resolve()
        .then(command.run)
        .catch(onError)
        .finally(() => {
          refresh();
          if (!modalOpen()) close(true);
          else schedule();
        });
    };
    menu.append(b);
  }
  function open() {
    cancel();
    refresh();
    menu.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    [...menu.children].find((b) => !b.disabled)?.focus();
  }
  launcher.onclick = () => {
    menu.hidden ? open() : close(true);
  };
  launcher.onkeydown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      open();
    }
  };
  root.onpointerenter = () => {
    hovered = true;
    cancel();
  };
  root.onpointerleave = () => {
    hovered = false;
    schedule();
  };
  root.addEventListener("focusin", cancel);
  root.addEventListener("focusout", schedule);
  menu.onkeydown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close(true);
      return;
    }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const buttons = [...menu.children].filter((b) => !b.disabled),
        index = buttons.indexOf(document.activeElement);
      buttons[
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? buttons.length - 1
            : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) %
              buttons.length
      ]?.focus();
    }
  };
  document.addEventListener("pointerdown", (event) => {
    if (!menu.hidden && !root.contains(event.target) && !modalOpen()) close();
  });
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape" && !menu.hidden && !modalOpen()) {
        event.preventDefault();
        event.stopPropagation();
        close(true);
      }
    },
    { capture: true },
  );
  document.addEventListener("close", () => schedule(), true);
  window.addEventListener("blur", schedule);
  refresh();
  schedule();
  return { root, refresh, close, launcher };
}
