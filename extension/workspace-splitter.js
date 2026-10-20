// Pointer capture keeps a resize owned by its edge, even outside the edge bounds.
// Presentation only: no provider data or permissions are read or written here.
export function bindSplitter(
  edge,
  { axis, value, bounds, geometry, change, commit, reset = 50 },
) {
  let drag = null;
  const clamp = (n) => {
    const [min, max] = bounds();
    return Math.max(min, Math.min(max, n));
  };
  function update(n) {
    change(clamp(n));
    sync();
  }
  function sync() {
    const [min, max] = bounds();
    edge.setAttribute("aria-valuemin", String(Math.round(min)));
    edge.setAttribute("aria-valuemax", String(Math.round(max)));
    edge.setAttribute("aria-valuenow", String(Math.round(value())));
    edge.setAttribute("aria-valuetext", Math.round(value()) + " percent");
  }
  function end(event) {
    if (!drag || event.pointerId !== drag.id) return;
    drag = null;
    edge.classList.remove("dragging");
    edge.ownerDocument.body.classList.remove("resizing");
    if (edge.hasPointerCapture?.(event.pointerId))
      edge.releasePointerCapture(event.pointerId);
    commit();
  }
  edge.setAttribute("role", "separator");
  edge.tabIndex = 0;
  edge.setAttribute(
    "aria-orientation",
    axis === "x" ? "vertical" : "horizontal",
  );
  edge.onpointerdown = (event) => {
    if (event.button !== 0 || drag) return;
    event.preventDefault();
    const { start, size } = geometry();
    if (size <= 0) return;
    drag = {
      id: event.pointerId,
      start,
      size,
      offset:
        (axis === "x" ? event.clientX : event.clientY) -
        start -
        (value() / 100) * size,
    };
    edge.setPointerCapture(event.pointerId);
    edge.classList.add("dragging");
    edge.ownerDocument.body.classList.add("resizing");
    edge.focus({ preventScroll: true });
  };
  edge.onpointermove = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    event.preventDefault();
    update(
      (((axis === "x" ? event.clientX : event.clientY) -
        drag.start -
        drag.offset) /
        drag.size) *
        100,
    );
  };
  edge.onpointerup = end;
  edge.onpointercancel = end;
  edge.onlostpointercapture = end;
  edge.ondblclick = () => {
    update(reset);
    commit();
  };
  edge.onkeydown = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const down = axis === "x" ? "ArrowLeft" : "ArrowUp",
      up = axis === "x" ? "ArrowRight" : "ArrowDown";
    let n = value();
    if (event.key === down) n -= event.shiftKey ? 10 : 2;
    else if (event.key === up) n += event.shiftKey ? 10 : 2;
    else if (event.key === "Home") n = bounds()[0];
    else if (event.key === "End") n = bounds()[1];
    else if (event.key === "Enter") n = reset;
    else return;
    event.preventDefault();
    update(n);
    commit();
  };
  sync();
  return { sync };
}
