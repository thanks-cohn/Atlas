import {installBlankBoard} from './pinboard-blank.js';
import {installCoverFetch} from './fetch-covers.js';
import {PINBOARDS_KEY,PINBOARD_SETTINGS,BATCH,pinItems,boardRecord,cardLimit,tagQuery,matchesTags,createPinboard} from './pinboard-model.js';
import {COVER_BUDGET_KEY,coverBudgetMiB,coverStorageBytes,COVER_KEY,bookmarkCover,setBookmarkCover,directImage} from './bookmark-covers.js';
import {publicImageURL} from './pages-store.js';
import {rasterImage} from './image-file.js';
const $=id=>document.getElementById(id),el=(tag,text='')=>{const node=document.createElement(tag);node.textContent=text;return node;};
let pendingTags=new Set(),activeTags=[],metadataState='loading';
let roots=[],covers={},items=[],selected=null,associations=new Map();
const imageGeometry=new Map(),failedImages=new Set();
let positions=[],positionById=new Map();
let blocks=new Map(),frame=0,limit=72;
const topSpacer=el('div'),bottomSpacer=el('div');topSpacer.className=bottomSpacer.className='pin-spacer';
const boardId=new URL(location.href).searchParams.get('id');
const status=text=>$('status').textContent=text;
function metadata(node){return associations.get(node.url) || {note:'',tags:[],image:null};}
function imageFor(node){const value=bookmarkCover(node,covers) || metadata(node).image;if(failedImages.has(value))return null;return value?.startsWith('data:')?value:publicImageURL(value);}
function link(node,label){const a=el('a',label);a.href=node.url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function pickImage(node){selected=node;$('cover-url').value='';$('image-status').textContent='';document.documentElement.setAttribute('data-pin-open','');$('image-source').showModal();}
function tagsFor(node){return [...new Set(metadata(node).tags.filter(tag=>typeof tag==='string').map(tag=>tag.trim()).filter(Boolean))];}
function tagStrip(node){
  const tags=tagsFor(node);if(!tags.length)return null;
  const strip=el('div');strip.className='pin-tags';strip.setAttribute('aria-label','Bookmark tags');
  for(const tag of tags.slice(0,5)){const pill=tagButton(tag,'pin-tag');strip.append(pill);}
  if(tags.length>5){const more=el('button','+'+(tags.length-5));more.className='pin-tag pin-tag-more';more.setAttribute('aria-label','Show all '+tags.length+' tags');more.onclick=()=>openDetail(node);strip.append(more);}
  return strip;
}
function openDetail(node){selected=node;$('detail-title').textContent=node.title || new URL(node.url).hostname;const image=imageFor(node);$('detail-image').hidden=!image;if(image)$('detail-image').src=image;else $('detail-image').removeAttribute('src');$('detail-image').alt=node.title || 'Bookmark image';$('detail-note').textContent=metadata(node).note;$('detail-link').href=node.url;$('detail-tags').replaceChildren(...tagsFor(node).map(tag=>{return tagButton(tag,'tag');}));document.documentElement.setAttribute('data-pin-open','');$('detail').showModal();}
function card(node){
  const article=el('article');article.className='pin';article.atlasNode=node;const image=imageFor(node);
  if(image){
    const button=el('button');button.className='pin-visual';button.setAttribute('aria-label','Preview '+(node.title || node.url));
    const geometry=imageGeometry.get(image);button.style.aspectRatio=geometry || '4 / 3';
    const img=el('img');img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.alt=node.title || '';const loading=el('span');loading.className='pin-loading';loading.append(el('strong','A'),el('span','Loading image…'));button.append(img,loading);img.onload=()=>{if(img.naturalWidth && img.naturalHeight){const ratio=img.naturalWidth+' / '+img.naturalHeight;imageGeometry.set(image,ratio);button.style.aspectRatio=ratio;}button.classList.add('is-ready');scheduleWindow();};img.src=image;button.onclick=()=>openDetail(node);
    img.onerror=()=>{failedImages.add(image);article.replaceChildren();emptyCard(article,node);scheduleWindow();};
    const copy=el('div');copy.className='pin-copy';const strip=tagStrip(node),copyHeight=strip?138:78;copy.style.height=copyHeight+'px';button.style.height='calc(100% - '+copyHeight+'px)';const title=link(node,node.title || new URL(node.url).hostname);title.className='pin-title';const url=link(node,new URL(node.url).hostname);url.className='pin-url';copy.append(title,url);if(strip)copy.append(strip);article.append(button,copy);
  }else emptyCard(article,node);
  return article;
}
function emptyCard(article,node){const row=el('div');row.className='pin-empty';const url=link(node,node.url);url.className='pin-url';url.title=node.url;const add=el('button','+');add.setAttribute('aria-label','Add image to '+(node.title || node.url));add.onclick=()=>pickImage(node);row.append(url,add);article.append(row);const fetch=el('button','Fetch');fetch.className='fetch-one';fetch.setAttribute('aria-label','Fetch cover for '+(node.title || node.url));fetch.onclick=()=>coverFetch.request(node);article.append(fetch);const strip=tagStrip(node);if(strip){article.className+=' pin-with-tags';article.append(strip);}}
function localScroll(){return Math.max(0,-$('pins').getBoundingClientRect().top);}
function columns(){
  const width=$('pins').clientWidth || 1100;
  return window.innerWidth<=540 ? 2 : Math.max(1,Math.min(7,Math.floor((width+20)/230)));
}
function scheduleWindow(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;renderWindow();});}
function positionCard(element,position){if(!position)return;Object.assign(element.style,{position:'absolute',left:position.x+'px',top:position.y+'px',width:position.width+'px',height:position.height+'px',margin:'0'});}
function renderWindow(){
  if($('folder').value==='blank')return;
  const mounted=[...blocks.values()].flatMap(block=>[...block.children]);
  const anchor=mounted.find(element=>{const r=element.getBoundingClientRect();return r.bottom>0 && r.top<(window.innerHeight || 768);});
  const oldAnchor=anchor?.getBoundingClientRect().top;
  const cols=columns(),gap=window.innerWidth<=540?12:20,width=(($('pins').clientWidth || 1100)-(cols-1)*gap)/cols;
  const ends=Array(cols).fill(0);
  positions=items.map((node,index)=>{
    const image=imageFor(node),parts=(imageGeometry.get(image) || '4 / 3').split('/').map(Number),ratio=parts[0]/parts[1];
    const visual=image?Math.max(window.innerWidth<=540?120:160,Math.min(480,width/ratio)):0;
    const extra=tagsFor(node).length?60:0;const height=image?visual+78+extra:96+extra,column=ends.indexOf(Math.min(...ends));
    const position={node,index,x:column*(width+gap),y:ends[column],width,height};ends[column]+=height+24;return position;
  });
  positionById=new Map(positions.map(position=>[position.node.id,position]));
  $('pins').style.height=Math.max(0,...ends)+'px';
  // Keep the same visible card anchored as intrinsic image ratios become known.
  if(anchor && oldAnchor!==undefined){const next=positionById.get(anchor.atlasNode.id);const prior=parseFloat(anchor.style.top);if(next && Number.isFinite(prior)){const delta=next.y-prior;if(Math.abs(delta)>1)window.scrollBy({top:delta,behavior:'instant'});}}
  const top=localScroll(),bottom=top+(window.innerHeight || 768);
  const visible=positions.filter(position=>position.y+position.height>=top && position.y<=bottom);
  const chosen=new Set(visible.map(position=>position.index));
  // Fill the remaining budget with nearest neighbors, never whole remote batches.
  for(const position of [...positions].sort((a,b)=>Math.abs(a.y-top)-Math.abs(b.y-top))){if(chosen.size>=limit)break;chosen.add(position.index);}
  const selected=positions.filter(position=>chosen.has(position.index)),wantedBatches=new Set(selected.map(position=>Math.floor(position.index/BATCH)));
  for(const [index,block] of blocks)if(!wantedBatches.has(index)){if(block.contains(document.activeElement)){$('pins').tabIndex=-1;$('pins').focus({preventScroll:true});}block.remove();blocks.delete(index);}
  for(const index of wantedBatches){let block=blocks.get(index);if(!block){block=el('div');block.className='pin-block';blocks.set(index,block);}
    const existing=new Map([...block.children].map(element=>[element.atlasNode.id,element]));
    const wanted=selected.filter(position=>Math.floor(position.index/BATCH)===index);
    const nodes=wanted.map(position=>{const element=existing.get(position.node.id) || card(position.node);positionCard(element,position);return element;});
    if(nodes.length!==block.children.length || nodes.some((node,i)=>node!==block.children[i])){
      if([...block.children].some(element=>element.contains(document.activeElement) && !nodes.includes(element))){$('pins').tabIndex=-1;$('pins').focus({preventScroll:true});}
      block.replaceChildren(...nodes);
    }
  }
  topSpacer.style.height=(selected[0]?.y || 0)+'px';bottomSpacer.style.height='0px';
  const wanted=[topSpacer,...[...blocks].sort((a,b)=>a[0]-b[0]).map(([,block])=>block),bottomSpacer];
  const current=[...$('pins').children];if(current.length!==wanted.length || current.some((node,i)=>node!==wanted[i]))$('pins').replaceChildren(...wanted);
  coverFetch.discover();
  status(items.length ? `${items.length.toLocaleString()} bookmark${items.length===1?'':'s'} · Explore your collection` : ((activeTags.length || tagQuery($('search').value).tags.length || $('tags-only').checked) && metadataState==='unavailable'?'Connect your companion to load saved tags, then Refresh.':'No matches. Try different tags or search words, or turn off a filter.'));
}
function resetBlocks(){blocks.clear();$('pins').replaceChildren();renderWindow();}
function isSelectedTag(tag){return pendingTags.has(tag) || activeTags.includes(tag) || tagQuery($('search').value).tags.includes(tag);}
function removeTag(tag){activeTags=activeTags.filter(t=>t!==tag);pendingTags.delete(tag);const q=tagQuery($('search').value);const rest=q.tags.filter(t=>t!==tag);$('search').value=q.text+(rest.length?' tag:'+rest.join(','):'');}
function tagButton(tag,className){
  const button=el('button',tag);button.type='button';button.className=className;button.title=tag;button.dataset && (button.dataset.tag=tag);button.setAttribute('aria-pressed',String(isSelectedTag(tag)));
  button.onclick=()=>{const applied=activeTags.includes(tag) || tagQuery($('search').value).tags.includes(tag);if(isSelectedTag(tag)){if(applied){removeTag(tag);coverFetch.stop();render();}else{pendingTags.delete(tag);renderTags();}}else{pendingTags.add(tag);renderTags();}button.setAttribute('aria-pressed',String(isSelectedTag(tag)));syncSelection();};return button;
}
function syncSelection(){for(const button of document.querySelectorAll?.('[data-tag]') || [])button.setAttribute('aria-pressed',String(isSelectedTag(button.dataset.tag)));const staged=[...pendingTags].some(tag=>!activeTags.includes(tag));$('apply-tags').hidden=!staged;$('apply-tags').textContent='Show Matches ↵';}

