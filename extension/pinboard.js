import {installBlankBoard} from './pinboard-blank.js';
import {installCoverFetch} from './fetch-covers.js';
import {PINBOARDS_KEY,PINBOARD_SETTINGS,BATCH,pinItems,boardRecord,cardLimit} from './pinboard-model.js';
import {COVER_KEY,bookmarkCover,setBookmarkCover,directImage} from './bookmark-covers.js';
import {publicImageURL} from './pages-store.js';
import {rasterImage} from './image-file.js';
const $=id=>document.getElementById(id),el=(tag,text='')=>{const node=document.createElement(tag);node.textContent=text;return node;};
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
  for(const tag of tags.slice(0,5)){const pill=el('span',tag);pill.className='pin-tag';pill.title=tag;strip.append(pill);}
  if(tags.length>5){const more=el('button','+'+(tags.length-5));more.className='pin-tag pin-tag-more';more.setAttribute('aria-label','Show all '+tags.length+' tags');more.onclick=()=>openDetail(node);strip.append(more);}
  return strip;
}
function openDetail(node){selected=node;$('detail-title').textContent=node.title || new URL(node.url).hostname;const image=imageFor(node);$('detail-image').hidden=!image;if(image)$('detail-image').src=image;else $('detail-image').removeAttribute('src');$('detail-image').alt=node.title || 'Bookmark image';$('detail-note').textContent=metadata(node).note;$('detail-link').href=node.url;$('detail-tags').replaceChildren(...tagsFor(node).map(tag=>{const span=el('span',tag);span.className='tag';return span;}));document.documentElement.setAttribute('data-pin-open','');$('detail').showModal();}
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
  status(items.length ? `${items.length.toLocaleString()} bookmark${items.length===1?'':'s'} · Explore your collection` : 'No matching bookmarks. Try another collection or turn off the image filter.');
}
function resetBlocks(){blocks.clear();$('pins').replaceChildren();renderWindow();}
function render(){const blank=$('folder').value==='blank';blankBoard.show(blank);$('pins').hidden=blank;$('fetch-dock').hidden=blank;$('status').hidden=blank;document.querySelector('.board-options').hidden=blank;if(blank){blocks.clear();$('pins').replaceChildren();return;}items=pinItems(roots,$('folder').value,$('search').value).filter(node=>!$('images-only').checked || imageFor(node));resetBlocks();}
function updateCoverCard(node){
  const block=[...blocks.values()].find(block=>[...block.children].some(element=>element.atlasNode?.id===node.id));if(!block)return;
  const old=[...block.children].find(element=>element.atlasNode.id===node.id);if(old.atlasNode.url!==node.url)return;
  const replacement=card(node);positionCard(replacement,positionById.get(node.id));old.replaceWith(replacement);scheduleWindow();
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
async function refreshAssociations(){
  // Tags belong to exact Atlas bookmark URLs; never infer tags from titles/domains.
  try{const state=await chrome.runtime.sendMessage({type:'state'});if(state?.paired){const result=await chrome.runtime.sendMessage({type:'api',path:'/v1/catalog'});if(result?.data)associations=indexAssociations(result.data);}}catch{}
}
async function refresh(){
  try{
    const chosen=$('folder').value || 'all';roots=await chrome.bookmarks.getTree();covers=(await chrome.storage.local.get(COVER_KEY))[COVER_KEY] || {};
    $('folder').replaceChildren();const blank=el('option','Create Blank');blank.value='blank';$('folder').append(blank);const all=el('option','All Bookmarks');all.value='all';$('folder').append(all);
    function folders(nodes,path=[]){for(const node of nodes)if(!node.url){const trail=[...path,node.title].filter(Boolean);if(node.id && node.parentId!==undefined){const option=el('option',trail.join(' / '));option.value=node.id;$('folder').append(option);}folders(node.children || [],trail);}}
    folders(roots);$('folder').value=chosen;if(!$('folder').value)$('folder').value='all';
    await refreshAssociations();render();
  }catch{status('PINBOARD_READ_FAILED: Could not read bookmarks. Reload the extension and check bookmark permission.');}
}
const blankBoard=installBlankBoard({scope:boardId || 'default',storage:chrome.storage.local,publicImageURL,rasterImage});
const fetchDock=$('fetch-dock');let hoverOpened=false;
fetchDock.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse' && !fetchDock.open){hoverOpened=true;fetchDock.open=true;}});
fetchDock.addEventListener('pointerleave',()=>{if(hoverOpened && !fetchDock.contains(document.activeElement)){fetchDock.open=false;hoverOpened=false;}});
fetchDock.addEventListener('focusout',()=>{setTimeout(()=>{if(hoverOpened && !fetchDock.contains(document.activeElement) && !fetchDock.matches(':hover')){fetchDock.open=false;hoverOpened=false;}},0);});
fetchDock.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();event.preventDefault();fetchDock.open=false;hoverOpened=false;fetchDock.querySelector('summary').focus();}});
$('folder').onchange=()=>{coverFetch.stop();render();$('pins').scrollIntoView({block:'start',behavior:'instant'});scheduleWindow();};let searchTimer;$('search').oninput=()=>{coverFetch.stop();clearTimeout(searchTimer);searchTimer=setTimeout(()=>render(),160);};
$('refresh').onclick=refresh;
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
  await refresh();
  if(boardId){try{const board=boardRecord((await chrome.storage.local.get(PINBOARDS_KEY))[PINBOARDS_KEY]?.[boardId]);$('title').textContent=board.title;document.title=board.title+' · Atlas Pinboard';const exists=[...$('folder').options].some(o=>o.value===board.folderId);$('folder').value=exists?board.folderId:'all';if(!exists){items=[];resetBlocks();status('PINBOARD_FOLDER_MISSING: Choose another folder to browse.');}else render();}catch{items=[];resetBlocks();status('PINBOARD_NOT_FOUND: This saved pinboard is unavailable.');}}

}
start();
