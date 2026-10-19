import {ENTRY_POINT_KEY,chooseEntryPoint} from "./explorer-entry-point.js";
import { previewDefaults, previewStep, previewKind } from "./preview-navigation.js";
import { createGraphUI } from "./graph.js";
let previewSettings = {...previewDefaults};
let previewEntry = null;
let entryPointPreference=null;
let previewSizeSettings = {maximumMiB:30, byExtension:{}};
const $ = (id) => document.getElementById(id);
const state = {
  grants: [],
  grant: null,
  path: "",
  entries: [],
  selected: new Set(),
  anchor: 0,
  history: [],
  index: -1,
  clipboard: null,
  view: "list",
  busy: false,
  paired: false,
  lifecycle: "OFFLINE",
  outcomeUnknown: false,
  nativeManaging: false,
  lastTrash: null,
  dragged: null,
  load: 0,
  previewRequest: 0,
};
const text = (tag, value, cls) => {
  const el = document.createElement(tag);
  el.textContent = value;
  if (cls) el.className = cls;
  return el;
};
const join = (base, name) => [base, name].filter(Boolean).join("/");
const dir = (entry) =>
  entry.kind === "directory" ||
  entry.is_dir === true ||
  entry.type === "directory";
const size = (value) => {
  if (value === null || value === undefined) return "—";
  if (value < 1024) return `${value} B`;
  const n = Math.min(Math.floor(Math.log(value) / Math.log(1024)), 4);
  return `${(value / 1024 ** n).toFixed(n > 1 ? 1 : 0)} ${["B", "KB", "MB", "GB", "TB"][n]}`;
};
const date = (value) =>
  value
    ? new Date(
        typeof value === "number" ? value * 1000 : value,
      ).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
const icon = (entry) =>
  text(
    "span",
    dir(entry) ? "▰" : "▤",
    `file-icon ${dir(entry) ? "folder" : ""}`,
  );
async function send(message) {
  const response = await chrome.runtime.sendMessage(message);
  if (!response || response.ok === false) {
    if (response?.state) setLifecycle(response.state);
    throw Object.assign(
      new Error(
        response?.error?.message ||
          "The extension worker is unavailable. Reload ATLAS.",
      ),
      {
        code: response?.error?.code,
        operationId: response?.error?.operationId,
      },
    );
  }
  return response;
}
const transportFailure = (error) =>
  /unavailable|fetch|timeout|timed out|aborted|network|UNPAIRED/i.test(
    error.message || "",
  );
async function api(path, body) {
  try {
    const value = await send({
      type: "api",
      path,
      ...(body === undefined ? {} : { body }),
    });
    paired(true);
    return value;
  } catch (error) {
    if (transportFailure(error) && !error.code) paired(false);
    throw error;
  }
}
function notice(message, success = false) {
  $("notice").textContent = message;
  $("notice").classList.toggle("success", success);
  $("notice").hidden = false;
}
function fail(error) {
  notice(error.message || String(error));
}
function setLifecycle(value) {
  if (value === "OUTCOME_UNKNOWN") state.outcomeUnknown = true;
  if (value === "READY" && state.outcomeUnknown) value = "OUTCOME_UNKNOWN";
  state.lifecycle = value;
  state.paired = ["READY", "NEEDS_GRANT", "OUTCOME_UNKNOWN"].includes(value);
  const labels = {
    READY: "Ready",
    STARTING: "Starting companion…",
    OFFLINE: "Offline",
    NEEDS_INSTALL: "Install companion",
    NEEDS_PAIRING: "Connect companion",
    NEEDS_GRANT: "Add a location",
    NEEDS_REPAIR: "Companion needs repair",
    OUTCOME_UNKNOWN: "Operation outcome unknown",
  };
  $("connection-state").textContent = "● " + (labels[value] || value);
  $("connection-state").dataset.state = value;
  $("connection-state").classList.toggle("ready", state.paired);
  $("connection-state").title = value;
}
function paired(ready) {
  setLifecycle(
    ready ? (state.grants.length ? "READY" : "NEEDS_GRANT") : "OFFLINE",
  );
}
function chosen() {
  return state.entries.filter((e) => state.selected.has(e.path));
}
function writeAllowed() {
  return state.grant?.operations?.includes("write");
}
function updateStatus() {
  const selected = chosen();
  $("status").textContent = state.grant
    ? `${state.entries.length} items${selected.length ? ` · ${selected.length} selected · ${size(selected.reduce((n, e) => n + (e.size || 0), 0))}` : ""}`
    : `${state.grants.length} authorized locations`;
  $("paste").disabled = !writeAllowed() || !state.clipboard || state.busy;
  $("new-folder").disabled = !writeAllowed() || state.busy;
  $("undo").disabled = !state.lastTrash || state.busy;
  $("clipboard-status").textContent = state.clipboard
    ? `${state.clipboard.sources.length} item(s) ${state.clipboard.action === "move" ? "cut" : "copied"}`
    : "";
  $("up").disabled = !state.path;
  $("back").disabled = state.index <= 0;
  $("forward").disabled = state.index >= state.history.length - 1;
}
function visible() {
  const query = $("search").value.toLocaleLowerCase();
  const items = state.entries.filter((e) =>
    e.name.toLocaleLowerCase().includes(query),
  );
  const sort = $("sort").value;
  return items.sort((a, b) => {
    if (dir(a) !== dir(b)) return dir(a) ? -1 : 1;
    switch (sort) {
      case "size":
        return (b.size || 0) - (a.size || 0);
      case "modified":
        return (b.modified || 0) - (a.modified || 0);
      case "type":
        return extension(a.name).localeCompare(extension(b.name));
      case "name-desc":
        return b.name.localeCompare(a.name, undefined, { numeric: true });
      default:
        return a.name.localeCompare(b.name, undefined, { numeric: true });
    }
  });
}
const extension = (name) =>
  name.includes(".") ? name.split(".").pop().toUpperCase() : "File";