function applyTags(){activeTags=[...pendingTags];coverFetch.stop();render();$('pins').scrollIntoView({block:'start',behavior:'instant'});}
function filteredNodes(){const query=tagQuery($('search').value);const required=[...new Set([...activeTags,...query.tags])];return pinItems(roots,$('folder').value,query.text).filter(node=>matchesTags(tagsFor(node),required) && (!$('tags-only').checked || tagsFor(node).length));}
function renderTags(){
  const blank=$('folder').value==='blank';$('tag-browser').hidden=blank;
  const tags=[...new Set(pinItems(roots,$('folder').value).flatMap(tagsFor))].sort((a,b)=>Number(isSelectedTag(b))-Number(isSelectedTag(a)) || a.localeCompare(b));
  $('tag-browser').hidden=blank || !tags.length;
  $('tag-field').replaceChildren(...tags.map(tag=>tagButton(tag,'browse-tag')));
  const required=[...new Set([...activeTags,...tagQuery($('search').value).tags])];$('active-tags').hidden=blank || !required.length;
  const label=el('span','Matching all');$('active-tags').replaceChildren(label,...required.map(tag=>{const b=el('button',tag+' ×');b.setAttribute('aria-label','Remove tag filter '+tag);b.onclick=()=>{removeTag(tag);coverFetch.stop();render();};return b;}));syncSelection();
}
function render(){const blank=$('folder').value==='blank';blankBoard.show(blank);$('pins').hidden=blank;$('fetch-dock').hidden=blank;$('status').hidden=blank;document.querySelector('.board-options').hidden=blank;renderTags();if(blank){blocks.clear();$('pins').replaceChildren();return;}items=filteredNodes().filter(node=>!$('images-only').checked || imageFor(node));resetBlocks();}

