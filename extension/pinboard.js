import {PINBOARDS_KEY,BATCH,WINDOW,pinItems,boardRecord} from './pinboard-model.js';
import {COVER_KEY,bookmarkCover,setBookmarkCover,directImage} from './bookmark-covers.js';
import {publicImageURL} from './pages-store.js';
import {rasterImage} from './image-file.js';
const $=id=>document.getElementById(id),el=(tag,text='')=>{const node=document.createElement(tag);node.textContent=text;return node;};
let roots=[],covers={},items=[],offset=0,mounted=0,selected=null,associations=new Map(),observer;
const boardId=new URL(location.href).searchParams.get('id');
const status=text=>$('status').textContent=text;
function metadata(node){return associations.get(node.url) || {note:'',tags:[],image:null};}
function imageFor(node){const value=bookmarkCover(node,covers) || metadata(node).image;return value?.startsWith('data:')?value:publicImageURL(value);}
function link(node,label){const a=el('a',label);a.href=node.url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function pickImage(node){selected=node;$('image-file').value='';$('image-file').click();}
function openDetail(node){selected=node;$('detail-title').textContent=node.title || new URL(node.url).hostname;$('detail-image').src=imageFor(node);$('detail-image').alt=node.title || 'Bookmark image';$('detail-note').textContent=metadata(node).note;$('detail-link').href=node.url;$('detail-tags').replaceChildren(...metadata(node).tags.map(tag=>{const span=el('span',tag);span.className='tag';return span;}));document.documentElement.setAttribute('data-pin-open','');$('detail').showModal();}
function card(node){
  const article=el('article');article.className='pin';const image=imageFor(node);
  if(image){
    const button=el('button');button.className='pin-visual';button.setAttribute('aria-label','Preview '+(node.title || node.url));
    const img=el('img');img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.src=image;img.alt=node.title || '';button.append(img);button.onclick=()=>openDetail(node);
    img.onerror=()=>{article.replaceChildren();emptyCard(article,node);};
    const copy=el('div');copy.className='pin-copy';const title=link(node,node.title || new URL(node.url).hostname);title.className='pin-title';const url=link(node,new URL(node.url).hostname);url.className='pin-url';copy.append(title,url);article.append(button,copy);
  }else emptyCard(article,node);
  return article;
}
function emptyCard(article,node){const row=el('div');row.className='pin-empty';const url=link(node,node.url);url.className='pin-url';url.title=node.url;const add=el('button','+');add.setAttribute('aria-label','Add image to '+(node.title || node.url));add.onclick=()=>pickImage(node);row.append(url,add);article.append(row);}
function controls(){
  $('previous').disabled=offset===0;$('next').disabled=offset+WINDOW>=items.length;
  $('more').hidden=mounted>=WINDOW || offset+mounted>=items.length;
  status(items.length ? `${items.length.toLocaleString()} bookmarks · Showing ${offset+1}–${offset+mounted} · Images load as you browse` : 'No matching web bookmarks in this collection.');
}
function more(){const end=Math.min(mounted+BATCH,WINDOW,items.length-offset);const batch=document.createDocumentFragment();for(let i=mounted;i<end;i++)batch.append(card(items[offset+i]));$('pins').append(batch);mounted=end;controls();}
function render(reset=true){if(reset){offset=0;items=pinItems(roots,$('folder').value,$('search').value);}mounted=0;$('pins').replaceChildren();more();}
function move(direction){offset=Math.max(0,Math.min(offset+direction*WINDOW,Math.floor((items.length-1)/WINDOW)*WINDOW));render(false);$('pins').scrollIntoView({block:'start',behavior:'instant'});}
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
$('folder').onchange=()=>render();let searchTimer;$('search').oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>render(),160);};
$('more').onclick=more;$('previous').onclick=()=>move(-1);$('next').onclick=()=>move(1);$('refresh').onclick=refresh;
$('close').onclick=()=>$('detail').close();$('detail').addEventListener('close',()=>{$('detail-image').removeAttribute('src');document.documentElement.removeAttribute('data-pin-open');});
$('replace-image').onclick=()=>pickImage(selected);
$('image-file').onchange=async()=>{
  const file=$('image-file').files?.[0],node=selected;if(!file || !node)return;
  try{
    status('Preparing bookmark image…');
    const image=await rasterImage(file,60000);
    await navigator.locks.request('atlas-pages-v1',async()=>{const latest=(await chrome.storage.local.get(COVER_KEY))[COVER_KEY] || {};covers=setBookmarkCover(latest,node,image);await chrome.storage.local.set({[COVER_KEY]:covers});});
    if($('detail').open && selected?.id===node.id)$('detail-image').src=image;
    const count=mounted;mounted=0;$('pins').replaceChildren();while(mounted<count && mounted<WINDOW && offset+mounted<items.length)more();status('Bookmark image saved. The shelf and this pinboard use the same cover.');
  }catch(error){status((error.message || 'PINBOARD_IMAGE_FAILED')+': Image not added. Try a smaller image; existing bookmarks are unchanged.');}
};
async function start(){
  await refresh();
  if(boardId){try{const board=boardRecord((await chrome.storage.local.get(PINBOARDS_KEY))[PINBOARDS_KEY]?.[boardId]);$('title').textContent=board.title;document.title=board.title+' · Atlas Pinboard';const exists=[...$('folder').options].some(o=>o.value===board.folderId);$('folder').value=exists?board.folderId:'all';if(!exists){items=[];mounted=0;$('pins').replaceChildren();status('PINBOARD_FOLDER_MISSING: Choose another folder to browse.');}else render();}catch{items=[];mounted=0;$('pins').replaceChildren();status('PINBOARD_NOT_FOUND: This saved pinboard is unavailable.');}}
  if('IntersectionObserver' in window){observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting) && mounted<WINDOW && offset+mounted<items.length)more();},{rootMargin:'300px'});observer.observe($('sentinel'));}
  // Optional exact Atlas relationships; no network scraping or per-bookmark requests.
  try{const state=await chrome.runtime.sendMessage({type:'state'});if(state?.paired){const result=await chrome.runtime.sendMessage({type:'api',path:'/v1/catalog'});if(result?.data){associations=indexAssociations(result.data);const count=mounted;mounted=0;$('pins').replaceChildren();while(mounted<count && offset+mounted<items.length)more();}}}catch{}
}
start();
