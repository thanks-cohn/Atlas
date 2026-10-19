import {createImageEntries,localImageOrigin,IMAGE_ENTRIES} from './image-entries.js';
import {indexBookmarks, findBookmarks, editableBookmark, folderTargets, bookmarkTrail, openableBookmark} from './bookmark-model.js';
import {COVER_BUDGET_KEY,coverBudgetMiB,coverStorageBytes,COVER_KEY, bookmarkCover, setBookmarkCover, bookmarkAssociations} from './bookmark-covers.js';
import {withPageLock} from './pages-store.js';
const $ = id => document.getElementById(id);
let nodes = new Map(), folder = null, epoch = 0, refreshTimer, selected = null;
let covers = {}, focused = null, trail = [];
let associated = null, associationEpoch = 0;
let bottomReveal=null;
function alignRevealBottom(){
  const request=bottomReveal;if(!request)return;
  requestAnimationFrame(()=>{if(bottomReveal!==request || focused!==request.id || !active())return;const host=$('bookmarks-workspace');host.scrollTop=host.scrollHeight;});
}
for(const event of ['wheel','touchstart','pointerdown','keydown'])$('bookmarks-workspace').addEventListener(event,()=>{bottomReveal=null;},{passive:true});
const active = () => document.body.classList.contains('bookmarks-mode');
const element = (tag, text) => { const el = document.createElement(tag); el.textContent = text; return el; };
let imageGalleryCache={};
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
    const stored = await chrome.storage.local.get([COVER_KEY,IMAGE_ENTRIES]);
    imageGalleryCache=stored[IMAGE_ENTRIES] || {};
    if (request !== epoch) return;
    covers = stored[COVER_KEY] && typeof stored[COVER_KEY] === 'object' && !Array.isArray(stored[COVER_KEY]) ? stored[COVER_KEY] : {};
    const priorURL = nodes.get(focused)?.url;
    nodes = indexBookmarks(roots);
    if (nodes.get(focused)?.url !== priorURL) { associated = null; associationEpoch++; }
    if (!nodes.has(focused)) { focused = null; trail = []; }
    if (!nodes.has(folder) || nodes.get(folder).url) folder = roots[0]?.id;
    render();
  } catch { report('BOOKMARK_READ_FAILED', 'Bookmark access is unavailable. Reload the updated extension and accept Chrome’s bookmark permission if prompted.'); }
}
function navigate(id) { bottomReveal=null; selected = null; focused = null; associated = null; associationEpoch++; trail = []; folder = id; $('bookmarks-search').value = ''; render(); }
async function openNode(node) {
  if (!node.url) { navigate(node.id); return; }
  if (!openableBookmark(node.url)) { report('BOOKMARK_URL_BLOCKED', 'This saved URL type cannot be opened here. Use Chrome’s bookmark manager for special or executable URLs.'); return false; }
  const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
  if (tab?.id === undefined) { report('BOOKMARK_TAB_UNAVAILABLE', 'Select a browser tab and try again.'); return false; }
  await chrome.tabs.update(tab.id, {url: node.url});
}
function focusNode(node) {
  trail.push({focused, associated, selected: node.id, scroll: $('bookmarks-workspace').scrollTop});
  focused = node.id; associated = null; selected = node.id;
  const request={id:node.id};bottomReveal=request;render();alignRevealBottom();
  Promise.allSettled([loadAssociations(node)]).then(()=>{if(bottomReveal===request)alignRevealBottom();});
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
  bottomReveal=null;
  associationEpoch++;
  const state = trail.pop(); focused = state?.focused ?? null; selected = state?.selected ?? null;
  associated = state?.associated ?? null;
  if (!nodes.has(focused)) focused = null;
  render(); $('bookmarks-workspace').scrollTop = state?.scroll || 0;
  [...$('bookmarks-list').querySelectorAll('.bookmark-disclosure')].find(el => el.dataset.bookmarkId === selected)?.focus();
}
async function saveCover(node, image, origin) {
  const galleries=createImageEntries({storage:chrome.storage.local});await galleries.load();
  if(image || galleries.gallery(node.url)){
    if(!galleries.gallery(node.url)){
      const prior=bookmarkCover(node,covers);let info={tags:[],notes:[],bookmarks:[]};
      if(prior){const snapshot=await catalogRequest();const data=bookmarkAssociations(node,snapshot.data);info={tags:data.tags,notes:[...data.matches.filter(r=>r.note).map(r=>({id:r.id,title:r.title,text:r.note})),...data.related.filter(r=>r.resource.kind==='note').map(r=>({id:r.resource.id,title:r.resource.title,text:r.resource.note}))],bookmarks:data.related.filter(r=>r.resource.kind==='bookmark').map(r=>({id:r.resource.id,title:r.resource.title,url:r.resource.locators?.find(l=>l.provider==='web')?.reference})).filter(r=>r.url)};}
      await galleries.ensure(node.url,{id:node.id,url:node.url,title:node.title,kind:'bookmark',aliases:[...nodes.values()].filter(n=>n.url===node.url).map(n=>n.id)},prior,info);
    }
    if(image){const entry=await galleries.add(node.url,image,origin || {provider:'legacy-preview',sha256:null,hashStatus:'unavailable'});await galleries.setDefault(node.url,entry.id);}
    else {const id=galleries.gallery(node.url).defaultId;if(id)await galleries.remove(node.url,id);}
    covers=(await chrome.storage.local.get(COVER_KEY))[COVER_KEY] || {};render();return;
  }
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
      await saveCover(node, canvas.toDataURL('image/webp', 0.82),await localImageOrigin(file));
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
function addMetadata(node){
  const dialog=document.createElement('dialog');dialog.className='bookmark-metadata-dialog';
  const form=document.createElement('form');
  let confirmed=0;
  form.append(element('p','BOOKMARK DETAILS'),element('h2','Add Tags'));
  const label=element('label','Tags, separated by commas'),input=document.createElement('input');
  input.required=true;input.maxLength=8000;input.placeholder='Design, Travel, Architecture';label.append(input);
  const gallery=imageGalleryCache[node.url],entry=gallery?.entries.find(e=>e.id===gallery.defaultId);
  const message=element('p',entry?'Saved with this image in Atlas.':'Saved in your Atlas companion, linked to this bookmark URL.');message.setAttribute('role','status');
  const actions=element('div','');actions.className='metadata-actions';const cancel=element('button','Cancel');cancel.type='button';cancel.onclick=()=>dialog.close();const save=element('button','Add Tags');save.type='submit';actions.append(cancel,save);form.append(label);
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
  async function tagSnapshot(){if(!entry)return catalogRequest();const saved=await chrome.storage.local.get([IMAGE_ENTRIES,'atlas-tag-vocabulary-v1']);const current=saved[IMAGE_ENTRIES]?.[node.url]?.entries.find(e=>e.id===entry.id);if(!current)throw Error('Image removed');return {revision:current.revision,data:{resources:{image:{kind:'bookmark',locators:[{provider:'web',reference:node.url}]}},tags:{image:current.tags,vocabulary:saved['atlas-tag-vocabulary-v1'] || []}}};}
  {existing.setAttribute('aria-label','Existing Atlas tags');existingLabel.append(existing);form.append(existingLabel,savedTags);existing.onchange=()=>{if(!existing.value)return;const values=input.value.split(',').map(value=>value.trim()).filter(Boolean);if(!values.includes(existing.value))values.push(existing.value);input.value=values.join(', ');existing.value='';input.focus();};const waiting=element('option','Loading existing tags…');waiting.value='';existing.append(waiting);tagSnapshot().then(snapshot=>populateTags(snapshot.data,snapshot.revision)).catch(()=>{if(displayedRevision<0){const unavailable=element('option','Connect companion to load tags');unavailable.value='';existing.replaceChildren(unavailable);}});}
  form.append(message,actions);dialog.append(form);
  const close=element('button','×');close.type='button';close.className='metadata-close';close.setAttribute('aria-label','Close bookmark details');close.onclick=()=>dialog.close();dialog.append(close);
  form.onsubmit=async event=>{
    event.preventDefault();const value=[...new Set(input.value.split(',').map(tag=>tag.trim()).filter(Boolean))];if((!value.length || value.length>100 || value.some(tag=>tag.length>80))){message.textContent='Enter up to 100 comma-separated tags, each no longer than 80 characters.';return;}confirmed=0;
    save.disabled=true;
    try{
      await withPageLock(async()=>{
        if(entry){const saved=await chrome.storage.local.get([IMAGE_ENTRIES,'atlas-tag-vocabulary-v1']),all=structuredClone(saved[IMAGE_ENTRIES] || {}),current=all[node.url]?.entries.find(e=>e.id===entry.id);if(!current)throw Error('Image removed');const before=[...current.tags];current.tags=[...new Set([...current.tags,...value])];current.revision++;current.history.push({type:'human-tags-added',at:new Date().toISOString(),actor:'human',before,after:[...current.tags]});await chrome.storage.local.set({[IMAGE_ENTRIES]:all,'atlas-tag-vocabulary-v1':[...new Set([...(saved['atlas-tag-vocabulary-v1'] || []),...value])]});imageGalleryCache=all;confirmed=value.length;populateTags((await tagSnapshot()).data,current.revision);return;}
        const state=await chrome.runtime.sendMessage({type:'state'});if(!state?.paired)throw Error('COMPANION_OFFLINE');
        const [current]=await chrome.bookmarks.get(node.id);if(current?.url!==node.url)throw Error('BOOKMARK_CHANGED');
        let snapshot=await catalogRequest();const matches=Object.values(snapshot.data.resources || {}).filter(resource=>resource.kind==='bookmark' && resource.locators?.some(locator=>locator.provider==='web' && locator.reference===node.url));let resource=matches[0];
        if(!resource){snapshot=await catalogRequest({action:'add_resource',args:{kind:'bookmark',title:node.title || node.url,locators:[{provider:'web',reference:node.url}],note:''},expected_revision:snapshot.revision});resource=snapshot.data.resources[snapshot.result];if(!resource)throw Error('BOOKMARK_METADATA_CREATE_UNKNOWN');}
        {for(const tag of value){if(!(snapshot.data.tags?.[resource.id] || []).includes(tag))snapshot=await catalogRequest({action:'tag',args:{resource:resource.id,tag},expected_revision:snapshot.revision});confirmed++;}populateTags(snapshot.data,snapshot.revision);}
      });
      if(focused===node.id && nodes.get(node.id)?.url===node.url)await loadAssociations(node);
      {input.value='';message.textContent=value.length+' tag'+(value.length===1?'':'s')+' saved. Add more, or close with ×. Refresh your pinboard to see changes.';input.focus();}$('bookmarks-status').textContent='';
    }catch(error){message.textContent=(error.message || 'BOOKMARK_METADATA_SAVE_FAILED')+' ('+confirmed+' of '+value.length+' confirmed)'+': Could not confirm the save. Your input remains here. Connect the companion, or reopen this editor if the bookmark changed.';}
    finally{save.disabled=false;}
  };
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();input.focus();
}
function metadataSection(node){
  const section=element('section','');section.className='bookmark-add-section';
  const actions=element('div','');actions.className='bookmark-add-actions';
  const control=element('button','Add Tags');control.type='button';control.onclick=()=>addMetadata(node);actions.append(control);section.append(actions);
  const gallery=imageGalleryCache[node.url],entry=gallery?.entries.find(e=>e.id===gallery.defaultId),shownTags=gallery?(entry?.tags || []):(associated?.tags || []);
  if(shownTags.length){const tags=element('div','');tags.className='bookmark-tag-pills';for(const tag of shownTags){const pill=element('span',tag);pill.className='bookmark-tag-pill';tags.append(pill);}section.append(tags);}
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
    image.onerror = () => { image.remove(); host.append(element('p', 'This image is unavailable. Choose another image below.'));alignRevealBottom(); };
    image.onload=()=>alignRevealBottom();
    image.src = source; host.append(image);
  } else host.append(element('p', 'No representative image yet. Choose one to show it here.'));
  const actions = element('div', ''); actions.className = 'bookmark-image-actions';
  const choose = element('button', 'Choose image'); choose.type = 'button'; choose.onclick = () => chooseCover(node); actions.append(choose);
  if (Object.hasOwn(covers, node.id)) actions.append(button('Remove chosen image', () => saveCover(node, null)));
  host.append(actions);
  if(node.url)host.append(metadataSection(node));

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
      const menu = document.createElement('details');menu.className='bookmark-action-menu'; menu.append(element('summary', 'Actions'));
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
for (const id of ['home','add-location']) $(id).addEventListener('click',leave);
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
  if(area==='local' && changes[IMAGE_ENTRIES]){imageGalleryCache=changes[IMAGE_ENTRIES].newValue || {};if(active())render();}
  if (area === 'local' && changes[COVER_KEY]) { covers = changes[COVER_KEY].newValue || {}; if (active()) render(); }
});
