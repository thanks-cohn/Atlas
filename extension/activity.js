// Durable recovery uses the same trusted worker broker as all filesystem actions.
const trigger =
  document.getElementById("activity") ||
  document.getElementById("activityButton");
const dialog =
  document.getElementById("activity-dialog") ||
  document.body.appendChild(document.createElement("dialog"));
dialog.setAttribute("aria-label", "Activity and recovery");
let loading = false;
const node = (tag, text) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  return element;
};
async function api(path, body) {
  const response = await chrome.runtime.sendMessage({
    type: "api",
    path,
    ...(body === undefined ? {} : { body }),
  });
  if (!response?.ok)
    throw new Error(
      response?.error?.message ||
        "Companion unavailable. Reconnect to view activity.",
    );
  return response;
}
async function load() {
  if (loading) return;
  loading = true;
  dialog.replaceChildren();
  const header = node("div");
  header.className = "details-top";
  header.append(node("strong", "Activity & recovery"));
  const close = node("button", "×");
  close.setAttribute("aria-label", "Close activity");
  close.onclick = () => dialog.close();
  header.append(close);
  dialog.append(
    header,
    node(
      "p",
      "Recent operations are saved by your companion across app restarts. Trash recovery restores to the original folder without replacing existing files.",
    ),
  );
  const status = node("p", "Loading activity…");
  status.setAttribute("role", "status");
  dialog.append(status);
  try {
    const [{ receipts }, { grants }] = await Promise.all([
      api("/v1/receipts"),
      api("/v1/grants"),
    ]);
    const writable = new Set(
      grants.filter((g) => g.operations.includes("write")).map((g) => g.id),
    );
    const restored = new Set(
      receipts
        .filter((r) => r.action === "restore")
        .flatMap((r) =>
          r.results
            .filter((item) => item.ok)
            .map((item) => `${item.source?.grant}/${item.source?.path}`),
        ),
    );
    status.textContent = receipts.length
      ? `Showing ${receipts.length} recent authorized operations (maximum 100).`
      : "No recorded operations for your current folder grants.";
    const list = node("div");
    list.className = "activity-list";
    dialog.append(list);
    for (const receipt of receipts) {
      const card = node("article");
      card.className = "resource-card";
      card.append(
        node(
          "strong",
          `${receipt.action} · ${receipt.status === "pending" ? "OUTCOME_UNKNOWN" : receipt.status}`,
        ),
      );
      card.append(
        node("small", new Date(receipt.created * 1000).toLocaleString()),
      );
      if (receipt.status === "pending")
        card.append(
          node(
            "p",
            "Outcome unknown: this operation may be running or interrupted. Inspect your filesystem before taking further action. Automatic retry is intentionally unavailable.",
          ),
        );
      for (const result of receipt.results) {
        const line = node("div");
        line.className = "activity-result";
        line.append(
          node(
            "p",
            `${result.ok ? "✓" : "⚠"} ${result.original?.path || result.source?.path || result.destination?.path || "Folder operation"}${result.error ? ` — ${result.error.code}` : ""}`,
          ),
        );
        if (
          receipt.action === "trash" &&
          result.ok &&
          result.recoverable &&
          result.original &&
          result.trash_id
        ) {
          const original = result.original;
          const already = restored.has(`${original.grant}/${result.trash_id}`);
          const restore = node(
            "button",
            already ? "Restored" : "Restore to original folder",
          );
          restore.disabled = already || !writable.has(original.grant);
          if (!writable.has(original.grant))
            restore.title = "This folder is currently read-only.";
          restore.onclick = async () => {
            restore.disabled = true;
            status.textContent = "Restoring…";
            try {
              const path = original.path.split("/").slice(0, -1).join("/");
              const response = await api("/v1/operate", {
                id: crypto.randomUUID(),
                action: "restore",
                sources: [{ grant: original.grant, path: result.trash_id }],
                destination: { grant: original.grant, path },
              });
              const outcome = response.receipt;
              if (outcome.status !== "completed")
                throw new Error(
                  outcome.results.find((item) => !item.ok)?.error?.message ||
                    `Restore ${outcome.status}. Inspect activity and filesystem before continuing.`,
                );
              window.dispatchEvent(new CustomEvent("atlas:refresh"));
              loading = false;
              await load();
            } catch (error) {
              // A timeout can follow successful mutation. Never retry automatically.
              status.textContent = `${error.message} Refresh history and inspect the original folder before retrying.`;
              restore.textContent = "Refresh history before retrying";
            }
          };
          line.append(restore);
        }
        card.append(line);
      }
      list.append(card);
    }
  } catch (error) {
    status.textContent = error.message;
  } finally {
    loading = false;
  }
  const refresh = node("button", "Refresh activity");
  refresh.onclick = load;
  dialog.append(refresh);
}
trigger?.addEventListener("click", () => {
  if (!dialog.open) dialog.showModal();
  load();
});