function select(entry, event, index) {
  if (event.shiftKey) {
    if (!event.ctrlKey && !event.metaKey) state.selected.clear();
    const entries = visible();
    const anchor = Math.max(0, Math.min(state.anchor, entries.length - 1));
    for (let i = Math.min(anchor, index); i <= Math.max(anchor, index); i++)
      state.selected.add(entries[i].path);
  } else if (event.ctrlKey || event.metaKey) {
    state.selected.has(entry.path)
      ? state.selected.delete(entry.path)
      : state.selected.add(entry.path);
    state.anchor = index;
  } else {
    state.selected = new Set([entry.path]);
    state.anchor = index;
  }
  renderSelection();
}
function renderSelection() {
  document.querySelectorAll(".file-row").forEach((row) => {
    const selected = state.selected.has(row.dataset.path);
    row.classList.toggle("selected", selected);
    row.setAttribute("aria-selected", String(selected));
  });
  updateStatus();
}
function render() {
  renderBreadcrumbs();
  const files = $("files");
  files.replaceChildren();
  files.className = state.grant
    ? state.view === "grid"
      ? "grid"
      : ""
    : "locations-grid";
  $("home").classList.toggle("active", !state.grant);
  $("title").textContent = state.grant
    ? state.path.split("/").pop() || state.grant.label || state.grant.id
    : "All locations";
  $("eyebrow").textContent = state.grant
    ? "LOCAL FILES · AUTHORIZED"
    : "YOUR WORKSPACE";
  $("subtitle").textContent = state.grant
    ? `${state.grant.label || state.grant.id}${state.path ? " / " + state.path : ""}${writeAllowed() ? "" : " · Read only"}`
    : "A clear view of everything that matters.";
  $("location").value = state.path;
  $("location").disabled = !state.grant;
  $("empty").hidden = true;
  document
    .querySelectorAll("#roots button")
    .forEach((button) =>
      button.classList.toggle(
        "active",
        button.dataset.id === state.grant?.id &&
          button.dataset.path === state.path,
      ),
    );
  if (!state.grant) {
    for (const grant of state.grants) {
      const button = text("button", "", "location-card");
      button.append(
        icon({ kind: "directory" }),
        text("strong", grant.label || grant.id),
        text("small", grant.root || "Authorized local folder"),
        text(
          "small",
          grant.operations?.includes("write")
            ? "Read & write access"
            : "Read-only access",
        ),
      );
      button.onclick = () => navigate(grant, "");
      files.append(button);
    }
    if (!state.grants.length) {
      $("empty").hidden = false;
      $("connect-start").hidden = state.paired;
      $("empty").querySelector("h2").textContent = state.paired
        ? "Add your first location"
        : "Your files. A little more connected.";
      $("empty").querySelector("p").textContent = state.paired
        ? "Choose Add location to select folders in the trusted companion. Return here and refresh locations after approval."
        : "Pair your local companion to browse folders you explicitly authorize.";
    }
    updateStatus();
    return;
  }
  const entries = visible();
  if (!entries.length) {
    const empty = text("div", "", "empty");
    empty.append(
      text("div", "◇", "empty-symbol"),
      text(
        "h2",
        $("search").value
          ? "No matching files"
          : "A little room for something new",
      ),
      text(
        "p",
        $("search").value
          ? "Try a different name. Search filters this folder only."
          : "This folder is empty.",
      ),
    );
    files.append(empty);
  }
  const header = text("div", "", "file-header");
  header.append(
    text("span", "Name"),
    text("span", "Type", "file-type"),
    text("span", "Size", "file-size"),
    text("span", "Modified", "file-modified"),
  );
  files.append(header);
  entries.forEach((entry, index) => {
    const row = text("div", "", "file-row");
    row.dataset.path = entry.path;
    row.tabIndex = 0;
    row.setAttribute("role", "option");
    row.setAttribute("aria-selected", String(state.selected.has(entry.path)));
    row.classList.toggle("selected", state.selected.has(entry.path));
    row.classList.toggle(
      "cut",
      Boolean(
        state.clipboard?.action === "move" &&
          state.clipboard.sources.some(
            (source) =>
              source.grant === state.grant.id && source.path === entry.path,
          ),
      ),
    );
    const name = text("div", "", "file-name");
    name.append(icon(entry), text("span", entry.name, "filename"));
    name.title = entry.name;
    row.append(
      name,
      text(
        "span",
        dir(entry) ? "Folder" : extension(entry.name),
        "file-meta file-type",
      ),
      text("span", dir(entry) ? "—" : size(entry.size), "file-meta file-size"),
      text("span", date(entry.modified), "file-meta file-modified"),
    );
    row.draggable = true;
    row.ondragstart = (event) => {
      if (state.busy) {
        event.preventDefault();
        return;
      }
      if (!state.selected.has(entry.path)) {
        state.selected = new Set([entry.path]);
        renderSelection();
      }
      state.dragged = chosen().map((item) => ({
        grant: state.grant.id,
        path: item.path,
      }));
      event.dataTransfer.effectAllowed = writeAllowed() ? "copyMove" : "copy";
      event.dataTransfer.setData(
        "text/plain",
        `${state.dragged.length} ATLAS item(s)`,
      );
    };
    row.ondragend = () => {
      state.dragged = null;
      document
        .querySelectorAll(".drop-target")
        .forEach((node) => node.classList.remove("drop-target"));
    };
    if (dir(entry)) {
      row.ondragover = (event) => {
        if (!state.dragged || state.busy || !writeAllowed()) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = event.shiftKey ? "move" : "copy";
        row.classList.add("drop-target");
      };
      row.ondragleave = () => row.classList.remove("drop-target");
      row.ondrop = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        row.classList.remove("drop-target");
        if (!state.dragged || state.busy || !writeAllowed()) return;
        const sources = state.dragged;
        state.dragged = null;
        const action = event.shiftKey ? "move" : "copy";
        if (
          confirm(
            `${action === "move" ? "Move" : "Copy"} ${sources.length} selected item(s) into “${entry.name}”? Existing files are never overwritten.`,
          )
        )
          await operate(action, {
            sources,
            destination: { grant: state.grant.id, path: entry.path },
          });
      };
    }
    row.onclick = (event) => select(entry, event, index);
    row.ondblclick = () => open(entry);
    row.oncontextmenu = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!state.selected.has(entry.path))
        state.selected = new Set([entry.path]);
      renderSelection();
      menu(event);
    };
    row.onkeydown = (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        open(entry);
      }
    };
    files.append(row);
  });
  updateStatus();
}
function renderBreadcrumbs() {
  const node = $("breadcrumbs");
  node.replaceChildren();
  if (!state.grant) {
    node.hidden = true;
    return;
  }
  node.hidden = false;
  const button = (label, path) => {
    const item = text("button", label);
    item.onclick = () => navigate(state.grant, path);
    node.append(item);
  };
  button(state.grant.label || state.grant.id, "");
  let path = "";
  for (const segment of state.path.split("/").filter(Boolean)) {
    node.append(text("span", "›"));
    path = join(path, segment);
    button(segment, path);
  }
}
function renderEntryPoint(){
  const roots=$("roots");roots.replaceChildren();
  const entry=chooseEntryPoint(state.grants,entryPointPreference);
  if(entry){
    const button=text("button","","tree-open root-open");
    button.dataset.id=entry.grant.id;button.dataset.path=entry.path;
    button.append(text("span","▰"),text("span",entry.label,"root-label"));
    button.title=[entry.grant.root,entry.path].filter(Boolean).join('/');
    button.onclick=()=>navigate(entry.grant,entry.path);roots.append(button);
  }
  const select=$("entry-point-choice");select.replaceChildren();
  select.append(new Option("Automatic — highest authorized folder", ""));
  for(const grant of state.grants)select.append(new Option(grant.label || grant.root || grant.id,JSON.stringify({grantId:grant.id,path:''})));
  const saved=entryPointPreference;
  if(saved){
    const value=JSON.stringify({grantId:saved.grantId,path:saved.path});
    if(!state.grants.some(grant=>grant.id===saved.grantId && saved.path===''))select.append(new Option(entry?.grant.id===saved.grantId?'Chosen folder: '+entry.label:'Chosen location unavailable — using automatic',value));
    select.value=value;
  }else select.value='';
  $("entry-point-current").disabled=!state.grant;
}
async function saveEntryPoint(preference){
  try{await chrome.storage.local.set({[ENTRY_POINT_KEY]:preference});entryPointPreference=preference;renderEntryPoint();$("entry-point-status").textContent='Saved.';}
  catch(error){$("entry-point-status").textContent=error.message || 'Setting could not be saved.';}
}
$("entry-point-choice").onchange=event=>saveEntryPoint(event.target.value?JSON.parse(event.target.value):null);
$("entry-point-current").onclick=()=>{if(state.grant)return saveEntryPoint({grantId:state.grant.id,path:state.path});};
$("explorer-settings-close").onclick=()=>$("explorer-settings-dialog").close();
$("explorer-connection-settings").onclick=()=>{$("explorer-settings-dialog").close();showPair();};
async function loadGrants() {
  const result = await api("/v1/grants");
  state.grants = result.grants || [];
  paired(true);
  renderEntryPoint();
  if (state.grant) {
    const grant = state.grants.find((g) => g.id === state.grant.id);
    if (!grant) {
      state.grant = null;
      state.path = "";
      state.entries = [];
    } else state.grant = grant;
  }
  render();
}
async function navigate(grant, path = "", record = true) {
  if (state.busy) return;
  const load = ++state.load;
  state.previewRequest++;
  $("details").hidden = true;
  try {
    $("notice").hidden = true;
    $("status").textContent = "Loading folder…";
    if (!grant) {
      state.grant = null;
      state.entries = [];
      state.path = "";
    } else {
      let offset = 0,
        entries = [],
        result;
      do {
        result = await api("/v1/list", {
          grant: grant.id,
          path,
          offset,
          limit: 1000,
        });
        entries.push(...(result.entries || []));
        offset = entries.length;
        if (offset > 20000)
          throw new Error(
            "This directory exceeds the current 20,000-item UI limit. Use a narrower folder.",
          );
      } while (offset < (result.total || 0) && result.entries?.length);
      if (load !== state.load) return;
      state.grant = grant;
      state.path = path;
      state.entries = entries.map((e) => ({
        ...e,
        path: e.path ?? join(path, e.name),
      }));
    }
    state.selected.clear();
    $("search").value = "";
    if (record) {
      state.history = state.history.slice(0, state.index + 1);
      state.history.push({ grant: grant?.id, path });
      state.index = state.history.length - 1;
    }
    render();
  } catch (error) {
    fail(error);
    updateStatus();
  }
}
function copy(action) {
  const entries = chosen();
  if (!entries.length) return;
  state.clipboard = {
    action,
    sources: entries.map((e) => ({ grant: state.grant.id, path: e.path })),
    created: Date.now(),
  };
  chrome.storage.session.set({ clipboard: state.clipboard });
  notice(
    `${entries.length} item(s) ${action === "move" ? "cut" : "copied"}. Navigate to a destination and paste.`,
    true,
  );
  render();
}
async function operate(action, options = {}) {
  if (state.busy) return;
  state.busy = true;
  document.body.classList.add("busy");
  updateStatus();
  try {
    const response = await api("/v1/operate", {
      id: crypto.randomUUID(),
      action,
      ...options,
    });
    const receipt = response.receipt || response;
    const results = receipt.results || [];
    if (action === "trash") state.lastTrash = { id: receipt.id, results };
    await navigateAfterOperation();
    const failures = results.filter((r) => r.ok === false);
    if (failures.length) {
      notice(
        `${action}: ${results.length - failures.length} succeeded, ${failures.length} failed. ${failures.map((r) => r.error?.message || r.error?.code || "Operation refused").join("; ")} No conflicting files were overwritten.`,
      );
      return null;
    }
    notice(
      `${action[0].toUpperCase() + action.slice(1)} complete.${results.length ? ` ${results.length} item(s) processed.` : ""}`,
      true,
    );
    return response;
  } catch (error) {
    if (transportFailure(error))
      notice(
        `${error.message} The outcome may be unknown. Inspect Activity and the filesystem before starting a new operation; ATLAS does not retry mutations automatically.`,
      );
    else fail(error);
    return null;
  } finally {
    state.busy = false;
    document.body.classList.remove("busy");
    updateStatus();
  }
}
async function navigateAfterOperation() {
  const wasBusy = state.busy;
  state.busy = false;
  await navigate(state.grant, state.path, false);
  state.busy = wasBusy;
}
async function paste() {
  if (!state.clipboard || !writeAllowed()) return;
  if (Date.now() - state.clipboard.created > 30 * 60 * 1000) {
    state.clipboard = null;
    chrome.storage.session.remove("clipboard");
    notice("Clipboard expired after 30 minutes. Copy the files again.");
    updateStatus();
    return;
  }
  const clip = state.clipboard;
  const result = await operate(clip.action, {
    sources: clip.sources,
    destination: { grant: state.grant.id, path: state.path },
  });
  if (result && clip.action === "move") {
    state.clipboard = null;
    chrome.storage.session.remove("clipboard");
    render();
  }
}
function ask(title, value = "", description = "", label = "Name") {
  return new Promise((resolve) => {
    const dialog = $("input-dialog");
    $("input-title").textContent = title;
    $("input-description").textContent = description;
    $("input-value").value = value;
    $("input-value").required =
      label !== "Relative folder path" && label !== "Note";
    $("input-label").firstChild.textContent = label;
    let settled = false;
    function finish(value) {
      if (settled) return;
      settled = true;
      dialog.close();
      $("input-form").onsubmit = null;
      $("input-cancel").onclick = null;
      dialog.oncancel = null;
      resolve(value);
    }
    $("input-form").onsubmit = (event) => {
      event.preventDefault();
      finish($("input-value").value);
    };
    $("input-cancel").onclick = () => finish(null);
    dialog.oncancel = () => finish(null);
    dialog.showModal();
    $("input-value").focus();
    $("input-value").select();
  });
}
async function mkdir() {
  if (!writeAllowed()) return;
  const name = await ask(
    "Create a new folder",
    "",
    "A new folder will be created in the current authorized location.",
  );
  if (name)
    await operate("mkdir", {
      destination: { grant: state.grant.id, path: state.path },
      name,
    });
}
async function rename() {
  const entries = chosen();
  if (entries.length !== 1 || !writeAllowed()) return;
  const name = await ask(
    "Rename item",
    entries[0].name,
    "An existing destination will never be overwritten.",
  );
  if (name && name !== entries[0].name)
    await operate("rename", {
      sources: [{ grant: state.grant.id, path: entries[0].path }],
      name,
    });
}
async function trash() {
  const entries = chosen();
  if (!entries.length || !writeAllowed()) return;
  const approved = confirm(
    `Move ${entries.length} selected item(s) to ATLAS recovery storage? They will be removed from this folder. This is companion-managed trash, not your OS recycle bin.`,
  );
  if (approved)
    await operate("trash", {
      sources: entries.map((e) => ({ grant: state.grant.id, path: e.path })),
    });
}
function pickDestination(action) {
  return new Promise((resolve) => {
    const dialog = $("destination-dialog"),
      grants = state.grants.filter((g) => g.operations?.includes("write"));
    if (!grants.length) {
      notice(
        "No writable destinations are authorized. Grant one locally first.",
      );
      resolve(null);
      return;
    }
    $("destination-title").textContent =
      action === "copy" ? "Copy to folder" : "Move to folder";
    const select = $("destination-grant");
    select.replaceChildren();
    for (const grant of grants) {
      const option = text("option", grant.label || grant.id);
      option.value = grant.id;
      select.append(option);
    }
    select.value = grants.some((g) => g.id === state.grant?.id)
      ? state.grant.id
      : grants[0].id;
    $("destination-path").value =
      select.value === state.grant?.id ? state.path : "";
    let settled = false,
      valid = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      dialog.close();
      resolve(value);
    };
    const browse = async () => {
      const grant = select.value,
        path = $("destination-path").value;
      $("destination-error").textContent = "";
      $("destination-confirm").disabled = true;
      valid = false;
      try {
        const response = await api("/v1/list", {
          grant,
          path,
          offset: 0,
          limit: 1000,
        });
        const list = $("destination-folders");
        list.replaceChildren();
        const folders = (response.entries || []).filter(dir);
        for (const entry of folders) {
          const button = text("button", "▰ " + entry.name);
          button.type = "button";
          button.onclick = () => {
            $("destination-path").value = entry.path || join(path, entry.name);
            browse();
          };
          list.append(button);
        }
        if (!folders.length)
          list.append(text("small", "No subfolders — choose this folder."));
        valid = true;
        $("destination-confirm").disabled = false;
      } catch (error) {
        $("destination-error").textContent = error.message;
      }
    };
    select.onchange = () => {
      $("destination-path").value = "";
      browse();
    };
    $("destination-load").onclick = browse;
    $("destination-path").oninput = () => {
      valid = false;
      $("destination-confirm").disabled = true;
    };
    $("destination-up").onclick = () => {
      $("destination-path").value = $("destination-path")
        .value.split("/")
        .slice(0, -1)
        .join("/");
      browse();
    };
    $("destination-cancel").onclick = () => finish(null);
    dialog.oncancel = () => finish(null);
    $("destination-form").onsubmit = (event) => {
      event.preventDefault();
      if (valid)
        finish({ grant: select.value, path: $("destination-path").value });
      else browse();
    };
    dialog.showModal();
    browse();
  });
}
async function destination(action) {
  const entries = chosen();
  if (!entries.length) return;
  const target = await pickDestination(action);
  if (!target) return;
  await operate(action, {
    sources: entries.map((e) => ({ grant: state.grant.id, path: e.path })),
    destination: target,
  });
}
async function duplicate() {
  const entries = chosen();
  if (entries.length !== 1) return;
  const entry = entries[0];
  const name = await ask(
    "Duplicate item",
    `Copy of ${entry.name}`,
    "Choose a new name in this folder.",
  );
  if (name)
    await operate("copy", {
      sources: [{ grant: state.grant.id, path: entry.path }],
      destination: { grant: state.grant.id, path: state.path },
      name,
    });
}
const graphUI = createGraphUI({
  api,
  ask,
  notice,
  chosen,
  getGrant: () => state.grant,
});
function menu(event) {
  const menu = $("context-menu");
  menu.replaceChildren();
  const entries = chosen(),
    single = entries.length === 1;
  const action = (label, fn, enabled = true, shortcut = "", danger = false) => {
    const button = text("button", label, danger ? "danger" : "");
    button.setAttribute("role", "menuitem");
    button.setAttribute("aria-label", label);
    button.disabled = !enabled;
    if (shortcut) button.append(text("kbd", shortcut));
    button.onclick = () => {
      menu.hidden = true;
      Promise.resolve(fn()).catch(fail);
    };
    menu.append(button);
  };
  const divider = () => menu.append(document.createElement("hr"));
  if (entries.length) {
    action(
      single && dir(entries[0]) ? "Open folder" : "Preview / properties",
      () => (single ? open(entries[0]) : properties(entries)),
      single,
    );
    divider();
    action("Copy", () => copy("copy"), true, "Ctrl+C");
    action("Cut", () => copy("move"), writeAllowed(), "Ctrl+X");
    action("Copy to…", () => destination("copy"));
    action("Move to…", () => destination("move"), writeAllowed());
    action("Duplicate…", duplicate, single && writeAllowed());
    action("Rename…", rename, single && writeAllowed(), "F2");
    divider();
    action("Move to ATLAS trash", trash, writeAllowed(), "Delete", true);
    action("Organize · tags & catalogs", graphUI.organize);
    action("Properties", () => properties(entries));
  } else {
    action("New folder…", mkdir, writeAllowed());
    action(
      "Paste",
      paste,
      writeAllowed() && Boolean(state.clipboard),
      "Ctrl+V",
    );
    action(
      "Select all",
      () => {
        state.selected = new Set(visible().map((e) => e.path));
        renderSelection();
      },
      Boolean(state.grant),
      "Ctrl+A",
    );
    action(
      "Refresh",
      () => navigate(state.grant, state.path, false),
      true,
      "F5",
    );
  }
  menu.hidden = false;
  menu.style.left = `${Math.min(event.clientX, window.innerWidth - menu.offsetWidth - 8)}px`;
  menu.style.top = `${Math.max(8, Math.min(event.clientY, window.innerHeight - menu.offsetHeight - 8))}px`;
  menu.querySelector("button:not(:disabled)")?.focus();
}
function properties(entries) {
  previewEntry = null;
  $("preview-navigation").hidden = true;
  state.previewRequest++;
  $("details").hidden = false;
  $("details-title").textContent =
    entries.length === 1 ? entries[0].name : `${entries.length} items`;
  $("preview").replaceChildren(icon(entries[0]));
  const props = $("properties");
  props.replaceChildren();
  const dl = document.createElement("dl");
  const field = (label, value) => {
    dl.append(text("dt", label), text("dd", value));
  };
  field("Name", entries.map((e) => e.name).join(", "));
  field("Size", size(entries.reduce((n, e) => n + (e.size || 0), 0)));
  field("Authorized location", state.grant.label || state.grant.id);
  field("Path", entries.length === 1 ? entries[0].path : state.path);
  field("Access", writeAllowed() ? "Read & write" : "Read only");
  if (entries.length === 1) {
    field("Type", dir(entries[0]) ? "Folder" : extension(entries[0].name));
    field("Modified", date(entries[0].modified));
  }
  props.append(dl);
  if (entries.length === 1 && !dir(entries[0])) {
    const entry = entries[0],
      grant = state.grant.id;
    const button = text("button", "Compute SHA-256");
    button.className = "hash-button";
    const output = text("input");
    output.readOnly = true;
    output.hidden = true;
    output.setAttribute("aria-label", "SHA-256 digest");
    output.className = "hash-output";
    const copyHash = text("button", "Copy hash");
    copyHash.hidden = true;
    const status = text("p", "", "hash-status");
    status.setAttribute("role", "status");
    button.onclick = async () => {
      button.disabled = true;
      status.textContent = "Computing SHA-256 of the authorized file…";
      try {
        const result = await api("/v1/hash", { grant, path: entry.path });
        output.value = result.sha256;
        output.hidden = false;
        copyHash.hidden = false;
        status.textContent = `Verified digest of ${size(result.size)}. Source was checked for modification during hashing.`;
      } catch (error) {
        status.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    };
    copyHash.onclick = async () => {
      try {
        await navigator.clipboard.writeText(output.value);
        status.textContent = "Hash copied.";
      } catch {
        output.focus();
        output.select();
        status.textContent = "Hash selected. Press Ctrl+C to copy.";
      }
    };
    props.append(button, output, copyHash, status);
  }
}
let previewURL = null;
function showPreviewSizeLimit(entry, maximumMiB) {
  const panel = text("div", "", "preview-too-large");
  const ext = entry.name.includes('.') ? entry.name.split('.').pop().toUpperCase() : "FILE";
  panel.append(text("div", ext, "file-type-badge"));
  panel.append(text("p", `This file exceeds the ${maximumMiB} MiB preview limit.`));
  const button = text("button", "Go to Settings to increase the maximum preview size");
  button.onclick = () => {
    $("preview-settings").open = true;
    const key = entry.name.toLowerCase().split('.').pop();
    $("preview-size-extension").value = key;
    const specific = Object.hasOwn(previewSizeSettings.byExtension, key);
    $(specific ? "preview-extension-size" : "preview-max-size").focus();
    $("preview-settings").scrollIntoView({block:"nearest"});
  };
  panel.append(button);
  $("preview").replaceChildren(panel);
}
async function open(entry) {
  if (dir(entry)) {
    await navigate(state.grant, entry.path);
    return;
  }
  properties([entry]);
  if (previewURL) { URL.revokeObjectURL(previewURL); previewURL = null; }
  previewEntry = entry;
  refreshSizeExtensions();
  $("preview-navigation").hidden = false;
  const current = entry.path;
  const request = state.previewRequest;
  const grant = state.grant.id;
  $("preview").replaceChildren(text("p", "Loading preview…"));
  const extensionKey = entry.name.toLowerCase().split(".").pop();
  const activeLimitMiB = previewSizeSettings.byExtension[extensionKey] ?? previewSizeSettings.maximumMiB;
  if (typeof entry.size === "number" && entry.size > Math.floor(activeLimitMiB * 1048576)) {
    showPreviewSizeLimit(entry, activeLimitMiB); return;
  }
  try {
    const ext = entry.name.toLowerCase().split('.').pop();
    const maximumMiB = previewSizeSettings.byExtension[ext] ?? previewSizeSettings.maximumMiB;
    const result = await api("/v1/read", { grant, path: entry.path, max_bytes: Math.floor(maximumMiB * 1048576) });
    if (
      $("details").hidden ||
      request !== state.previewRequest ||
      state.grant?.id !== grant ||
      $("details-title").textContent !== entry.name
    )
      return;
    if (previewURL) {
      URL.revokeObjectURL(previewURL);
      previewURL = null;
    }
    const mime = result.mime || "application/octet-stream";
    const data = Uint8Array.from(atob(result.data), c => c.charCodeAt(0));
    const blobURL = () => {
      previewURL = URL.createObjectURL(new Blob([data], {type:mime}));
      return previewURL;
    };
    if (mime.startsWith("audio/") || mime.startsWith("video/")) {
      const media = document.createElement(mime.startsWith("audio/") ? "audio" : "video");
      media.controls = true;
      media.preload = "metadata";
      media.src = blobURL();
      $("preview").replaceChildren(media);
    } else if (mime === "application/pdf") {
      const frame = document.createElement("iframe");
      frame.title = entry.name;
      frame.src = blobURL();
      $("preview").replaceChildren(frame);
    } else if (mime.startsWith("image/") && !mime.includes("svg")) {
      blobURL();
      const image = document.createElement("img");
      image.src = previewURL;
      image.alt = entry.name;
      $("preview").replaceChildren(image);
    } else if (mime.startsWith("text/") || /json|javascript|xml/.test(mime) || previewKind(entry.name) === "text") {
      const value =
        result.text ??
        new TextDecoder().decode(
          Uint8Array.from(atob(result.data), (c) => c.charCodeAt(0)),
        );
      $("preview").replaceChildren(text("pre", value));
    } else {
      $("preview").replaceChildren(
        text("p", "Safe inline preview is not available for this file type."),
      );
    }
  } catch (error) {
    if (request === state.previewRequest && !$("details").hidden) {
      if (error.code === "PREVIEW_TOO_LARGE") showPreviewSizeLimit(entry, activeLimitMiB);
      else $("preview").replaceChildren(text("p", error.message));
    }
  }
}
$("content").oncontextmenu = (event) => {
  if (!state.grant) return;
  event.preventDefault();
  state.selected.clear();
  renderSelection();
  menu(event);
};
$("content").onclick = (event) => {
  if (event.target === $("content") || event.target === $("files")) {
    state.selected.clear();
    renderSelection();
  }
};
document.addEventListener("pointerdown", (event) => {
  if (!$("context-menu").contains(event.target))
    $("context-menu").hidden = true;
});
$("home").onclick = () => navigate(null);
$("refresh").onclick = () => navigate(state.grant, state.path, false);
$("reload-grants").onclick = () => loadGrants().catch(fail);
$("up").onclick = () =>
  navigate(state.grant, state.path.split("/").slice(0, -1).join("/"));
async function history(delta) {
  const index = state.index + delta;
  if (index < 0 || index >= state.history.length) return;
  state.index = index;
  const item = state.history[index];
  await navigate(
    state.grants.find((g) => g.id === item.grant) || null,
    item.path,
    false,
  );
}
$("back").onclick = () => history(-1);
$("forward").onclick = () => history(1);
$("location-form").onsubmit = (event) => {
  event.preventDefault();
  if (state.grant)
    navigate(state.grant, $("location").value.replace(/^\/+|\/+$/g, ""));
};
$("new-folder").onclick = mkdir;
$("paste").onclick = paste;
$("undo").onclick = async () => {
  if (!state.lastTrash) return;
  const last = state.lastTrash;
  for (const result of last.results.filter((r) => r.ok && r.trash_id)) {
    const original = result.original;
    const response = await operate("restore", {
      sources: [{ grant: original.grant, path: result.trash_id }],
      destination: {
        grant: original.grant,
        path: original.path.split("/").slice(0, -1).join("/"),
      },
    });
    if (!response) return;
  }
  state.lastTrash = null;
  updateStatus();
};
$("search").oninput = () => {
  state.anchor = 0;
  state.selected.clear();
  render();
};
$("sort").onchange = () => {
  state.anchor = 0;
  chrome.storage.local.set({ sort: $("sort").value });
  render();
};
for (const view of ["list", "grid"])
  $(view + "-view").onclick = () => {
    state.view = view;
    $("list-view").classList.toggle("active", view === "list");
    $("grid-view").classList.toggle("active", view === "grid");
    chrome.storage.local.set({ view });
    render();
  };
$("fullpage").onclick = () =>
  chrome.tabs.create({ url: chrome.runtime.getURL("explorer.html") });
$("close-details").onclick = () => {
  previewEntry = null;

  state.previewRequest++;
  $("details").hidden = true;
  if (previewURL) {
    URL.revokeObjectURL(previewURL);
    previewURL = null;
  }
};
function showPair() {
  $("extension-id").value = chrome.runtime.id;
  $("pair-error").textContent = "";
  $("pair-dialog").showModal();
}
$("native-connect").onclick = async () => {
  const button = $("native-connect");
  button.disabled = true;
  try {
    await send({ type: "native-connect" });
    $("pair-dialog").close();
    await loadGrants();
    await navigate(null);
  } catch (error) {
    $("pair-error").textContent =
      error.message +
      " Install and authorize the native host first, or use manual pairing.";
  } finally {
    button.disabled = false;
  }
};
$("connection").onclick = () => {renderEntryPoint();$("entry-point-status").textContent="";$("explorer-settings-dialog").showModal();};
$("connect-start").onclick = showPair;
$("pair-cancel").onclick = () => $("pair-dialog").close();
$("disconnect").onclick = async () => {
  await send({ type: "disconnect" });
  paired(false);
  state.grant = null;
  state.grants = [];
  state.entries = [];
  state.clipboard = null;
  chrome.storage.session.remove("clipboard");
  $("roots").replaceChildren();
  $("pair-dialog").close();
  render();
};
$("pair-form").onsubmit = async (event) => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  try {
    await send({ type: "pair", token: $("token").value.trim() });
    $("token").value = "";
    $("pair-dialog").close();
    await loadGrants();
    await navigate(null);
  } catch (error) {
    $("pair-error").textContent = error.message;
  } finally {
    button.disabled = false;
  }
};
const validPreviewSize = value => typeof value === "number" && Number.isFinite(value) && value >= 0.01 && value <= 128;
function refreshSizeExtensions() {
  const select = $("preview-size-extension");
  const selected = select.value;
  const extensions = new Set(["jpg","jpeg","png","gif","webp","avif","bmp","mp3","wav","ogg","flac","m4a","aac","mp4","webm","mov","m4v","txt","md","json","csv","pdf", ...Object.keys(previewSizeSettings.byExtension)]);
  for (const entry of state.entries) {
    const ext = entry.name.toLowerCase().split('.').pop();
    if (!dir(entry) && entry.name.includes('.') && /^[a-z0-9]{1,12}$/.test(ext)) extensions.add(ext);
  }
  select.replaceChildren();
  for (const ext of [...extensions].sort()) {
    const option = document.createElement("option"); option.value = ext; option.textContent = "." + ext; select.append(option);
  }
  if (extensions.has(selected)) select.value = selected;
  $("preview-extension-size").value = previewSizeSettings.byExtension[select.value] ?? previewSizeSettings.maximumMiB;
}
refreshSizeExtensions();
$("preview-size-extension").onchange = () => {
  $("preview-extension-size").value = previewSizeSettings.byExtension[$("preview-size-extension").value] ?? previewSizeSettings.maximumMiB;
};
async function savePreviewSize(extensionOnly) {
  const input = $(extensionOnly ? "preview-extension-size" : "preview-max-size");
  const value = Number(input.value);
  if (!validPreviewSize(value)) { $("preview-size-status").textContent = "Enter a size from 0.01 to 128 MiB."; return; }
  const next = {maximumMiB:previewSizeSettings.maximumMiB, byExtension:{...previewSizeSettings.byExtension}};
  if (extensionOnly) next.byExtension[$("preview-size-extension").value] = value;
  else next.maximumMiB = value;
  try {
    await chrome.storage.local.set({previewSizeSettings:next});
    previewSizeSettings = next;
    $("preview-size-status").textContent = "Saved. Applies the next time a file is opened.";
  } catch (error) { $("preview-size-status").textContent = error.message; }
}
$("preview-save-max").onclick = () => savePreviewSize(false);
$("preview-save-extension").onclick = () => savePreviewSize(true);
$("preview-reset-extension").onclick = async () => {
  const next = {maximumMiB:previewSizeSettings.maximumMiB, byExtension:{...previewSizeSettings.byExtension}};
  delete next.byExtension[$("preview-size-extension").value];
  try {
    await chrome.storage.local.set({previewSizeSettings:next}); previewSizeSettings = next;
    $("preview-extension-size").value = next.maximumMiB;
    $("preview-size-status").textContent = "Saved. This extension now uses the general maximum.";
  } catch (error) { $("preview-size-status").textContent = error.message; }
};
function stepPreview(delta) {
  if (!previewEntry || $("details").hidden || !state.grant) return;
  const next = previewStep(visible(), previewEntry.path, delta, previewSettings);
  if (next) {
    state.selected = new Set([next.path]);
    renderSelection();
    open(next);
  } else notice("No files match your preview settings in this folder.");
}
$("preview-prev").onclick = () => stepPreview(-1);
$("preview-next").onclick = () => stepPreview(1);
for (const kind of Object.keys(previewDefaults)) {
  $("preview-" + kind).checked = previewSettings[kind];
  $("preview-" + kind).onchange = () => {
    previewSettings[kind] = $("preview-" + kind).checked;
    chrome.storage.local.set({previewSettings});
  };
}
let typeQuery = "",
  typeAt = 0;
