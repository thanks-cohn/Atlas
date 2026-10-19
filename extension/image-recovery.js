import {createImageEntries,IMAGE_RECOVERY} from './image-entries.js';
const $=id=>document.getElementById(id),store=createImageEntries({storage:chrome.storage.local});
const make=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
let page=0,epoch=0;const size=20;
async function render(){const request=++epoch;try{const records=(await chrome.storage.local.get(IMAGE_RECOVERY))[IMAGE_RECOVERY] || [];if(request!==epoch)return;page=Math.min(page,Math.max(0,Math.ceil(records.length/size)-1));const list=$('image-recovery-list');list.replaceChildren();$('image-recovery-count').textContent=records.length+' recorded removals';
 for(const record of [...records].reverse().slice(page*size,(page+1)*size)){
  const item=make('article'),head=make('div'),title=make('h2',record.parent.title || 'Card image'),date=make('time',new Date(record.removedAt).toLocaleString());head.append(title,date);item.append(head);
  const origin=record.entry.origin || {};const location=origin.url || origin.path || origin.filename || 'Original location unavailable';item.append(make('p',location));
  const facts=make('dl');for(const [label,value] of [['SHA-256',origin.sha256 || 'Unavailable / not yet read'],['Image',record.imageReference?'URL reference retained':'Original file required; no backup copy'],['Notes',record.entry.notes.length],['Bookmarks',record.entry.bookmarks.length],['Your tags',record.entry.tags.join(', ') || 'None'],['State',record.state]]){facts.append(make('dt',label),make('dd',String(value)));}item.append(facts);
  const detail=make('details'),summary=make('summary','Connections & provenance'),pre=make('pre',JSON.stringify(record,null,2));detail.append(summary,pre);item.append(detail);
  const actions=make('div'),restore=make('button',record.state==='restored'?'Restored':'Restore Section'),download=make('button','Export JSON');restore.disabled=record.state==='restored';const feedback=make('p');feedback.setAttribute('role','status');
  restore.onclick=async()=>{restore.disabled=true;try{await store.restore(record.id);await render();}catch(error){feedback.textContent=error.message;restore.disabled=false;}};
  download.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'})),link=make('a');link.href=url;link.download='atlas-image-recovery-'+record.id+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};actions.append(restore,download);item.append(actions,feedback);list.append(item);
 }
 if(!records.length)list.append(make('p','Removed image sections will appear here.'));
 $('image-recovery-page').textContent=(page+1)+' / '+Math.max(1,Math.ceil(records.length/size));$('image-recovery-prev').disabled=page===0;$('image-recovery-next').disabled=(page+1)*size>=records.length;
 }catch(error){$('image-recovery-count').textContent=error.message || 'Recovery could not be loaded.';}}
$('image-recovery-prev').onclick=()=>{page=Math.max(0,page-1);render();};$('image-recovery-next').onclick=()=>{page++;render();};
$('image-recovery-open').onclick=()=>{document.body.classList.remove('bookmarks-mode');$('bookmarks-workspace').hidden=true;$('bookmarks-open').removeAttribute('aria-current');document.body.classList.add('image-recovery-mode');$('image-recovery-workspace').hidden=false;$('image-recovery-open').setAttribute('aria-current','page');render();};
function leave(){document.body.classList.remove('image-recovery-mode');$('image-recovery-workspace').hidden=true;$('image-recovery-open').removeAttribute('aria-current');}
for(const id of ['home','library','add-location','bookmarks-open','activity'])$(id).addEventListener('click',leave);$('roots').addEventListener('click',leave);
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local' && changes[IMAGE_RECOVERY] && document.body.classList.contains('image-recovery-mode'))render();});
