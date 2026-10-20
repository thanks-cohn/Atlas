// Safe view/open commands only; no source mutation or clipboard/transfer claims.
export function showContextMenu(event, actions) {
  event.preventDefault();
  document.querySelector(".context-menu")?.remove();
  const origin = event.currentTarget,
    menu = document.createElement("div");
  menu.className = "context-menu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", "Item actions");
  const controller = new AbortController();
  function close(focus = false) {
    controller.abort();
    menu.remove();
    if (focus) origin?.focus();
  }
  for (const [label, action] of actions) {
    const b = document.createElement("button");
    b.textContent = label;
    b.setAttribute("role", "menuitem");
    b.onclick = () => {
      close();
      Promise.resolve()
        .then(action)
        .catch(() => {});
    };
    menu.append(b);
  }
  document.body.append(menu);
  const rect = menu.getBoundingClientRect();
  menu.style.left =
    Math.max(
      8,
      Math.min(
        event.clientX || origin.getBoundingClientRect().left,
        innerWidth - rect.width - 8,
      ),
    ) + "px";
  menu.style.top =
    Math.max(
      8,
      Math.min(
        event.clientY || origin.getBoundingClientRect().bottom,
        innerHeight - rect.height - 8,
      ),
    ) + "px";
  menu.firstChild?.focus();
  menu.onkeydown = (e) => {
    const buttons = [...menu.children],
      index = buttons.indexOf(document.activeElement);
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close(true);
    } else if (["ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      buttons[
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? buttons.length - 1
            : (index + (e.key === "ArrowDown" ? 1 : -1) + buttons.length) %
              buttons.length
      ].focus();
    } else if (e.key === "Tab") close();
  };
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (!menu.contains(e.target)) close();
    },
    { signal: controller.signal },
  );
  window.addEventListener("blur", () => close(), { signal: controller.signal });
}