document.addEventListener("keydown", (event) => {
  if (document.body.classList.contains("bookmarks-mode")) return;
  if (!$("context-menu").hidden) {
    const key = event.key.toLowerCase(),
      items = [...$("context-menu").querySelectorAll("button:not(:disabled)")];
    if (key === "escape") {
      event.preventDefault();
      $("context-menu").hidden = true;
      $("content").focus();
      return;
    }
    if (["arrowup", "arrowdown", "home", "end"].includes(key)) {
      event.preventDefault();
      const old = items.indexOf(document.activeElement);
      const next =
        key === "home"
          ? 0
          : key === "end"
            ? items.length - 1
            : (old + (key === "arrowdown" ? 1 : -1) + items.length) %
              items.length;
      items[next]?.focus();
      return;
    }
    if (key === "enter" || key === " ") return;
  }
  if (!$("details").hidden && previewEntry && !document.querySelector("dialog[open]") && !event.target.matches("input,textarea,select,audio,video,iframe") && !event.altKey && !event.ctrlKey && !event.metaKey) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault(); stepPreview(event.key === "ArrowLeft" ? -1 : 1); return;
    }
    if (event.key === "Escape") { event.preventDefault(); $("close-details").click(); return; }
  }
  if (
    event.target.matches("input,textarea,select") ||
    document.querySelector("dialog[open]")
  )
    return;
  if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
    event.preventDefault();
    const row = document.querySelector(".file-row.selected"),
      bounds =
        row?.getBoundingClientRect() || $("content").getBoundingClientRect();
    menu({ clientX: bounds.left + 30, clientY: bounds.top + 20 });
    return;
  }
  const mod = event.ctrlKey || event.metaKey;
  const key = event.key.toLowerCase();
  if (mod && ["a", "c", "x", "v"].includes(key)) {
    event.preventDefault();
    if (key === "a") {
      state.selected = new Set(visible().map((e) => e.path));
      renderSelection();
    }
    if (key === "c") copy("copy");
    if (key === "x" && writeAllowed()) copy("move");
    if (key === "v") paste();
  } else if (key === "f2") {
    event.preventDefault();
    rename();
  } else if (key === "delete") {
    event.preventDefault();
    trash();
  } else if (key === "f5") {
    event.preventDefault();
    navigate(state.grant, state.path, false);
  } else if (key === "backspace" && state.path) {
    event.preventDefault();
    $("up").click();
  } else if (event.altKey && key === "arrowleft") {
    event.preventDefault();
    history(-1);
  } else if (event.altKey && key === "arrowright") {
    event.preventDefault();
    history(1);
  } else if (key === "escape") {
    $("context-menu").hidden = true;
    state.selected.clear();
    renderSelection();
  } else if (
    event.key.length === 1 &&
    !mod &&
    !event.altKey &&
    /\S/.test(event.key)
  ) {
    typeQuery = Date.now() - typeAt > 1000 ? event.key : typeQuery + event.key;
    typeAt = Date.now();
    const entries = visible(),
      index = entries.findIndex((entry) =>
        entry.name
          .toLocaleLowerCase()
          .startsWith(typeQuery.toLocaleLowerCase()),
      );
    if (index >= 0) {
      state.selected = new Set([entries[index].path]);
      state.anchor = index;
      renderSelection();
      document.querySelectorAll(".file-row")[index]?.focus();
    }
  } else if (["arrowdown", "arrowup"].includes(key)) {
    const entries = visible();
    if (!entries.length) return;
    event.preventDefault();
    const old = entries.findIndex((e) => state.selected.has(e.path));
    const index = Math.max(
      0,
      Math.min(entries.length - 1, old + (key === "arrowdown" ? 1 : -1)),
    );
    select(entries[index], event, index);
    document.querySelectorAll(".file-row")[index]?.focus();
  }
});
window.dispatchEvent(new Event("atlas:boot-ready"));
(async () => {
  try {
    const preferences = await chrome.storage.local.get(["view", "sort", "previewSettings", "previewSizeSettings", ENTRY_POINT_KEY]);
    entryPointPreference=preferences[ENTRY_POINT_KEY] || null;
    if (preferences.previewSizeSettings) {
      const saved = preferences.previewSizeSettings;
      if (validPreviewSize(saved.maximumMiB)) previewSizeSettings.maximumMiB = saved.maximumMiB;
      for (const [ext, value] of Object.entries(saved.byExtension || {})) {
        if (/^[a-z0-9]{1,12}$/.test(ext) && validPreviewSize(value)) previewSizeSettings.byExtension[ext] = value;
      }
      $("preview-max-size").value = previewSizeSettings.maximumMiB;
      refreshSizeExtensions();
    }
    if (preferences.previewSettings) {
      for (const kind of Object.keys(previewDefaults)) {
        if (typeof preferences.previewSettings[kind] === "boolean") previewSettings[kind] = preferences.previewSettings[kind];
        $("preview-" + kind).checked = previewSettings[kind];
      }
    }
    state.view = preferences.view === "grid" ? "grid" : "list";
    if (preferences.sort) $("sort").value = preferences.sort;
    $("list-view").classList.toggle("active", state.view === "list");
    $("grid-view").classList.toggle("active", state.view === "grid");
    const saved = await chrome.storage.session.get("clipboard");
    if (
      saved.clipboard &&
      Date.now() - saved.clipboard.created < 30 * 60 * 1000
    )
      state.clipboard = saved.clipboard;
    setLifecycle("STARTING");
    const result = await send({ type: "ensure-ready" });
    if (result.state) setLifecycle(result.state);
    if (result.paired) await loadGrants();
    await navigate(null);
  } catch (error) {
    fail(error);
    render();
  } finally {
    window.dispatchEvent(new Event("atlas:boot-ready"));
  }
})();

