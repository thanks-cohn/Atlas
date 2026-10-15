// Trusted extension-only broker. Durable storage contains no native credential.
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
const readRoutes = new Set([
  "/v1/health",
  "/v1/grants",
  "/v1/list",
  "/v1/read",
  "/v1/hash",
  "/v1/receipts",
]);
const fail = (code, message) => Object.assign(new Error(message), { code });
let connecting = null;
chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
// Only a boolean enrollment hint survives browser restart. The native host owns
// durable exact-ID authorization and remains the authority on every reconnect.
chrome.storage.local.setAccessLevel?.({ accessLevel: "TRUSTED_CONTEXTS" });
async function status(state) {
  if (
    state === "READY" &&
    (await chrome.storage.session.get("unknownOperation")).unknownOperation
  )
    state = "OUTCOME_UNKNOWN";
  await chrome.storage.session.set({ lifecycleState: state });
  return state;
}
async function nativeCall(action) {
  let timer;
  try {
    return await Promise.race([
      chrome.runtime.sendNativeMessage("org.atlas.companion", { action }),
      new Promise((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              fail(
                "OFFLINE",
                "Installed companion did not respond within 15 seconds. Retry reconnect after checking its status.",
              ),
            ),
          15000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
async function reconcile(value, path) {
  if (path === "/v1/receipts") {
    const pending = (await chrome.storage.session.get("unknownOperation"))
      .unknownOperation;
    if (
      pending?.operationId &&
      value.receipts?.some(
        (receipt) =>
          receipt.id === pending.operationId && receipt.status !== "pending",
      )
    )
      await chrome.storage.session.remove("unknownOperation");
  }
}
async function enrolled() {
  return (
    (await chrome.storage.local.get("nativeEnrolled")).nativeEnrolled === true
  );
}
function nativeError(error) {
  if (error.code) return error;
  const message = error.message || "Native companion unavailable.";
  if (/not found|not registered|specified native|host.*missing/i.test(message))
    return fail(
      "NEEDS_INSTALL",
      "Install the ATLAS companion once, then connect it here.",
    );
  if (
    /forbidden|not allowed|unauthorized|unenrolled|revoked|pair/i.test(message)
  )
    return fail(
      "NEEDS_PAIRING",
      "This extension identity needs authorization in the installed companion.",
    );
  return fail("NEEDS_REPAIR", message);
}
async function http(path, body, token) {
  let response, value;
  try {
    response = await fetch(API + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Atlas-Extension-Origin": chrome.runtime.getURL("").replace(/\/$/, ""),
        "Content-Type": "application/json",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(
        readRoutes.has(path) ? (path === "/v1/hash" ? 30000 : 8000) : 120000,
      ),
    });
    value = await response.json();
  } catch (error) {
    throw fail(
      "TRANSPORT",
      "Companion unavailable or response interrupted. " +
        (error.name === "TimeoutError"
          ? "The request timed out."
          : "Reconnect to the installed companion."),
    );
  }
  if (!response.ok || value?.ok === false) {
    const error = fail(
      value?.error?.code || `HTTP_${response.status}`,
      value?.error?.message || "Companion rejected the request.",
    );
    error.status = response.status;
    throw error;
  }
  return value;
}
async function authenticate(token) {
  const health = await http("/v1/health", undefined, token);
  if (health.protocol !== "atlas.local.v1" || health.status !== "ready")
    throw fail(
      "NEEDS_REPAIR",
      "The installed companion uses an incompatible protocol or is not ready.",
    );
}
async function connectNative(remember = false) {
  if (connecting) return connecting;
  connecting = (async () => {
    await status("STARTING");
    try {
      const result = await nativeCall("connect");
      if (!result?.ok)
        throw fail(
          result?.code || result?.error?.code || "NEEDS_REPAIR",
          result?.error?.message ||
            (typeof result?.error === "string"
              ? result.error
              : "Native companion refused connection."),
        );
      if (
        result.protocol !== "atlas.local.v1" ||
        result.port !== 17892 ||
        typeof result.token !== "string" ||
        result.token.length < 20 ||
        result.token.length > 200
      )
        throw fail(
          "NEEDS_REPAIR",
          "Installed companion returned an incompatible response.",
        );
      await authenticate(result.token);
      await chrome.storage.session.set({ token: result.token });
      if (remember) await chrome.storage.local.set({ nativeEnrolled: true });
      await status("READY");
      return { ok: true };
    } catch (error) {
      const mapped = nativeError(error);
      await status(mapped.code === "TRANSPORT" ? "OFFLINE" : mapped.code);
      throw mapped;
    }
  })();
  try {
    return await connecting;
  } finally {
    connecting = null;
  }
}
async function ensureReady() {
  const nativeEnrolled = await enrolled();
  const { token } = await chrome.storage.session.get("token");
  if (token) {
    try {
      await authenticate(token);
      const state = await status("READY");
      return { ok: true, state, paired: true, nativeEnrolled };
    } catch (error) {
      if (!nativeEnrolled) {
        await status(error.status === 401 ? "NEEDS_PAIRING" : "OFFLINE");
        throw error;
      }
    }
  }
  if (nativeEnrolled) {
    await connectNative();
    return {
      ok: true,
      state:
        (await chrome.storage.session.get("lifecycleState")).lifecycleState ||
        "READY",
      paired: true,
      nativeEnrolled: true,
    };
  }
  await status("NEEDS_PAIRING");
  return {
    ok: true,
    state: "NEEDS_PAIRING",
    paired: false,
    nativeEnrolled: false,
  };
}
async function api(message) {
  const readOnly =
    readRoutes.has(message.path) ||
    (message.path === "/v1/catalog" && message.body === undefined);
  // Recover readiness before submitting a mutation. This is a health read,
  // never a retry of the mutation; failure here proves no mutation was sent.
  if (!readOnly) {
    const ready = await ensureReady();
    if (!ready.paired)
      throw fail(
        "NEEDS_PAIRING",
        "Connect your installed companion before changing files.",
      );
  }
  let { token } = await chrome.storage.session.get("token");
  if (!token) {
    if (await enrolled()) {
      await connectNative();
      ({ token } = await chrome.storage.session.get("token"));
    } else
      throw fail(
        "NEEDS_PAIRING",
        "Connect your installed companion once, or pair manually.",
      );
  }
  try {
    const value = await http(message.path, message.body, token);
    await reconcile(value, message.path);
    await status("READY");
    return value;
  } catch (error) {
    const recoverable = error.code === "TRANSPORT" || error.status === 401;
    // A successful filesystem/graph mutation may have lost its response. Never
    // repeat either endpoint automatically, even using the same operation ID.
    if (!readOnly && error.code === "TRANSPORT") {
      await chrome.storage.session.set({
        unknownOperation: {
          operationId: message.body?.id || null,
          kind: message.path,
        },
      });
      await status("OUTCOME_UNKNOWN");
      throw Object.assign(
        fail(
          "OUTCOME_UNKNOWN",
          "Operation outcome is unknown. Inspect Activity and the filesystem before taking further action. ATLAS did not retry the mutation.",
        ),
        { operationId: message.body?.id },
      );
    }
    if (readOnly && recoverable && (await enrolled())) {
      await connectNative();
      const current = await chrome.storage.session.get("token");
      try {
        const value = await http(message.path, message.body, current.token);
        await status("READY");
        return value;
      } catch (second) {
        await status(second.status === 401 ? "NEEDS_PAIRING" : "OFFLINE");
        throw second;
      }
    }
    if (error.code === "OUTCOME_UNKNOWN") {
      await chrome.storage.session.set({
        unknownOperation: {
          operationId: message.body?.id || null,
          kind: message.path,
        },
      });
      await status("OUTCOME_UNKNOWN");
    } else if (recoverable)
      await status(error.status === 401 ? "NEEDS_PAIRING" : "OFFLINE");
    throw error;
  }
}
chrome.action.onClicked.addListener((tab) =>
  chrome.sidePanel
    .open({ tabId: tab.id })
    .catch(() =>
      chrome.tabs.create({ url: chrome.runtime.getURL("explorer.html") }),
    ),
);
chrome.runtime.onStartup?.addListener(() =>
  enrolled()
    .then((yes) => yes && ensureReady())
    .catch(() => {}),
);
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (
    sender.id !== chrome.runtime.id ||
    !sender.url?.startsWith(chrome.runtime.getURL(""))
  )
    return;
  (async () => {
    if (message.type === "native-connect") return connectNative(true);
    if (message.type === "ensure-ready") return ensureReady();
    if (message.type === "native-manage") {
      try {
        const result = await nativeCall("manage");
        if (!result?.ok)
          throw fail(
            result?.code || result?.error?.code || "NEEDS_REPAIR",
            result?.error?.message || "Native location manager could not open.",
          );
        return { ok: true };
      } catch (error) {
        throw nativeError(error);
      }
    }
    if (message.type === "pair") {
      if (
        typeof message.token !== "string" ||
        message.token.length < 20 ||
        message.token.length > 1024
      )
        throw fail("NEEDS_PAIRING", "Enter the complete companion token.");
      await authenticate(message.token);
      await chrome.storage.session.set({ token: message.token });
      // Manual mode never becomes an enrollment hint for automatic native wake.
      await chrome.storage.local.remove("nativeEnrolled");
      await status("READY");
      return { ok: true };
    }
    if (message.type === "disconnect") {
      await chrome.storage.session.remove("token");
      await chrome.storage.session.remove("unknownOperation");
      await chrome.storage.local.remove("nativeEnrolled");
      await status("NEEDS_PAIRING");
      return { ok: true };
    }
    if (message.type === "acknowledge-unknown") {
      await chrome.storage.session.remove("unknownOperation");
      await status("READY");
      return { ok: true };
    }
    if (message.type === "state")
      return {
        ok: true,
        paired: Boolean((await chrome.storage.session.get("token")).token),
      };
    if (message.type === "lifecycle")
      return {
        ok: true,
        state:
          (await chrome.storage.session.get("lifecycleState")).lifecycleState ||
          "OFFLINE",
        nativeEnrolled: await enrolled(),
        unknownOperation:
          (await chrome.storage.session.get("unknownOperation"))
            .unknownOperation || null,
      };
    if (message.type !== "api" || !routes.has(message.path))
      throw fail("UNSUPPORTED", "Unsupported companion request.");
    return api(message);
  })().then(respond, async (error) =>
    respond({
      ok: false,
      error: {
        code: error.code || "NEEDS_REPAIR",
        message: error.message,
        ...(error.operationId ? { operationId: error.operationId } : {}),
      },
      state:
        (await chrome.storage.session.get("lifecycleState")).lifecycleState ||
        "OFFLINE",
    }),
  );
  return true;
});
