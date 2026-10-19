import {createImageEntries,IMAGE_RECOVERY} from './image-entries.js';
const $=id=>document.getElementById(id),store=createImageEntries({storage:chrome.storage.local});
const make=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
let epoch=0,records=[];
const rowHeight=80,overscan=6;
const list=$('image-recovery-list'),dialog=$('image-recovery-dialog');
function visibleRange(total,top,height){const start=Math.min(Math.max(0,total-1),Math.max(0,Math.floor(top/rowHeight)-overscan));return [start,Math.min(total,start+Math.ceil(height/rowHeight)+overscan*2)];}
function draw(){
 const [start,end]=visibleRange(records.length,list.scrollTop,list.clientHeight || 480);
 const top=make('div'),bottom=make('div');top.style.height=start*rowHeight+'px';bottom.style.height=(records.length-end)*rowHeight+'px';
 list.replaceChildren(top);
 for(let index=start;index<end;index++){
  const record=records[index],item=make('button');item.type='button';item.className='recovery-row';
  item.setAttribute('aria-haspopup','dialog');item.setAttribute('aria-label',(record.parent.title || 'Card image')+'. Double-click to expand');
  const title=make('strong',record.parent.title || 'Card image'),summary=make('span',new Date(record.removedAt).toLocaleString()+' · '+record.state+' · '+(record.entry.origin?.filename || record.entry.origin?.url || record.entry.origin?.path || 'Image section'));
  item.append(title,summary);item.ondblclick=()=>expand(record);item.onkeydown=event=>{if(event.key==='Enter' || event.key===' '){event.preventDefault();expand(record);}};list.append(item);
 }
 list.append(bottom);if(!records.length)list.append(make('p','Removed image sections will appear here.'));
}
list.addEventListener('scroll',draw,{passive:true});
if(typeof ResizeObserver!=='undefined')new ResizeObserver(draw).observe(list);
$('image-recovery-close').onclick=()=>dialog.close();
dialog.addEventListener('close',()=>{$('image-recovery-detail').replaceChildren();});
async function render(){const request=++epoch;try{const saved=(await chrome.storage.local.get(IMAGE_RECOVERY))[IMAGE_RECOVERY] || [];if(request!==epoch)return;records=[...saved].reverse();$('image-recovery-count').textContent=records.length+' recorded removals';draw();
 }catch(error){$('image-recovery-count').textContent=error.message || 'Recovery could not be loaded.';}}
function expand(record){
 const detailRoot=$('image-recovery-detail');detailRoot.replaceChildren();
  const item=make('article'),head=make('div'),title=make('h2',record.parent.title || 'Card image'),date=make('time',new Date(record.removedAt).toLocaleString());head.append(title,date);item.append(head);
  const origin=record.entry.origin || {};const location=origin.url || origin.path || origin.filename || 'Original location unavailable';item.append(make('p',location));
  const facts=make('dl');for(const [label,value] of [['SHA-256',origin.sha256 || 'Unavailable / not yet read'],['Image',record.imageReference?'URL reference retained':'Original file required; no backup copy'],['Notes',record.entry.notes.length],['Bookmarks',record.entry.bookmarks.length],['Your tags',record.entry.tags.join(', ') || 'None'],['State',record.state]]){facts.append(make('dt',label),make('dd',String(value)));}item.append(facts);
  const detail=make('details'),summary=make('summary','Connections & provenance'),pre=make('pre',JSON.stringify(record,null,2));detail.append(summary,pre);item.append(detail);
  const actions=make('div'),restore=make('button',record.state==='restored'?'Restored':'Restore Section'),download=make('button','Export JSON');restore.disabled=record.state==='restored';const feedback=make('p');feedback.setAttribute('role','status');
  restore.onclick=async()=>{restore.disabled=true;try{await store.restore(record.id);dialog.close();await render();}catch(error){feedback.textContent=error.message;restore.disabled=false;}};
  download.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'})),link=make('a');link.href=url;link.download='atlas-image-recovery-'+record.id+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};actions.append(restore,download);item.append(actions,feedback);detailRoot.append(item);
 if(!dialog.open)dialog.showModal();
}
$('image-recovery-open').onclick=()=>{document.body.classList.remove('bookmarks-mode');$('bookmarks-workspace').hidden=true;$('bookmarks-open').removeAttribute('aria-current');document.body.classList.add('image-recovery-mode');$('image-recovery-workspace').hidden=false;$('image-recovery-open').setAttribute('aria-current','page');render();};
function leave(){if(dialog.open)dialog.close();document.body.classList.remove('image-recovery-mode');$('image-recovery-workspace').hidden=true;$('image-recovery-open').removeAttribute('aria-current');}
for(const id of ['home','add-location','bookmarks-open','activity'])$(id).addEventListener('click',leave);$('roots').addEventListener('click',leave);
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local' && changes[IMAGE_RECOVERY] && document.body.classList.contains('image-recovery-mode'))render();});