window.addEventListener("atlas:refresh", () =>
  navigate(state.grant, state.path, false),
);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "session" && changes.unknownOperation)
    state.outcomeUnknown = Boolean(changes.unknownOperation.newValue);
  if (area === "session" && changes.lifecycleState)
    setLifecycle(changes.lifecycleState.newValue || "OFFLINE");
  if (area === "session" && changes.clipboard) {
    state.clipboard = changes.clipboard.newValue || null;
    render();
  }
});

async function manageLocations() {
  try {
    await send({ type: "native-manage" });
    state.nativeManaging = true;
    notice(
      "The trusted native location manager is opening. Approve or revoke locations there, then use Refresh locations here. The browser cannot grant itself access.",
      true,
    );
  } catch (error) {
    fail(error);
  }
}
$("add-location").onclick = manageLocations;
$("manage-locations").onclick = manageLocations;
window.addEventListener("focus", () => {
  if (state.nativeManaging) {
    state.nativeManaging = false;
    loadGrants()
      .then(() => navigate(state.grant, state.path, false))
      .catch(fail);
  }
});
$("connection-state").onclick = async () => {
  if (state.outcomeUnknown) {
    $("unknown-dialog").showModal();
    return;
  }
  setLifecycle("STARTING");
  try {
    const result = await send({ type: "ensure-ready" });
    if (result.state) setLifecycle(result.state);
    if (result.paired) {
      await loadGrants();
      await navigate(state.grant, state.path, false);
    } else showPair();
  } catch (error) {
    fail(error);
  }
};

$("unknown-close").onclick = () => $("unknown-dialog").close();
$("unknown-activity").onclick = () => {
  $("unknown-dialog").close();
  $("activity").click();
};
$("unknown-catalogs").onclick = () => {
  $("unknown-dialog").close();
  graphUI.open();
};
$("unknown-dismiss").onclick = async () => {
  await send({ type: "acknowledge-unknown" });
  state.outcomeUnknown = false;
  setLifecycle(state.grants.length ? "READY" : "NEEDS_GRANT");
  $("unknown-dialog").close();
  notice(
    "Warning dismissed after your inspection. Durable receipts are retained; no operation was retried.",
    true,
  );
};
