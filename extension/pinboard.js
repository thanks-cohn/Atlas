import {installCoverFetch} from './fetch-covers.js';
import {PINBOARDS_KEY,PINBOARD_SETTINGS,BATCH,pinItems,boardRecord,cardLimit,visibleBlocks} from './pinboard-model.js';
import {COVER_KEY,bookmarkCover,setBookmarkCover,directImage} from './bookmark-covers.js';
import {publicImageURL} from './pages-store.js';
import {rasterImage} from './image-file.js';
const $=id=>document.getElementById(id),el=(tag,text='')=>{const node=document.createElement(tag);node.textContent=text;return node;};
let roots=[],covers={},items=[],selected=null,associations=new Map();
const imageGeometry=new Map(),failedImages=new Set();
let heights=new Map(),estimates=[],blocks=new Map(),frame=0,limit=72,resizeObserver;
const topSpacer=el('div'),bottomSpacer=el('div');topSpacer.className=bottomSpacer.className='pin-spacer';
const boardId=new URL(location.href).searchParams.get('id');
const status=text=>$('status').textContent=text;
function metadata(node){return associations.get(node.url) || {note:'',tags:[],image:null};}
function imageFor(node){const value=bookmarkCover(node,covers) || metadata(node).image;if(failedImages.has(value))return null;return value?.startsWith('data:')?value:publicImageURL(value);}
function link(node,label){const a=el('a',label);a.href=node.url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function pickImage(node){selected=node;$('cover-url').value='';$('image-status').textContent='';document.documentElement.setAttribute('data-pin-open','');$('image-source').showModal();}
function openDetail(node){selected=node;$('detail-title').textContent=node.title || new URL(node.url).hostname;$('detail-image').src=imageFor(node);$('detail-image').alt=node.title || 'Bookmark image';$('detail-note').textContent=metadata(node).note;$('detail-link').href=node.url;$('detail-tags').replaceChildren(...metadata(node).tags.map(tag=>{const span=el('span',tag);span.className='tag';return span;}));document.documentElement.setAttribute('data-pin-open','');$('detail').showModal();}
function card(node){
  const article=el('article');article.className='pin';article.atlasNode=node;const image=imageFor(node);
  if(image){
    const button=el('button');button.className='pin-visual';button.setAttribute('aria-label','Preview '+(node.title || node.url));
    const geometry=imageGeometry.get(image);button.style.aspectRatio=geometry || '4 / 3';
    const img=el('img');img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.alt=node.title || '';const loading=el('span');loading.className='pin-loading';loading.append(el('strong','A'),el('span','Loading image…'));button.append(img,loading);img.onload=()=>{if(img.naturalWidth && img.naturalHeight){const ratio=img.naturalWidth+' / '+img.naturalHeight;imageGeometry.set(image,ratio);button.style.aspectRatio=ratio;}button.classList.add('is-ready');scheduleWindow();};img.src=image;button.onclick=()=>openDetail(node);
    img.onerror=()=>{failedImages.add(image);article.replaceChildren();emptyCard(article,node);scheduleWindow();};
    const copy=el('div');copy.className='pin-copy';const title=link(node,node.title || new URL(node.url).hostname);title.className='pin-title';const url=link(node,new URL(node.url).hostname);url.className='pin-url';copy.append(title,url);article.append(button,copy);
  }else emptyCard(article,node);
  return article;
}
function emptyCard(article,node){const row=el('div');row.className='pin-empty';const url=link(node,node.url);url.className='pin-url';url.title=node.url;const add=el('button','+');add.setAttribute('aria-label','Add image to '+(node.title || node.url));add.onclick=()=>pickImage(node);row.append(url,add);article.append(row);const fetch=el('button','Fetch');fetch.className='fetch-one';fetch.setAttribute('aria-label','Fetch cover for '+(node.title || node.url));fetch.onclick=()=>coverFetch.request(node);article.append(fetch);}
function localScroll(){return Math.max(0,-$('pins').getBoundingClientRect().top);}
function columns(){const width=$('pins').clientWidth || 1100;return window.innerWidth<=540 ? 2 : Math.max(1,Math.min(5,Math.floor((width+22)/232)));}
function estimateBlocks(){const cols=columns();estimates=Array.from({length:Math.ceil(items.length/BATCH)},(_,i)=>Math.max(80,items.slice(i*BATCH,(i+1)*BATCH).reduce((sum,node)=>sum+(imageFor(node)?330:85),0)/cols));}
function prefix(sizes,index){return sizes.slice(0,index).reduce((a,b)=>a+b,0);}
function measure(){
  const oldPlan=visibleBlocks(items.length,limit,heights,estimates,localScroll(),window.innerHeight || 768);let changed=false;
  for(const [index,block] of blocks){const height=block.getBoundingClientRect().height;if(height>0 && Math.abs((heights.get(index) || estimates[index])-height)>1){heights.set(index,height);changed=true;}}
  if(changed){const plan=visibleBlocks(items.length,limit,heights,estimates,localScroll(),window.innerHeight || 768);const delta=prefix(plan.sizes,oldPlan.visible)-prefix(oldPlan.sizes,oldPlan.visible);if(Math.abs(delta)>1)window.scrollBy({top:delta,behavior:'instant'});}
}
function scheduleWindow(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;measure();renderWindow();});}
function renderWindow(){
  const plan=visibleBlocks(items.length,limit,heights,estimates,localScroll(),window.innerHeight || 768);
  // Move focus to the stable board container before removing its focused card.
  const focused=[...blocks].find(([,block])=>block.contains(document.activeElement));
  if(focused && (focused[0]<plan.first || focused[0]>=plan.last)){$('pins').tabIndex=-1;$('pins').focus({preventScroll:true});}
  for(const [index,block] of blocks)if(index<plan.first || index>=plan.last){resizeObserver?.unobserve(block);block.remove();blocks.delete(index);}
  for(let index=plan.first;index<plan.last;index++)if(!blocks.has(index)){
    const block=el('div');block.className='pin-block';for(const node of items.slice(index*BATCH,(index+1)*BATCH))block.append(card(node));blocks.set(index,block);resizeObserver?.observe(block);
  }
  topSpacer.style.height=plan.top+'px';bottomSpacer.style.height=plan.bottom+'px';
  const ordered=[...blocks].sort((a,b)=>a[0]-b[0]).map(([,block])=>block);
  // Move only when the block range changes; repeated scroll events keep existing image nodes.
  const wanted=[topSpacer,...ordered,bottomSpacer];const current=[...$('pins').children];
  if(current.length!==wanted.length || current.some((node,i)=>node!==wanted[i])){$('pins').replaceChildren(...wanted);scheduleWindow();}
  coverFetch.discover();
  const shown=Math.max(0,Math.min(items.length,plan.last*BATCH)-plan.first*BATCH);
  status(items.length ? `${items.length.toLocaleString()} bookmark${items.length===1?'':'s'} · Explore your collection` : 'No matching bookmarks. Try another collection or turn off the image filter.');
}
function resetBlocks(){for(const block of blocks.values())resizeObserver?.unobserve(block);blocks.clear();heights.clear();$('pins').replaceChildren();estimateBlocks();renderWindow();scheduleWindow();}
function render(){items=pinItems(roots,$('folder').value,$('search').value).filter(node=>!$('images-only').checked || imageFor(node));resetBlocks();}
// Update only the completed card: never reset virtual spacers or the scrolling window.
function updateCoverCard(node){
  const mounted=[...blocks.values()].flatMap(block=>[...block.children]);
  const old=mounted.find(element=>element.atlasNode?.id===node.id && element.atlasNode?.url===node.url);
  if(!old)return; // Offscreen cards use the saved cover when naturally rebuilt.
  const anchor=mounted.find(element=>element!==old && element.getBoundingClientRect().bottom>0);
  const anchorTop=anchor?.getBoundingClientRect().top;
  let expectedScroll=window.scrollY;
  const restore=()=>{
    // Do not pull the reader back if they scrolled while the image was decoding.
    if(window.scrollY!==expectedScroll || (anchor && !anchor.isConnected))return;
    measure();
    if(anchor){const delta=anchor.getBoundingClientRect().top-anchorTop;if(Math.abs(delta)>1)window.scrollBy({top:delta,behavior:'instant'});}
    expectedScroll=window.scrollY;
  };
  const replacement=card(node),img=replacement.querySelector('img');
  if(img){const loaded=img.onload;img.onload=()=>{loaded?.();restore();};const failed=img.onerror;img.onerror=()=>{failed?.();restore();};}
  old.replaceWith(replacement);restore();scheduleWindow();
}
async function saveSettings(){try{await chrome.storage.local.set({[PINBOARD_SETTINGS]:{version:1,limit,imagesOnly:$('images-only').checked}});}catch{status('PINBOARD_SETTINGS_SAVE_FAILED: Your current view still works; settings were not saved.');}}
function indexAssociations(data){
  const byResource=new Map(),result=new Map();
  for(const resource of Object.values(data?.resources || {}))if(resource.kind==='bookmark')for(const locator of resource.locators || [])if(locator.provider==='web'){
    const entry=result.get(locator.reference) || {note:'',tags:[],image:null};entry.note=resource.note || entry.note;entry.tags=[...new Set([...entry.tags,...(data.tags?.[resource.id] || [])])];result.set(locator.reference,entry);byResource.set(resource.id,entry);
  }
  for(const relation of data?.relations || []){const entry=byResource.get(relation.from),target=data.resources?.[relation.to];if(!entry || !target)continue;if(target.kind==='image' && !entry.image)entry.image=(target.locators || []).map(l=>l.provider==='web'?directImage(l.reference):null).find(Boolean) || null;if(target.kind==='note' && target.note)entry.note+=(entry.note?'\n\n':'')+target.note;}
  return result;
}
async function refresh(){
  try{
    const chosen=$('folder').value || 'all';roots=await chrome.bookmarks.getTree();covers=(await chrome.storage.local.get(COVER_KEY))[COVER_KEY] || {};
    $('folder').replaceChildren();const all=el('option','All bookmarks');all.value='all';$('folder').append(all);
    function folders(nodes,path=[]){for(const node of nodes)if(!node.url){const trail=[...path,node.title].filter(Boolean);if(node.id && node.parentId!==undefined){const option=el('option',trail.join(' / '));option.value=node.id;$('folder').append(option);}folders(node.children || [],trail);}}
    folders(roots);$('folder').value=chosen;if(!$('folder').value)$('folder').value='all';
    render();
  }catch{status('PINBOARD_READ_FAILED: Could not read bookmarks. Reload the extension and check bookmark permission.');}
}
$('folder').onchange=()=>{coverFetch.stop();render();$('pins').scrollIntoView({block:'start',behavior:'instant'});scheduleWindow();};let searchTimer;$('search').oninput=()=>{coverFetch.stop();clearTimeout(searchTimer);searchTimer=setTimeout(()=>render(),160);};
$('refresh').onclick=refresh;
$('images-only').onchange=()=>{render();$('pins').scrollIntoView({block:'start',behavior:'instant'});scheduleWindow();saveSettings();};
$('card-limit').onchange=()=>{limit=cardLimit($('card-limit').value);renderWindow();saveSettings();};
window.addEventListener('scroll',scheduleWindow,{passive:true});
window.addEventListener('resize',()=>{heights.clear();estimateBlocks();scheduleWindow();});
$('close').onclick=()=>$('detail').close();$('detail').addEventListener('close',()=>{$('detail-image').removeAttribute('src');if(!$('image-source').open)document.documentElement.removeAttribute('data-pin-open');});
$('replace-image').onclick=()=>pickImage(selected);
$('cancel-image').onclick=()=>$('image-source').close();
$('image-source').addEventListener('close',()=>{if(!$('detail').open)document.documentElement.removeAttribute('data-pin-open');});
$('upload-image').onclick=()=>{$('image-source').close();$('image-file').value='';$('image-file').click();};
async function saveImage(node,image){
  await navigator.locks.request('atlas-pages-v1',async()=>{const latest=(await chrome.storage.local.get(COVER_KEY))[COVER_KEY] || {};covers=setBookmarkCover(latest,node,image);await chrome.storage.local.set({[COVER_KEY]:covers});});
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
  getScope:()=>JSON.stringify([boardId,$('folder').value,$('search').value.trim()]),
  getNodes:()=>pinItems(roots,$('folder').value,$('search').value),
  getMounted:()=>[...blocks.values()].flatMap(block=>[...block.children].map(element=>({element,node:element.atlasNode}))),
  hasCover:node=>!!imageFor(node),raster:rasterImage,
  saveCover:async(node,image)=>navigator.locks.request('atlas-pages-v1',async()=>{
    const current=await chrome.bookmarks.get(node.id);if(current[0]?.url!==node.url)return false;
    const latest=(await chrome.storage.local.get(COVER_KEY))[COVER_KEY] || {};
    if(bookmarkCover(node,latest)){covers=latest;return false;}
    const next=setBookmarkCover(latest,node,image);await chrome.storage.local.set({[COVER_KEY]:next});covers=next;return true;
  }),
  onSaved:node=>updateCoverCard(node)
});
async function start(){
  try{const saved=(await chrome.storage.local.get(PINBOARD_SETTINGS))[PINBOARD_SETTINGS];limit=cardLimit(saved?.limit);$('card-limit').value=String(limit);$('images-only').checked=saved?.imagesOnly===true;}catch{}
  if('ResizeObserver' in window)resizeObserver=new ResizeObserver(scheduleWindow);
  await refresh();
  if(boardId){try{const board=boardRecord((await chrome.storage.local.get(PINBOARDS_KEY))[PINBOARDS_KEY]?.[boardId]);$('title').textContent=board.title;document.title=board.title+' · Atlas Pinboard';const exists=[...$('folder').options].some(o=>o.value===board.folderId);$('folder').value=exists?board.folderId:'all';if(!exists){items=[];resetBlocks();status('PINBOARD_FOLDER_MISSING: Choose another folder to browse.');}else render();}catch{items=[];resetBlocks();status('PINBOARD_NOT_FOUND: This saved pinboard is unavailable.');}}
  // Optional exact Atlas relationships; no network scraping or per-bookmark requests.
  try{const state=await chrome.runtime.sendMessage({type:'state'});if(state?.paired){const result=await chrome.runtime.sendMessage({type:'api',path:'/v1/catalog'});if(result?.data){associations=indexAssociations(result.data);render();}}}catch{}
}
start();