function updateCoverCard(node){
  const block=[...blocks.values()].find(block=>[...block.children].some(element=>element.atlasNode?.id===node.id));if(!block)return;
  const old=[...block.children].find(element=>element.atlasNode.id===node.id);if(old.atlasNode.url!==node.url)return;
  const replacement=card(node);positionCard(replacement,positionById.get(node.id));old.replaceWith(replacement);scheduleWindow();
}
async function saveSettings(){try{await chrome.storage.local.set({[PINBOARD_SETTINGS]:{version:1,limit,imagesOnly:$('images-only').checked,tagsOnly:$('tags-only').checked}});}catch{status('PINBOARD_SETTINGS_SAVE_FAILED: Your current view still works; settings were not saved.');}}
function indexAssociations(data){
  const byResource=new Map(),result=new Map();
  for(const resource of Object.values(data?.resources || {}))if(resource.kind==='bookmark')for(const locator of resource.locators || [])if(locator.provider==='web'){
    const entry=result.get(locator.reference) || {note:'',tags:[],image:null};entry.note=resource.note || entry.note;entry.tags=[...new Set([...entry.tags,...(data.tags?.[resource.id] || [])])];result.set(locator.reference,entry);byResource.set(resource.id,entry);
  }
  for(const relation of data?.relations || []){const entry=byResource.get(relation.from),target=data.resources?.[relation.to];if(!entry || !target)continue;if(target.kind==='image' && !entry.image)entry.image=(target.locators || []).map(l=>l.provider==='web'?directImage(l.reference):null).find(Boolean) || null;if(target.kind==='note' && target.note)entry.note+=(entry.note?'\n\n':'')+target.note;}
  return result;
}
async function refreshAssociations(){
  // Tags belong to exact Atlas bookmark URLs; never infer tags from titles/domains.
  try{const result=await chrome.runtime.sendMessage({type:'api',path:'/v1/catalog'});if(result?.ok===false || !result?.data)throw Error('Unavailable');associations=indexAssociations(result.data);metadataState='ready';}catch{metadataState=associations.size?'cached':'unavailable';}
}
async function refresh(){
  try{
    const chosen=$('folder').value || 'all';roots=await chrome.bookmarks.getTree();covers=(await chrome.storage.local.get(COVER_KEY))[COVER_KEY] || {};
    $('folder').replaceChildren();const blank=el('option','Create Blank');blank.value='blank';$('folder').append(blank);const all=el('option','All Bookmarks');all.value='all';$('folder').append(all);
    function folders(nodes,path=[]){for(const node of nodes)if(!node.url){const trail=[...path,node.title].filter(Boolean);if(node.id && node.parentId!==undefined){const option=el('option',trail.join(' / '));option.value=node.id;$('folder').append(option);}folders(node.children || [],trail);}}
    folders(roots);const savedBoards=(await chrome.storage.local.get(PINBOARDS_KEY))[PINBOARDS_KEY] || {};for(const saved of Object.values(savedBoards)){try{const board=boardRecord(saved);const option=el('option',board.title);option.value='board:'+board.id;$('folder').append(option);}catch{}}$('folder').value=chosen;if(!$('folder').value)$('folder').value='all';
    await refreshAssociations();render();
  }catch{status('PINBOARD_READ_FAILED: Could not read bookmarks. Reload the extension and check bookmark permission.');}
}
const blankBoard=installBlankBoard({scope:boardId || 'default',storage:chrome.storage.local,publicImageURL,rasterImage,getBookmarks:()=>pinItems(roots),describeBookmark:node=>({image:imageFor(node),note:metadata(node).note,tags:tagsFor(node)})});
$('apply-tags').onclick=applyTags;
window.addEventListener('keydown',async event=>{if(event.key==='Enter' && !$('detail').open && !$('image-source').open && $('folder').value!=='blank' && (event.target===$('search') || event.target===document.body || event.target?.closest?.('[data-tag],#tag-browser,#pins'))){event.preventDefault();clearTimeout(searchTimer);await refreshAssociations();applyTags();}});
$('tags-only').onchange=()=>{coverFetch.stop();render();saveSettings();};
async function refreshCoverUsage(){
  try{const saved=(await chrome.storage.local.get(COVER_BUDGET_KEY))[COVER_BUDGET_KEY];$('cover-budget').value=String(coverBudgetMiB(saved));const bytes=coverStorageBytes((await chrome.storage.local.get(COVER_KEY))[COVER_KEY] || {});$('cover-usage').textContent=(bytes/1048576).toFixed(1)+' MiB saved · '+coverBudgetMiB(saved)+' MiB limit';}catch{$('cover-usage').textContent='Usage unavailable';}
}
$('save-cover-budget').onclick=async()=>{
  const value=Number($('cover-budget').value);if(!Number.isInteger(value) || value<8 || value>512){$('cover-budget-status').textContent='Enter a whole number from 8 to 512 MiB.';return;}
  $('save-cover-budget').disabled=true;
  try{await navigator.locks.request('atlas-pages-v1',()=>chrome.storage.local.set({[COVER_BUDGET_KEY]:value}));await refreshCoverUsage();$('cover-budget-status').textContent='Saved. Existing images are kept.';}catch{$('cover-budget-status').textContent='Could not save. Your previous limit remains.';}finally{$('save-cover-budget').disabled=false;}
};
refreshCoverUsage();
const fetchDock=$('fetch-dock');let hoverOpened=false;
fetchDock.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse' && !fetchDock.open){hoverOpened=true;fetchDock.open=true;}});
fetchDock.addEventListener('pointerleave',()=>{if(hoverOpened && !fetchDock.contains(document.activeElement)){fetchDock.open=false;hoverOpened=false;}});
fetchDock.addEventListener('focusout',()=>{setTimeout(()=>{if(hoverOpened && !fetchDock.contains(document.activeElement) && !fetchDock.matches(':hover')){fetchDock.open=false;hoverOpened=false;}},0);});
fetchDock.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();event.preventDefault();fetchDock.open=false;hoverOpened=false;fetchDock.querySelector('summary').focus();}});
$('folder').onchange=()=>{if($('folder').value.startsWith('board:')){location.href='pinboard.html?id='+encodeURIComponent($('folder').value.slice(6));return;}coverFetch.stop();render();$('pins').scrollIntoView({block:'start',behavior:'instant'});scheduleWindow();};let searchTimer;$('search').oninput=()=>{coverFetch.stop();clearTimeout(searchTimer);searchTimer=setTimeout(()=>render(),160);};
$('refresh').onclick=refresh;
$('new-pinboard').onclick=()=>{$('new-board-title').value='';$('new-board-status').textContent='';$('new-board-dialog').showModal();$('new-board-title').focus();};
$('cancel-new-board').onclick=()=>$('new-board-dialog').close();
$('new-board-form').onsubmit=async event=>{event.preventDefault();const title=$('new-board-title').value.trim();if(!title)return;try{const id=crypto.randomUUID();await navigator.locks.request('atlas-pages-v1',()=>createPinboard(chrome.storage.local,{id:'',url:''},title,id,'blank'));location.href='pinboard.html?id='+encodeURIComponent(id);}catch{$('new-board-status').textContent='Could not create this pinboard. Please try again.';}};
$('images-only').onchange=()=>{render();$('pins').scrollIntoView({block:'start',behavior:'instant'});scheduleWindow();saveSettings();};
$('card-limit').onchange=()=>{limit=cardLimit($('card-limit').value);renderWindow();saveSettings();};
window.addEventListener('scroll',scheduleWindow,{passive:true});
window.addEventListener('resize',scheduleWindow);
$('close').onclick=()=>$('detail').close();$('detail').addEventListener('close',()=>{$('detail-image').removeAttribute('src');if(!$('image-source').open)document.documentElement.removeAttribute('data-pin-open');});
$('replace-image').onclick=()=>pickImage(selected);
$('cancel-image').onclick=()=>$('image-source').close();
$('image-source').addEventListener('close',()=>{if(!$('detail').open)document.documentElement.removeAttribute('data-pin-open');});
$('upload-image').onclick=()=>{$('image-source').close();$('image-file').value='';$('image-file').click();};
async function saveImage(node,image){
  await navigator.locks.request('atlas-pages-v1',async()=>{const latest=(await chrome.storage.local.get(COVER_KEY))[COVER_KEY] || {};covers=setBookmarkCover(latest,node,image,(await chrome.storage.local.get(COVER_BUDGET_KEY))[COVER_BUDGET_KEY]);await chrome.storage.local.set({[COVER_KEY]:covers});});refreshCoverUsage();
  if($('detail').open && selected?.id===node.id)$('detail-image').src=image;
  render();status('Bookmark image saved. The shelf and this pinboard use the same cover.');
}
$('save-image-url').onclick=async()=>{
  const image=publicImageURL($('cover-url').value.trim()),node=selected;
  if(!image || image.length>8192){$('image-status').textContent='Enter a public HTTP(S) image URL without credentials or signed access tokens.';return;}
  $('save-image-url').disabled=true;
  try{await saveImage(node,image);$('image-source').close();}catch{$('image-status').textContent='Could not save the image reference. Existing covers are unchanged.';}
  finally{$('save-image-url').disabled=false;}
};
$('image-file').onchange=async()=>{
  const file=$('image-file').files?.[0],node=selected;if(!file || !node)return;
  try{
    status('Preparing bookmark image…');
    const image=await rasterImage(file,60000);
    await saveImage(node,image);
  }catch(error){status((error.message || 'PINBOARD_IMAGE_FAILED')+': Image not added. Try a smaller image; existing bookmarks are unchanged.');}
};
const coverFetch=installCoverFetch({
  getScope:()=>JSON.stringify([boardId,$('folder').value,$('search').value.trim(),activeTags,$('tags-only').checked]),
  getNodes:()=>filteredNodes(),
  getMounted:()=>[...blocks.values()].flatMap(block=>[...block.children].map(element=>({element,node:element.atlasNode}))),
  hasCover:node=>!!imageFor(node),raster:rasterImage,
  saveCover:async(node,image)=>navigator.locks.request('atlas-pages-v1',async()=>{
    const current=await chrome.bookmarks.get(node.id);if(current[0]?.url!==node.url)return false;
    const latest=(await chrome.storage.local.get(COVER_KEY))[COVER_KEY] || {};
    if(bookmarkCover(node,latest)){covers=latest;return false;}
    const next=setBookmarkCover(latest,node,image,(await chrome.storage.local.get(COVER_BUDGET_KEY))[COVER_BUDGET_KEY]);await chrome.storage.local.set({[COVER_KEY]:next});covers=next;return true;
  }),
  onSaved:node=>{updateCoverCard(node);refreshCoverUsage();}
});
async function start(){
  try{const saved=(await chrome.storage.local.get(PINBOARD_SETTINGS))[PINBOARD_SETTINGS];limit=cardLimit(saved?.limit);$('card-limit').value=String(limit);$('images-only').checked=saved?.imagesOnly===true;$('tags-only').checked=saved?.tagsOnly===true;}catch{}
  await refresh();
  if(boardId){try{const board=boardRecord((await chrome.storage.local.get(PINBOARDS_KEY))[PINBOARDS_KEY]?.[boardId]);$('title').textContent=board.title;document.title=board.title+' · Atlas Pinboard';const exists=[...$('folder').options].some(o=>o.value===board.folderId);$('folder').value=exists?board.folderId:'all';if(!exists){items=[];resetBlocks();status('PINBOARD_FOLDER_MISSING: Choose another folder to browse.');}else render();}catch{items=[];resetBlocks();status('PINBOARD_NOT_FOUND: This saved pinboard is unavailable.');}}

}
start();
