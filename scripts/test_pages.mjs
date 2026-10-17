import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=name=>readFileSync(new URL('../extension/'+name,import.meta.url),'utf8');
const store=await import('data:text/javascript;base64,'+Buffer.from(read('pages-store.js')).toString('base64'));
const data={};const storage={get:async key=>({[key]:structuredClone(data[key])}),set:async value=>Object.assign(data,structuredClone(value))};
const id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',node={id:'17',url:'https://example.com/'};
let page=await store.createLinkedPage(storage,node,{title:'A considered collection'},id);
assert.equal(page.template,'gallery');assert.equal((await store.linkedPages(storage,node))[0].id,id);
assert.equal((await store.linkedPages(storage,{...node,url:'https://other.example/'})).length,0);
await assert.rejects(()=>store.createLinkedPage(storage,node,{title:'Duplicate'},id),/ALREADY_EXISTS/);
const images=[{id:'local',sourceKind:'local',source:'data:image/webp;base64,AAAA',caption:'Local work'},{id:'remote',sourceKind:'url',source:'https://example.com/image.jpg',caption:'Remote work'}];
page=await store.updatePage(storage,id,{title:'My Gallery',text:'A story.',images},1);
assert.equal(page.revision,2);assert.equal((await store.readPage(storage,id)).images[1].source,images[1].source);
await assert.rejects(()=>store.updatePage(storage,id,{title:'Wrong overwrite',text:''},1),/CONFLICT/);
assert.equal((await store.readPage(storage,id)).title,'My Gallery');
assert.deepEqual(store.publicationReadiness(page),{localImages:1,referencedImages:1,requiresR2Transfer:true,deploymentAvailable:false});
for(const url of ['javascript:alert(1)','file:///private/image.png','data:text/html,hi','https://u:secret@example.com/a.png','https://example.com/a?X-Amz-Signature=secret'])assert.equal(store.publicImageURL(url),null);
assert.equal(store.publicImageURL('https://example.com/image?size=large'),'https://example.com/image?size=large');
assert.throws(()=>store.validatePage({...page,template:'horizons-v1'}),/INVALID/);
assert.throws(()=>store.validatePage({...page,images:[{...images[0],source:'data:image/svg+xml;base64,AAAA'}]}),/INVALID/);
assert.throws(()=>store.validatePage({...page,images:[images[0],images[0]]}),/INVALID/);
assert.throws(()=>store.pageKey('../secret'),/INVALID/);
class El {
 constructor(tag='div'){this.tagName=tag;this.children=[];this.hidden=false;this.value='';this.attrs={};this.handlers={};this.files=[];}
 append(...v){this.children.push(...v);}replaceChildren(...v){this.children=v;}setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];delete this[k];}
 addEventListener(k,fn){this.handlers[k]=fn;}focus(){}showModal(){this.open=true;}close(){this.open=false;this.handlers.close?.();}
}
const els=new Map(),events={};const document={getElementById:id=>{if(!els.has(id))els.set(id,new El());return els.get(id);},createElement:tag=>new El(tag)};
let nativeFail=false;let sequence=0;const context={...store,withPageLock:fn=>fn(),rasterImage:async()=> 'data:image/webp;base64,BBBB',imageType:async()=> 'image/png',readLibraryPage:async()=>{throw Error('offline');},saveLibraryPage:async()=>{if(nativeFail)throw Object.assign(new Error('Connect companion'),{code:'LIBRARY_OFFLINE'});return {libraryRevision:1,location:'Atlas data folder'};},importOriginal:async()=>({id:'a'.repeat(64)}),document,chrome:{storage:{local:storage}},URL,location:{href:'chrome-extension://atlas/page.html?id='+id},crypto:{randomUUID:()=> (++sequence===1?'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb':'cccccccc-cccc-cccc-cccc-cccccccccccc')},window:{addEventListener:(k,fn)=>events[k]=fn}};
vm.runInNewContext(read('page.js').replace(/^import .*\n/gm,''),context);
const tick=()=>new Promise(r=>setTimeout(r,0));await tick();
assert.equal(els.get('title').textContent,'My Gallery');assert.equal(els.get('gallery').children.length,2);
els.get('gallery').children[0].children[0].onclick();assert.equal(els.get('viewer').open,true);assert.equal(els.get('viewer-image').src,images[0].source);
els.get('next').onclick();assert.equal(els.get('viewer-image').src,images[1].source);
els.get('next').onclick();assert.equal(els.get('viewer-image').src,images[0].source);
els.get('close-viewer').onclick();assert.equal(els.get('viewer').open,false);
els.get('publishing-check').onclick();assert.match(els.get('publish-status').textContent,/1 local image/);assert.equal(els.get('publish-dialog').open,true);
els.get('edit').onclick();document.getElementById('image-url').value='javascript:alert(1)';els.get('add-url').onclick();assert.match(els.get('status').textContent,/INVALID/);
document.getElementById('image-url').value='https://other.example/art.png';els.get('add-url').onclick();
els.get('images-input').files=[{size:1,type:'image/png'}];await els.get('images-input').onchange();
els.get('title-input').value='<script>not executed</script>';
await els.get('editor').onsubmit({preventDefault(){}});
const saved=await store.readPage(storage,id);assert.equal(saved.images.length,4);assert.equal(saved.images[2].sourceKind,'url');assert.equal(saved.images[3].sourceKind,'local');
assert.equal(els.get('title').textContent,'<script>not executed</script>');assert.equal(els.get('editor').hidden,true);
assert.equal(els.get('gallery').children.length,4);
nativeFail=true;els.get('edit').onclick();els.get('title-input').value='Unsaved';await els.get('editor').onsubmit({preventDefault(){}});assert.equal(els.get('editor').hidden,false);assert.equal((await store.readPage(storage,id)).title,'<script>not executed</script>');assert.match(els.get('status').textContent,/LIBRARY_OFFLINE/);
console.log('PASS: gallery-page creation/linking, template default, edit conflicts, URL/local data, publishing readiness, source rejection and gallery editor/viewer (API/DOM doubles; Chrome rendering NOT_RUN).');
