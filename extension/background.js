// The privileged transport lives only in this extension's service worker.
// No content scripts, externally_connectable surface, arbitrary URL or shell bridge.
const API = "http://127.0.0.1:17892";
const routes = new Set([
  "/v1/health",
  "/v1/grants",
  "/v1/list",
  "/v1/read",
  "/v1/hash",
  "/v1/operate",
  "/v1/catalog",
  "/v1/receipts",
]);
chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel
    .open({ tabId: tab.id })
    .catch(() =>
      chrome.tabs.create({ url: chrome.runtime.getURL("explorer.html") }),
    );
});
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (
    sender.id !== chrome.runtime.id ||
    !sender.url?.startsWith(chrome.runtime.getURL(""))
  )
    return;
  (async () => {
    if (message.type === "native-connect") {
      const result = await chrome.runtime.sendNativeMessage(
        "org.atlas.companion",
        { action: "connect" },
      );
      if (
        !result?.ok ||
        result.protocol !== "atlas.local.v1" ||
        result.port !== 17892 ||
        typeof result.token !== "string"
      )
        throw new Error(
          "Installed companion returned an incompatible response. Use manual pairing or update it.",
        );
      const response = await fetch(API + "/v1/health", {
        headers: { Authorization: `Bearer ${result.token}` },
        signal: AbortSignal.timeout(8000),
      });
      const health = await response.json();
      if (!response.ok || health.ok === false)
        throw new Error(
          health.error?.message || "Companion could not authenticate.",
        );
      await chrome.storage.session.set({ token: result.token });
      return { ok: true };
    }
    if (message.type === "pair") {
      if (
        typeof message.token !== "string" ||
        message.token.length < 20 ||
        message.token.length > 1024
      )
        throw new Error("Enter the complete companion token.");
      const response = await fetch(API + "/v1/health", {
        headers: { Authorization: `Bearer ${message.token}` },
        signal: AbortSignal.timeout(8000),
      });
      const value = await response.json();
      if (!response.ok || value.ok === false)
        throw new Error(
          value.error?.message ||
            "Pairing refused. Check the token and extension ID.",
        );
      await chrome.storage.session.set({ token: message.token });
      return { ok: true };
    }
    if (message.type === "disconnect") {
      await chrome.storage.session.remove("token");
      return { ok: true };
    }
    if (message.type === "state")
      return {
        ok: true,
        paired: Boolean((await chrome.storage.session.get("token")).token),
      };
    if (message.type !== "api" || !routes.has(message.path))
      throw new Error("Unsupported companion request.");
    const { token } = await chrome.storage.session.get("token");
    if (!token) throw new Error("Pair with your companion first.");
    const response = await fetch(API + message.path, {
      method: message.body === undefined ? "GET" : "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      ...(message.body === undefined
        ? {}
        : { body: JSON.stringify(message.body) }),
      signal: AbortSignal.timeout(120000),
    });
    const value = await response.json();
    if (!response.ok || value.ok === false)
      throw new Error(
        `${value.error?.code || response.status}: ${value.error?.message || "Companion rejected the request."}`,
      );
    return value;
  })().then(respond, (error) =>
    respond({
      ok: false,
      error: {
        message:
          error.message === "Failed to fetch"
            ? "Companion unavailable. Start it locally, then reconnect. Check its allowed extension ID."
            : error.message,
      },
    }),
  );
  return true;
});
