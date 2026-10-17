import {createPinboard,linkedPinboards,removePinboard} from './pinboard-model.js';
import {DEMO_COLLECTION} from './gallery-demo.js';
import {indexBookmarks, findBookmarks, editableBookmark, folderTargets, bookmarkTrail, openableBookmark} from './bookmark-model.js';
import {COVER_BUDGET_KEY,coverBudgetMiB,coverStorageBytes,COVER_KEY, bookmarkCover, setBookmarkCover, bookmarkAssociations} from './bookmark-covers.js';
import {PAGE_PREFIX, ITEM_PREFIX, PAGE_TEMPLATES, linkedPages, createLinkedPage, deletePage, withPageLock} from './pages-store.js';
import {library, readLibraryPage, saveLibraryPage} from './library-client.js';
const $ = id => document.getElementById(id);
let nodes = new Map(), folder = null, epoch = 0, refreshTimer, selected = null;
let covers = {}, focused = null, trail = [];
let associated = null, associationEpoch = 0;
let localPages = [], itemsEpoch = 0;
const active = () => document.body.classList.contains('bookmarks-mode');
const element = (tag, text) => { const el = document.createElement(tag); el.textContent = text; return el; };
let lastReportCode='';
function report(code, message) {
  // Technical status stays out of the shelf; export only secret-free event codes.
  $('bookmarks-status').textContent = `${code}: ${message}`;
  if(code!==lastReportCode){lastReportCode=code;chrome.runtime.sendMessage({type:'debug-bookmark-status',code}).catch(()=>{});}
}
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
    const stored = await chrome.storage.local.get(COVER_KEY);
    if (request !== epoch) return;
    covers = stored[COVER_KEY] && typeof stored[COVER_KEY] === 'object' && !Array.isArray(stored[COVER_KEY]) ? stored[COVER_KEY] : {};
    const priorURL = nodes.get(focused)?.url;
    nodes = indexBookmarks(roots);
    if (nodes.get(focused)?.url !== priorURL) { associated = null; associationEpoch++; }
    if (!nodes.has(focused)) { focused = null; trail = []; }
    if (!nodes.has(folder) || nodes.get(folder).url) folder = roots[0]?.id;
    render();
    if (focused) loadLocalItems(nodes.get(focused));
  } catch { report('BOOKMARK_READ_FAILED', 'Bookmark access is unavailable. Reload the updated extension and accept Chrome’s bookmark permission if prompted.'); }
}
function navigate(id) { selected = null; focused = null; associated = null; localPages = []; itemsEpoch++; associationEpoch++; trail = []; folder = id; $('bookmarks-search').value = ''; render(); }
async function openNode(node) {
  if (!node.url) { navigate(node.id); return; }
  if (!openableBookmark(node.url)) { report('BOOKMARK_URL_BLOCKED', 'This saved URL type cannot be opened here. Use Chrome’s bookmark manager for special or executable URLs.'); return false; }
  const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
  if (tab?.id === undefined) { report('BOOKMARK_TAB_UNAVAILABLE', 'Select a browser tab and try again.'); return false; }
  await chrome.tabs.update(tab.id, {url: node.url});
}
function focusNode(node) {
  trail.push({focused, associated, localPages, selected: node.id, scroll: $('bookmarks-workspace').scrollTop});
  focused = node.id; associated = null; localPages = []; selected = node.id; render(); $('bookmarks-workspace').scrollTop = 0;
  loadAssociations(node);
  loadLocalItems(node);
}
async function loadLocalItems(node) {
  const request = ++itemsEpoch;
  try {
    let pages = await linkedPages(chrome.storage.local, node);
    try {
      const state = await chrome.runtime.sendMessage({type:'state'});
      if (state?.paired) {
        const saved = await library('list-pages',{bookmarkId:node.id,bookmarkUrl:node.url || ''});
        for (const item of saved.pages) {
          const oldPage = pages.find(page => page.id === item.id);
          if (oldPage && oldPage.libraryRevision >= item.libraryRevision) continue;
          const page = await readLibraryPage(item.id);
          await chrome.storage.local.set({[PAGE_PREFIX+page.id]:page});
          pages = pages.filter(existing => existing.id !== page.id);
          if (!page.deleted) pages.push(page);
        }
        const old = (await chrome.storage.local.get(ITEM_PREFIX+node.id))[ITEM_PREFIX+node.id];
        if (pages.some(page=>page.libraryRevision) && (old?.bookmarkUrl !== (node.url || '') || JSON.stringify(old?.pageIds) !== JSON.stringify(pages.map(page=>page.id)))) await chrome.storage.local.set({[ITEM_PREFIX+node.id]:{version:1,bookmarkUrl:node.url || '',pageIds:pages.map(page=>page.id)}});
      }
    } catch { /* Offline/older companion: retain every browser copy. */ }
    for (let i=0;i<pages.length;i++) if (!pages[i].sourceBookmark) { pages[i]={...pages[i],sourceBookmark:{id:node.id,url:node.url || ''}}; await chrome.storage.local.set({[PAGE_PREFIX+pages[i].id]:pages[i]}); }
    const boards=await linkedPinboards(chrome.storage.local,node);
    if (request !== itemsEpoch || focused !== node.id) return;
    localPages = [...pages,...boards.map(board=>({...board,kind:'pinboard'}))]; render();
  } catch { if (request === itemsEpoch) report('ASSOCIATED_ITEMS_READ_FAILED', 'Saved pages could not be read. Existing data has not been changed.'); }
}
function addItem(node) {
  const dialog = document.createElement('dialog'), form = document.createElement('form');
  form.append(element('h2', 'Add Item'));
  const kind = document.createElement('select'); kind.setAttribute('aria-label', 'Item type');
  const pageOption = element('option', 'Gallery'); pageOption.value = 'page'; kind.append(pageOption); const pinOption=element('option','Pinboard');pinOption.value='pinboard';kind.append(pinOption);
  const titleLabel = element('label', 'Title'), title = document.createElement('input'); title.required = true; title.maxLength = 200; titleLabel.append(title);
  const templateLabel = element('label', 'Template'), template = document.createElement('select');
  for (const choice of PAGE_TEMPLATES) { const option = element('option', choice.label); option.value = choice.id; option.disabled = !choice.available; template.append(option); }
  template.value = 'gallery'; templateLabel.append(template);
  const styleLabel = element('label', 'Gallery style'), style = document.createElement('select');
  for (const [value, label] of [['nocturne','Nocturne — the screening room'],['solstice','Solstice — the contact sheet']]) { const option = element('option',label); option.value=value; style.append(option); }
  style.value='nocturne'; styleLabel.append(style);
  const sourceLabel=element('label','Bookmark collection'), source=document.createElement('select');
  const blank=element('option','Create Blank');blank.value='blank';source.append(blank);const all=element('option','All Bookmarks');all.value='all';source.append(all);
  for(const target of folderTargets(nodes)){const option=element('option',bookmarkTrail(nodes,target.id).slice(1).map(n=>n.title || 'Untitled').join(' / '));option.value=target.id;source.append(option);}
  source.value='all';sourceLabel.append(source);sourceLabel.hidden=true;
  const message = element('p', ''), save = element('button', 'Create Gallery'); save.type = 'submit';
  const cancel = element('button', 'Cancel'); cancel.type = 'button'; cancel.onclick = () => dialog.close();
  const hint=element('p','Starts with 24 sample stories. Edit or replace them with your own.');
  form.append(kind, titleLabel, templateLabel, styleLabel, sourceLabel, hint, message, save, cancel); dialog.append(form);
  kind.onchange=()=>{const pin=kind.value==='pinboard';styleLabel.hidden=pin;templateLabel.hidden=false;template.replaceChildren();for(const choice of (pin?[{id:'2010s',label:'2010s',available:true}]:PAGE_TEMPLATES)){const option=element('option',choice.label);option.value=choice.id;option.disabled=!choice.available;template.append(option);}template.value=pin?'2010s':'gallery';sourceLabel.hidden=!pin;hint.textContent=pin?'Choose a blank board or a bookmark collection.':'Starts with 24 sample stories. Edit or replace them with your own.';save.textContent=pin?'Create Pinboard':'Create Gallery';};
  form.onsubmit = async event => {
    event.preventDefault(); save.disabled = true;
    try {
      if (!nodes.has(node.id) || nodes.get(node.id).url !== node.url) throw new Error('BOOKMARK_CHANGED');
      if(kind.value==='pinboard') await withPageLock(()=>createPinboard(chrome.storage.local,node,title.value,crypto.randomUUID(),source.value));
      else await withPageLock(() => createLinkedPage(chrome.storage.local, node, {title: title.value, template: template.value, galleryStyle: style.value, text: DEMO_COLLECTION.text, images: DEMO_COLLECTION.images.map((image,index)=>({...image,id:'sample-'+index}))}, crypto.randomUUID()));
      await loadLocalItems(node); dialog.close();
    } catch { message.textContent = `${kind.value==='pinboard'?'PINBOARD_CREATE_FAILED':'PAGE_CREATE_FAILED'}: Enter a title and check available local storage. Your existing items are unchanged.`; }
    finally { save.disabled = false; }
  };
  dialog.addEventListener('close', () => dialog.remove(), {once: true}); document.body.append(dialog); dialog.showModal(); title.focus();
}
async function loadAssociations(node) {
  const request = ++associationEpoch;
  if (!node.url) return;
  try {
    const state = await chrome.runtime.sendMessage({type: 'state'});
    if (!state?.paired || request !== associationEpoch) return;
    const snapshot = await chrome.runtime.sendMessage({type: 'api', path: '/v1/catalog'});
    if (request !== associationEpoch || focused !== node.id || snapshot?.ok === false || !snapshot?.data) return;
    associated = bookmarkAssociations(node, snapshot.data); render();
  } catch { /* Native bookmarks and saved covers remain usable while the companion is offline. */ }
}
function returnFromPreview() {
  associationEpoch++;
  const state = trail.pop(); focused = state?.focused ?? null; selected = state?.selected ?? null;
  associated = state?.associated ?? null;
  localPages = state?.localPages ?? []; itemsEpoch++;
  if (!nodes.has(focused)) focused = null;
  render(); $('bookmarks-workspace').scrollTop = state?.scroll || 0;
  [...$('bookmarks-list').querySelectorAll('.bookmark-disclosure')].find(el => el.dataset.bookmarkId === selected)?.focus();
}
async function saveCover(node, image) {
  // Merge the current stored map, rather than overwrite a stale copy from another shelf.
  await withPageLock(async()=>{
    const stored = await chrome.storage.local.get(COVER_KEY);
    covers = setBookmarkCover(stored[COVER_KEY] || {}, node, image,(await chrome.storage.local.get(COVER_BUDGET_KEY))[COVER_BUDGET_KEY]);
    await chrome.storage.local.set({[COVER_KEY]: covers});
  });
  render();
}
function chooseCover(node) {
  const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/png,image/jpeg,image/webp,image/gif';
  input.onchange = async () => {
    let bitmap;
    try {
      const file = input.files?.[0]; if (!file) return;
      if (file.size > 10 * 1024 * 1024 || !['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)) throw new Error('BOOKMARK_IMAGE_TYPE_OR_SIZE');
      bitmap = await createImageBitmap(file);
      if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 40000000) throw new Error('BOOKMARK_IMAGE_DIMENSIONS');
      const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      await saveCover(node, canvas.toDataURL('image/webp', 0.82));
    } catch (error) { report('BOOKMARK_IMAGE_SAVE_FAILED', 'Use a smaller PNG, JPEG, WebP or GIF (up to 10 MB). Image storage may be full. Existing covers are unchanged.'); }
    finally { bitmap?.close(); input.remove(); }
  };
  input.click();
}
async function catalogRequest(body){
  const response=await chrome.runtime.sendMessage({type:'api',path:'/v1/catalog',...(body===undefined?{}:{body})});
  if(response?.ok===false || !response?.data || !Number.isSafeInteger(response.revision))throw new Error(response?.error?.code || 'BOOKMARK_METADATA_UNAVAILABLE');
  return response;
}
function addMetadata(node,kind){
  const dialog=document.createElement('dialog');dialog.className='bookmark-metadata-dialog';
  const form=document.createElement('form'),isTag=kind==='tag';
  let confirmed=0;
  const oldNote=associated?.matches.find(resource=>resource.note)?.note || '';
  form.append(element('p','BOOKMARK DETAILS'),element('h2',isTag?'Add Tags':oldNote?'Edit Note':'Add Note'));
  const label=element('label',isTag?'Tags, separated by commas':'Note'),input=document.createElement(isTag?'input':'textarea');
  input.required=isTag;input.maxLength=isTag?8000:100000;if(!isTag){input.rows=7;input.value=oldNote;}else input.placeholder='Design, Travel, Architecture';label.append(input);
  const message=element('p','Saved in your Atlas companion, linked to this bookmark URL.');message.setAttribute('role','status');
  const actions=element('div','');actions.className='metadata-actions';const cancel=element('button','Cancel');cancel.type='button';cancel.onclick=()=>dialog.close();const save=element('button',isTag?'Add Tags':'Save Note');save.type='submit';actions.append(cancel,save);form.append(label);
  const existing=document.createElement('select'),existingLabel=element('label','Or choose an existing tag'),savedTags=element('div','');savedTags.className='bookmark-tag-pills';
  let displayedRevision=-1;
  function populateTags(data,revision){
    if(revision<displayedRevision)return;displayedRevision=revision;
    const known=[...new Set(Object.values(data?.tags || {}).flat().filter(tag=>typeof tag==='string' && tag.trim()))].sort((a,b)=>a.localeCompare(b));
    existing.replaceChildren();const placeholder=element('option',known.length?'Choose an existing tag…':'No saved tags yet');placeholder.value='';existing.append(placeholder);
    for(const tag of known){const option=element('option',tag);option.value=tag;existing.append(option);}existing.value='';
    const attached=Object.values(data?.resources || {}).filter(resource=>resource.kind==='bookmark' && resource.locators?.some(locator=>locator.provider==='web' && locator.reference===node.url)).flatMap(resource=>data.tags?.[resource.id] || []);
    savedTags.replaceChildren(...[...new Set(attached)].map(tag=>{const pill=element('span',tag);pill.className='bookmark-tag-pill';return pill;}));
  }
  if(isTag){existing.setAttribute('aria-label','Existing Atlas tags');existingLabel.append(existing);form.append(existingLabel,savedTags);existing.onchange=()=>{if(!existing.value)return;const values=input.value.split(',').map(value=>value.trim()).filter(Boolean);if(!values.includes(existing.value))values.push(existing.value);input.value=values.join(', ');existing.value='';input.focus();};const waiting=element('option','Loading existing tags…');waiting.value='';existing.append(waiting);catalogRequest().then(snapshot=>populateTags(snapshot.data,snapshot.revision)).catch(()=>{if(displayedRevision<0){const unavailable=element('option','Connect companion to load tags');unavailable.value='';existing.replaceChildren(unavailable);}});}
  form.append(message,actions);dialog.append(form);
  const close=element('button','×');close.type='button';close.className='metadata-close';close.setAttribute('aria-label','Close bookmark details');close.onclick=()=>dialog.close();dialog.append(close);
  form.onsubmit=async event=>{
    event.preventDefault();const value=isTag?[...new Set(input.value.split(',').map(tag=>tag.trim()).filter(Boolean))]:input.value;if(isTag && (!value.length || value.length>100 || value.some(tag=>tag.length>80))){message.textContent='Enter up to 100 comma-separated tags, each no longer than 80 characters.';return;}confirmed=0;
    save.disabled=true;
    try{
      await withPageLock(async()=>{
        const state=await chrome.runtime.sendMessage({type:'state'});if(!state?.paired)throw Error('COMPANION_OFFLINE');
        const [current]=await chrome.bookmarks.get(node.id);if(current?.url!==node.url)throw Error('BOOKMARK_CHANGED');
        let snapshot=await catalogRequest();const matches=Object.values(snapshot.data.resources || {}).filter(resource=>resource.kind==='bookmark' && resource.locators?.some(locator=>locator.provider==='web' && locator.reference===node.url));let resource=(!isTag && matches.find(resource=>resource.note===oldNote)) || matches[0];
        if(!resource){snapshot=await catalogRequest({action:'add_resource',args:{kind:'bookmark',title:node.title || node.url,locators:[{provider:'web',reference:node.url}],note:isTag?'':value},expected_revision:snapshot.revision});resource=snapshot.data.resources[snapshot.result];if(!resource)throw Error('BOOKMARK_METADATA_CREATE_UNKNOWN');if(!isTag)return;}
        if(!isTag && resource.note!==oldNote)throw Error('BOOKMARK_NOTE_CONFLICT');
        if(isTag){for(const tag of value){if(!(snapshot.data.tags?.[resource.id] || []).includes(tag))snapshot=await catalogRequest({action:'tag',args:{resource:resource.id,tag},expected_revision:snapshot.revision});confirmed++;}populateTags(snapshot.data,snapshot.revision);}
        else await catalogRequest({action:'update_resource',args:{resource:resource.id,note:value},expected_revision:snapshot.revision});
      });
      if(focused===node.id && nodes.get(node.id)?.url===node.url)await loadAssociations(node);
      if(isTag){input.value='';message.textContent=value.length+' tag'+(value.length===1?'':'s')+' saved. Add more, or close with ×. Refresh your pinboard to see changes.';input.focus();}else dialog.close();$('bookmarks-status').textContent='';
    }catch(error){message.textContent=(error.message || 'BOOKMARK_METADATA_SAVE_FAILED')+(isTag?' ('+confirmed+' of '+value.length+' confirmed)':'')+': Could not confirm the save. Your input remains here. Connect the companion, or reopen this editor if the bookmark or note changed.';}
    finally{save.disabled=false;}
  };
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();input.focus();
}
function metadataSection(node){
  const section=element('section','');section.className='bookmark-add-section';section.append(element('h3','Add'));
  const actions=element('div','');actions.className='bookmark-add-actions';
  for(const [label,kind] of [['Tag','tag'],[associated?.matches.some(resource=>resource.note)?'Edit Note':'Note','note']]){const control=element('button',label);control.type='button';control.onclick=()=>addMetadata(node,kind);actions.append(control);}section.append(actions);
  if(associated?.tags.length){const tags=element('div','');tags.className='bookmark-tag-pills';for(const tag of associated.tags){const pill=element('span',tag);pill.className='bookmark-tag-pill';tags.append(pill);}section.append(tags);}
  for(const resource of associated?.matches || [])if(resource.note){const note=element('p',resource.note);note.className='bookmark-saved-note';section.append(note);}
  return section;
}
function renderPreview() {
  const host = $('bookmarks-preview'); host.replaceChildren();
  const node = nodes.get(focused); host.hidden = !node;
  if (!node) return;
  const back = element('button', '←'); back.type = 'button'; back.className = 'bookmark-disclosure';
  back.setAttribute('aria-label', 'Return to previous bookmark view'); back.setAttribute('aria-expanded', 'true'); back.onclick = returnFromPreview;
  const heading = element('h2', node.title || 'Untitled');
  host.append(back, heading);
  const source = bookmarkCover(node, covers) || associated?.image;
  if (source) {
    const image = document.createElement('img'); image.alt = node.title || 'Bookmark image'; image.referrerPolicy = 'no-referrer'; image.decoding = 'async';
    image.onerror = () => { image.remove(); host.append(element('p', 'This image is unavailable. Choose another image below.')); };
    image.src = source; host.append(image);
  } else host.append(element('p', 'No representative image yet. Choose one to show it here.'));
  const actions = element('div', ''); actions.className = 'bookmark-image-actions';
  const choose = element('button', 'Choose image'); choose.type = 'button'; choose.onclick = () => chooseCover(node); actions.append(choose);
  if (Object.hasOwn(covers, node.id)) actions.append(button('Remove chosen image', () => saveCover(node, null)));
  host.append(actions);
  if(node.url)host.append(metadataSection(node));
  host.append(element('h3', 'Associated Items'));
  const add = element('button', 'Add Item'); add.type = 'button'; add.onclick = () => addItem(node); host.append(add);
  for (const page of localPages) {
    const link = element('a', `▧ ${page.title}`); link.href = chrome.runtime.getURL(page.kind==='pinboard'?'pinboard.html':'page.html') + '?id=' + encodeURIComponent(page.id); link.target = '_blank'; link.rel = 'noopener'; link.className = 'associated-page';
    const row = element('div', ''); row.className = 'associated-gallery-row';
    const remove = element('button', 'Delete'); remove.type = 'button'; remove.setAttribute('aria-label', `Delete ${page.kind==='pinboard'?'pinboard':'gallery'} ${page.title}`);
    remove.onclick = async () => {
      if (!confirm(`Delete ${page.kind==='pinboard'?'pinboard':'gallery'} “${page.title}” from Atlas? Imported image originals and the Chrome bookmark will remain.`)) return;
      remove.disabled = true;
      try {
        if(page.kind==='pinboard') await withPageLock(()=>removePinboard(chrome.storage.local,page.id));
        else await withPageLock(() => deletePage(chrome.storage.local, page.id, page.revision, saveLibraryPage));
        await loadLocalItems(node);
      } catch (error) { report(error.code || 'GALLERY_DELETE_FAILED', 'Could not confirm deletion. Open Activity & recovery → Reconnect companion or Open Debug Helper, then refresh before trying again.'); remove.disabled = false; }
    };
    row.append(link, remove); host.append(row);
  }
  if (associated) {
    for (const item of associated.related) {
      const details = document.createElement('details');
      details.append(element('summary', `${item.relation} · ${item.resource.title || 'Untitled'}`));
      if (item.resource.note) details.append(element('p', item.resource.note));
      host.append(details);
    }
  }
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
  renderPreview();
  const query = $('bookmarks-search').value.trim();
  const focusedNode = nodes.get(focused);
  const list = focusedNode ? focusedNode.children || [] : query ? findBookmarks(nodes, query) : parent.children || [];
  $('bookmarks-list').replaceChildren(); $('bookmarks-breadcrumbs').replaceChildren();
  for (const node of bookmarkTrail(nodes, folder)) {
    $('bookmarks-breadcrumbs').append(button(node.title || 'All bookmarks', async () => navigate(node.id)));
  }
  $('bookmarks-up').disabled = !focused && parent.parentId === undefined;
  const destination = focusedNode || parent;
  const canCreate = !destination.url && destination.parentId !== undefined && !destination.unmodifiable && !query;
  $('bookmarks-folder').disabled = !canCreate;
  $('bookmarks-new').disabled = !canCreate && !nodes.get(selected)?.url && !focusedNode?.url;
  report('BOOKMARKS_READY', `${list.length} item(s) · Title opens in this tab · Triangle explores · Live Chrome bookmarks`);
  for (const node of list) {
    const row = document.createElement('div'); row.className = 'bookmark-row'; row.setAttribute('role', 'listitem');
    const open = element('button', ''); open.className = 'bookmark-open'; open.type = 'button';
    open.setAttribute('aria-pressed', String(selected === node.id));
    const choose = () => {
      selected = node.id;if(node.url)$('bookmarks-new').disabled=false;
      for (const sibling of $('bookmarks-list').querySelectorAll('.bookmark-open')) sibling.setAttribute('aria-pressed','false');
      open.setAttribute('aria-pressed','true');
    };
    open.onclick = () => operation(() => openNode(node)); open.onfocus = choose;
    open.append(element('strong', `${node.url ? '☆' : '▰'} ${node.title || 'Untitled'}`));
    open.append(element('small', node.url || `${(node.children || []).length} item(s)`));
    const arrow = element('button', '▶'); arrow.type = 'button'; arrow.className = 'bookmark-disclosure'; arrow.dataset.bookmarkId = node.id;
    arrow.setAttribute('aria-label', `Explore ${node.title || 'Untitled'}`); arrow.setAttribute('aria-expanded', 'false');
    arrow.setAttribute('aria-controls', 'bookmarks-preview');
    arrow.onclick = () => focusNode(node);
    row.append(arrow, open);
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
function addExistingBookmark(node){
  const dialog=element('dialog',''),form=element('form','');dialog.className='bookmark-copy-dialog';
  form.append(element('h2','Add bookmark to folder'),element('p',node.title || node.url));
  const destinationLabel=element('label','Location'),destination=element('select','');
  for(const target of folderTargets(nodes)){const option=element('option',bookmarkTrail(nodes,target.id).slice(1).map(n=>n.title || 'Untitled').join(' / '));option.value=target.id;destination.append(option);}
  destination.value=node.parentId;destinationLabel.append(destination);
  const newLabel=element('label','New folder · optional'),newName=element('input','');newName.maxLength=200;newName.placeholder='Create inside the selected location';newLabel.append(newName);
  const message=element('p',''),save=element('button','Add Bookmark');message.setAttribute('role','status');save.type='submit';
  const cancel=element('button','Cancel');cancel.type='button';cancel.onclick=()=>dialog.close();
  form.append(destinationLabel,newLabel,message,save,cancel);dialog.append(form);
  form.onsubmit=async event=>{
    event.preventDefault();if(save.disabled)return;save.disabled=true;
    try{
      const current=(await chrome.bookmarks.get(node.id))[0];if(!current || !openableBookmark(current.url) || current.url!==node.url)throw Error('The selected bookmark changed. Close and select it again.');
      const latest=indexBookmarks(await chrome.bookmarks.getTree());let parent=latest.get(destination.value);
      if(!parent || parent.url || parent.parentId===undefined || parent.unmodifiable)throw Error('Choose a writable bookmark folder.');
      if(newName.value.trim()){
        parent=await chrome.bookmarks.create({parentId:parent.id,title:newName.value.trim()});
        const option=element('option',parent.title);option.value=parent.id;destination.append(option);destination.value=parent.id;newName.value='';
      }
      if(![...latest.values()].some(n=>n.parentId===parent.id && n.url===current.url))await chrome.bookmarks.create({parentId:parent.id,title:current.title,url:current.url});
      await refresh();dialog.close();
    }catch(error){message.textContent=error.message || 'Could not add this bookmark. Your original remains.';}
    finally{save.disabled=false;}
  };
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();destination.focus();
}
async function create(isFolder) {
  const parent = nodes.get(focused) || nodes.get(folder); if (!parent || parent.url || parent.parentId === undefined || parent.unmodifiable) return;
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
for (const id of ['home','library','add-location']) $(id).addEventListener('click',leave);
$('roots').addEventListener('click', leave);
$('bookmarks-refresh').onclick = refresh;
$('bookmarks-up').onclick = () => { if (focused) { returnFromPreview(); return; } const id = nodes.get(folder)?.parentId; if (id !== undefined) navigate(id); };
$('bookmarks-search').oninput = () => { selected = null; focused = null; associated = null; associationEpoch++; trail = []; render(); };
$('bookmarks-new').onclick = () => {const node=nodes.get(selected) || nodes.get(focused);if(node?.url)addExistingBookmark(node);else operation(() => create(false));};
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
$('bookmarks-workspace').addEventListener('keydown', event => {
  if (event.key === 'Escape' && focused && !event.target.closest('dialog')) { event.preventDefault(); event.stopPropagation(); returnFromPreview(); }
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[COVER_KEY]) { covers = changes[COVER_KEY].newValue || {}; if (active()) render(); }
  if (area === 'local' && focused && Object.keys(changes).some(key => key.startsWith(PAGE_PREFIX) || key.startsWith(ITEM_PREFIX))) loadLocalItems(nodes.get(focused));
});
