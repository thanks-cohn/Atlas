import {indexBookmarks, findBookmarks, editableBookmark, folderTargets, bookmarkTrail, openableBookmark} from './bookmark-model.js';
const $ = id => document.getElementById(id);
let nodes = new Map(), folder = null, epoch = 0, refreshTimer, selected = null;
const active = () => document.body.classList.contains('bookmarks-mode');
const element = (tag, text) => { const el = document.createElement(tag); el.textContent = text; return el; };
function report(code, message) { $('bookmarks-status').textContent = `${code}: ${message}`; }
async function operation(task) {
  try { if (await task() !== false) await refresh(); }
  catch { report('BOOKMARK_OPERATION_FAILED', 'Chrome could not complete that action. Refresh and check whether the bookmark still exists or is managed.'); }
}
function button(label, task) {
  const el = element('button', label); el.type = 'button'; el.onclick = () => operation(task); return el;
}
async function refresh() {
  const request = ++epoch;
  try {
    const roots = await chrome.bookmarks.getTree();
    if (request !== epoch) return;
    nodes = indexBookmarks(roots);
    if (!nodes.has(folder) || nodes.get(folder).url) folder = roots[0]?.id;
    render();
  } catch { report('BOOKMARK_READ_FAILED', 'Bookmark access is unavailable. Reload the updated extension and accept Chrome’s bookmark permission if prompted.'); }
}
function navigate(id) { selected = null; folder = id; $('bookmarks-search').value = ''; render(); }
async function openNode(node) {
  if (!node.url) { navigate(node.id); return; }
  if (!openableBookmark(node.url)) { report('BOOKMARK_URL_BLOCKED', 'This saved URL type cannot be opened here. Use Chrome’s bookmark manager for special or executable URLs.'); return false; }
  await chrome.tabs.create({url: node.url});
}
async function move(node) {
  const targets = folderTargets(nodes, node.id);
  const dialog = document.createElement('dialog');
  dialog.append(element('h2', `Move “${node.title || 'Untitled'}”`));
  const select = document.createElement('select'); select.setAttribute('aria-label', 'Destination bookmark folder');
  for (const target of targets) {
    const option = element('option', bookmarkTrail(nodes, target.id).slice(1).map(n => n.title || 'Untitled').join(' / '));
    option.value = target.id; select.append(option);
  }
  dialog.append(select);
  const cancel = element('button', 'Cancel'); cancel.onclick = () => dialog.close(); dialog.append(cancel);
  const save = element('button', 'Move'); save.disabled = !targets.length;
  save.onclick = async () => { save.disabled = true; await operation(() => chrome.bookmarks.move(node.id, {parentId: select.value})); dialog.close(); };
  dialog.append(save); dialog.addEventListener('close', () => dialog.remove(), {once:true}); document.body.append(dialog); dialog.showModal();
}
const expandedFolders = new Set();
function renderFolders() {
  const tree = $('bookmarks-tree'); tree.replaceChildren();
  const appendFolders = (parentElement, children) => {
    for (const node of children || []) {
      if (node.url) continue;
      const branch = document.createElement('details');
      const summary = document.createElement('summary'); summary.textContent = node.title || 'All bookmarks';
      branch.append(summary);
      branch.append(button('Open folder', async () => navigate(node.id)));
      branch.open = expandedFolders.has(node.id);
      let loaded = false;
      const populate = () => {
        if (branch.open) {
          expandedFolders.add(node.id);
          if (!loaded) { loaded = true; appendFolders(branch, node.children); }
        } else expandedFolders.delete(node.id);
      };
      branch.addEventListener('toggle', populate); populate(); parentElement.append(branch);
    }
  };
  for (const root of nodes.values()) if (root.parentId === undefined) appendFolders(tree, root.children);
}
function render() {
  const parent = nodes.get(folder); if (!parent) return;
  renderFolders();
  const query = $('bookmarks-search').value.trim();
  const list = query ? findBookmarks(nodes, query) : parent.children || [];
  $('bookmarks-list').replaceChildren(); $('bookmarks-breadcrumbs').replaceChildren();
  for (const node of bookmarkTrail(nodes, folder)) {
    $('bookmarks-breadcrumbs').append(button(node.title || 'All bookmarks', async () => navigate(node.id)));
  }
  $('bookmarks-up').disabled = parent.parentId === undefined;
  const canCreate = parent.parentId !== undefined && !parent.unmodifiable && !query;
  $('bookmarks-new').disabled = $('bookmarks-folder').disabled = !canCreate;
  report('BOOKMARKS_READY', `${list.length} ${query ? 'matching item(s)' : 'item(s)'} · Double-click or press Enter to open · Live Chrome bookmarks`);
  for (const node of list) {
    const row = document.createElement('div'); row.className = 'bookmark-row'; row.setAttribute('role', 'listitem');
    const open = element('button', ''); open.className = 'bookmark-open'; open.type = 'button';
    open.setAttribute('aria-pressed', String(selected === node.id));
    const choose = () => {
      selected = node.id;
      for (const sibling of $('bookmarks-list').querySelectorAll('.bookmark-open')) sibling.setAttribute('aria-pressed','false');
      open.setAttribute('aria-pressed','true');
    };
    open.onclick = choose; open.onfocus = choose;
    open.ondblclick = () => operation(() => openNode(node));
    open.onkeydown = event => {
      if (event.key === 'Enter') { event.preventDefault(); operation(() => openNode(node)); }
    };
    open.append(element('strong', `${node.url ? '☆' : '▰'} ${node.title || 'Untitled'}`));
    open.append(element('small', node.url || `${(node.children || []).length} item(s)`));
    row.append(open);
    if (editableBookmark(node, nodes)) {
      const menu = document.createElement('details'); menu.append(element('summary', 'Actions'));
      const actions = document.createElement('div'); actions.className = 'bookmark-actions';
      actions.append(button('Rename', async () => {
        const title = prompt('Bookmark title', node.title); if (title !== null) await chrome.bookmarks.update(node.id, {title});
      }));
      if (node.url) actions.append(button('Edit URL', async () => {
        const url = prompt('Bookmark URL', node.url); if (url === null) return;
        if (!openableBookmark(url)) { report('BOOKMARK_URL_BLOCKED', 'Enter an http, https, ftp or file URL.'); return false; }
        await chrome.bookmarks.update(node.id, {url});
      }));
      actions.append(button('Move…', async () => move(node)));
      actions.append(button('Delete', async () => {
        if (!confirm(`Delete “${node.title || 'Untitled'}”${node.url ? '' : ' and every bookmark inside it'} from Chrome? This also affects synced bookmarks. This cannot be undone in Atlas.`)) return;
        await chrome.bookmarks[node.url ? 'remove' : 'removeTree'](node.id);
      }));
      menu.append(actions); row.append(menu);
    }
    $('bookmarks-list').append(row);
  }
}
async function create(isFolder) {
  const parent = nodes.get(folder); if (!parent || parent.parentId === undefined || parent.unmodifiable) return;
  const title = prompt(isFolder ? 'New folder name' : 'New bookmark title'); if (title === null) return;
  const details = {parentId: folder, title};
  if (!isFolder) {
    const url = prompt('Bookmark URL', 'https://'); if (url === null) return;
    if (!openableBookmark(url)) { report('BOOKMARK_URL_BLOCKED', 'Enter an http, https, ftp or file URL.'); return false; }
    details.url = url;
  }
  await chrome.bookmarks.create(details);
}
$('bookmarks-open').onclick = () => {
  document.body.classList.add('bookmarks-mode'); $('bookmarks-workspace').hidden = false;
  $('bookmarks-open').setAttribute('aria-current','page'); refresh();
};
function leave() {
  document.body.classList.remove('bookmarks-mode'); $('bookmarks-workspace').hidden = true;
  $('bookmarks-open').removeAttribute('aria-current');
}
// Existing file navigation keeps ownership of its own controls and state.
for (const id of ['home','activity','library','add-location']) $(id).addEventListener('click',leave);
$('roots').addEventListener('click', leave);
$('bookmarks-refresh').onclick = refresh;
$('bookmarks-up').onclick = () => { const id = nodes.get(folder)?.parentId; if (id !== undefined) navigate(id); };
$('bookmarks-search').oninput = render;
$('bookmarks-new').onclick = () => operation(() => create(false));
$('bookmarks-folder').onclick = () => operation(() => create(true));
$('bookmarks-list').addEventListener('keydown', event => {
  if (!['ArrowDown','ArrowUp','Home','End'].includes(event.key) || event.target.closest('details')) return;
  const buttons = [...$('bookmarks-list').querySelectorAll('.bookmark-open')];
  const current = buttons.indexOf(document.activeElement);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length-1 : Math.max(0,Math.min(buttons.length-1,current + (event.key === 'ArrowDown' ? 1 : -1)));
  event.preventDefault(); buttons[next]?.focus();
});
if (chrome.bookmarks) {
  for (const name of ['onCreated','onRemoved','onChanged','onMoved','onChildrenReordered','onImportEnded']) {
    chrome.bookmarks[name]?.addListener(() => {
      clearTimeout(refreshTimer); if (active()) refreshTimer = setTimeout(refresh,100);
    });
  }
}
window.addEventListener('focus', () => { if (active()) refresh(); });
