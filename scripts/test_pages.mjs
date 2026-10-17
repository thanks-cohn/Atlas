import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=name=>readFileSync(new URL('../extension/'+name,import.meta.url),'utf8');
const {DEMO_COLLECTION}=await import('data:text/javascript;base64,'+Buffer.from(read('gallery-demo.js')).toString('base64'));
const store=await import('data:text/javascript;base64,'+Buffer.from(read('pages-store.js')).toString('base64'));
const data={};const storage={get:async key=>({[key]:structuredClone(data[key])}),set:async value=>Object.assign(data,structuredClone(value))};
const id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',node={id:'17',url:'https://example.com/'};
let page=await store.createLinkedPage(storage,node,{title:'A considered collection'},id);
assert.equal(page.galleryStyle,'nocturne');
assert.equal(store.displayGalleryStyle(undefined),'nocturne');
for(const retired of ['atelier','fieldnotes']) { assert.equal(store.displayGalleryStyle(retired),'solstice'); assert.equal(store.validatePage({...page,galleryStyle:retired}).id,id); }
delete data[store.pageKey(id)].galleryStyle;
assert.equal((await store.readPage(storage,id)).galleryStyle,undefined);
assert.equal(page.template,'gallery');assert.equal((await store.linkedPages(storage,node))[0].id,id);
assert.equal((await store.linkedPages(storage,{...node,url:'https://other.example/'})).length,0);
await assert.rejects(()=>store.createLinkedPage(storage,node,{title:'Duplicate'},id),/ALREADY_EXISTS/);
const images=[{id:'local',sourceKind:'local',source:'data:image/webp;base64,AAAA',caption:'Local work'},{id:'remote',sourceKind:'url',source:'https://example.com/image.jpg',caption:'Remote work'}];
page=await store.updatePage(storage,id,{title:'My Gallery',text:'A story.',images,galleryStyle:'solstice'},1);
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
 append(...v){this.children.push(...v);}replaceChildren(...v){this.children=v;}setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];delete this[k];}hasAttribute(k){return Object.hasOwn(this.attrs,k);}
 scrollBy({top}){this.scrollTop=(this.scrollTop||0)+top;}scrollTo({top}){this.scrollTop=top;}
 addEventListener(k,fn){this.handlers[k]=fn;}focus(){}showModal(){this.open=true;}close(){this.open=false;this.handlers.close?.();}
}
const els=new Map(),events={};const document={body:new El('body'),documentElement:new El('html'),getElementById:id=>{if(!els.has(id))els.set(id,new El());return els.get(id);},createElement:tag=>new El(tag)};
let nativeFail=false;let sequence=0;const context={...store,DEMO_COLLECTION,withPageLock:fn=>fn(),rasterImage:async()=> 'data:image/webp;base64,BBBB',imageType:async()=> 'image/png',readLibraryPage:async()=>{throw Error('offline');},saveLibraryPage:async()=>{if(nativeFail)throw Object.assign(new Error('Connect companion'),{code:'LIBRARY_OFFLINE'});return {libraryRevision:1,location:'Atlas data folder'};},importOriginal:async()=>({id:'a'.repeat(64)}),document,chrome:{storage:{local:storage}},URL,location:{href:'chrome-extension://atlas/page.html?id='+id},crypto:{randomUUID:()=> 'bbbbbbbb-bbbb-bbbb-bbbb-'+String(++sequence).padStart(12,'0')},window:{scrollY:125,scrollTo:options=>{context.restoredScroll=options.top;},confirm:()=>true,addEventListener:(k,fn)=>events[k]=fn}};
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
// Style changes are presentation-only: identity, source and originals survive.
assert.throws(()=>store.validatePage({...saved,galleryStyle:'unknown-future'}),/INVALID/);
for (const style of store.GALLERY_STYLES) {
  nativeFail=false;els.get('cancel').onclick();els.get('edit').onclick();
  els.get('style-input').value=style;els.get('style-input').onchange();
  els.get('preview-tab').onclick();assert.equal(els.get('preview').hidden,false);
  assert.equal(els.get('preview-gallery').className,'collection-layout '+style);
  assert.equal(els.get('preview-title').textContent,saved.title);
  await els.get('editor').onsubmit({preventDefault(){}});
  const switched=await store.readPage(storage,id);
  assert.equal(switched.id,saved.id);assert.equal(switched.galleryStyle,style);
  assert.deepEqual(switched.images,saved.images);
  assert.equal(document.body.className,style);
  if(style==='nocturne') {
    const stage=els.get('gallery').children[0],image=stage.children[0].children[0];
    assert.equal(image.src,saved.images[0].source);
    els.get('gallery').children[1].children[0].onclick();
    assert.equal(image.src,saved.images.at(-1).source);
    els.get('gallery').onkeydown({key:'ArrowRight',preventDefault(){},stopPropagation(){}});
    assert.equal(image.src,saved.images[0].source);
  }
}
// Cancel a style change: cached and durable state must not be overwritten.
els.get('edit').onclick();els.get('style-input').value='solstice';els.get('cancel').onclick();
assert.equal((await store.readPage(storage,id)).galleryStyle,'nocturne');
// A 20-file batch can fill the remaining slots without the old per-image budget.
nativeFail=false;els.get('edit').onclick();
els.get('images-input').files=Array.from({length:20},(_,i)=>({size:1000,type:'image/png',name:'layout-'+i+'.png'}));
await els.get('images-input').onchange();
assert.match(els.get('import-status').textContent,/20 image/);
await els.get('editor').onsubmit({preventDefault(){}});
assert.equal((await store.readPage(storage,id)).images.length,24);
// Sample collection is a reversible draft; no upload or save occurs on load.
const beforeDemo=await store.readPage(storage,id);
els.get('edit').onclick();els.get('load-demo').onclick();
assert.equal(els.get('preview').hidden,false);
assert.equal(els.get('title-input').value,beforeDemo.title);
assert.equal(els.get('text-input').value,beforeDemo.text);
assert.equal(els.get('image-editor').children.length,24);
assert.deepEqual(await store.readPage(storage,id),beforeDemo);
els.get('cancel').onclick();assert.deepEqual(await store.readPage(storage,id),beforeDemo);
els.get('edit').onclick();els.get('load-demo').onclick();
els.get('style-input').value='solstice';els.get('style-input').onchange();
await els.get('editor').onsubmit({preventDefault(){}});
const demoSaved=await store.readPage(storage,id);assert.equal(demoSaved.images.length,24);
assert.equal(demoSaved.title,beforeDemo.title);assert.equal(demoSaved.galleryStyle,'solstice');
assert.ok(demoSaved.images.every(i=>i.article.split('\n\n').length===5));
assert.throws(()=>store.validatePage({...demoSaved,images:[{...demoSaved.images[0],article:'x'.repeat(20001)}]}),/INVALID/);
assert.ok(demoSaved.images.every(i=>i.sourceKind==='url'&&i.title&&i.caption&&i.source.startsWith('https://images.unsplash.com/')));
// Main Nocturne stage has no repeated text; image expansion reveals the full reading view.
els.get('edit').onclick();els.get('style-input').value='nocturne';
await els.get('editor').onsubmit({preventDefault(){}});
assert.equal(els.get('gallery').children.length,3);
assert.equal(els.get('gallery').children[0].children.length,1);
els.get('gallery').children[0].children[0].onclick();
assert.equal(els.get('viewer').open,true);
assert.equal(els.get('viewer-article').children.length,5);
assert.equal(els.get('viewer-article').children[0].textContent,DEMO_COLLECTION.images[0].article.split('\n\n')[0]);
assert.equal(els.get('viewer-caption').hidden,false);assert.equal(document.documentElement.attrs['data-reader-open'],'');
els.get('viewer').scrollTop=200;
els.get('next').onclick();assert.equal(els.get('viewer').scrollTop,0);
assert.equal(els.get('viewer-article').children[0].textContent,DEMO_COLLECTION.images[1].article.split('\n\n')[0]);
els.get('close-viewer').onclick();assert.equal(els.get('viewer').open,false);
assert.equal(document.documentElement.attrs['data-reader-open'],undefined);assert.equal(context.restoredScroll,125);
assert.match(els.get('reader-meta').textContent,/MIN READ/);
els.get('viewer').scrollTop=0;
els.get('viewer').handlers.keydown({key:'ArrowDown',preventDefault(){},stopPropagation(){}});
assert.equal(els.get('viewer').scrollTop,55);
els.get('viewer').handlers.keydown({key:'ArrowUp',preventDefault(){},stopPropagation(){}});
assert.equal(els.get('viewer').scrollTop,0);
console.log('PASS: gallery-page creation/linking, template default, edit conflicts, URL/local data, publishing readiness, source rejection and gallery editor/viewer (API/DOM doubles; Chrome rendering NOT_RUN).');

// Deletion survives library recovery and refuses stale or failed writes.
const deletionId='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
let deletable=await store.createLinkedPage(storage,node,{title:'Delete me'},deletionId);
await storage.set({[store.pageKey(deletionId)]:{...deletable,libraryRevision:3}});
await assert.rejects(()=>store.deletePage(storage,deletionId,0,async()=>({})),/CONFLICT/);
await assert.rejects(()=>store.deletePage(storage,deletionId,1,async()=>{throw new Error('offline')}),/offline/);
assert.equal((await store.readPage(storage,deletionId)).deleted,undefined);
const tombstone=await store.deletePage(storage,deletionId,1,async doc=>{assert.equal(doc.deleted,true);return {libraryRevision:4}});
assert.equal(tombstone.libraryRevision,4);
assert.ok(!(await store.linkedPages(storage,node)).some(p=>p.id===deletionId));
await assert.rejects(()=>store.updatePage(storage,deletionId,{title:'Resurrect',text:''},2),/NOT_FOUND/);

// The default gallery route opens a ready-made collection, then preserves edits on reopen.
const showcaseContext={...context,location:{href:'chrome-extension://atlas/page.html'}};
vm.runInNewContext(read('page.js').replace(/^import .*\n/gm,''),showcaseContext);
for(let i=0;i<5;i++)await tick();
const showcaseId='00000000-0000-4000-8000-000000000024';
assert.equal((await store.readPage(storage,showcaseId)).images.length,24);
assert.equal(els.get('title').textContent,DEMO_COLLECTION.images[0].title);
assert.equal(els.get('collection-label').textContent,DEMO_COLLECTION.title);
const showcaseGallery=els.get('gallery');
showcaseGallery.onkeydown({key:'ArrowRight',preventDefault(){},stopPropagation(){}});
assert.equal(els.get('title').textContent,DEMO_COLLECTION.images[1].title);
assert.equal(document.title,DEMO_COLLECTION.images[1].title+' · Atlas');
const customShowcase=await store.readPage(storage,showcaseId);
await storage.set({[store.pageKey(showcaseId)]:{...customShowcase,title:'My own showcase'}});
vm.runInNewContext(read('page.js').replace(/^import .*\n/gm,''),{...context,location:{href:'chrome-extension://atlas/page.html'}});
for(let i=0;i<5;i++)await tick();
assert.equal(els.get('title').textContent,DEMO_COLLECTION.images[0].title);
assert.equal(els.get('collection-label').textContent,'My own showcase');
assert.equal((await store.readPage(storage,id)).title,demoSaved.title);

assert.equal(els.get('gallery').children[0].children.length,1,'Focused stage contains only the image; no duplicate story text below the filmstrip');
assert.match(read('page.css'),/\.cinema-strip \{ scrollbar-width:none/);

// Legacy placeholder names are presentable without silently renaming saved data.
const legacy=await store.readPage(storage,showcaseId);
await storage.set({[store.pageKey(showcaseId)]:{...legacy,title:'Title',galleryStyle:'solstice'}});
vm.runInNewContext(read('page.js').replace(/^import .*\n/gm,''),{...context,location:{href:'chrome-extension://atlas/page.html'}});
for(let i=0;i<5;i++)await tick();
assert.equal(els.get('title').textContent,DEMO_COLLECTION.title);
assert.equal(els.get('image-count').textContent,'24 Stories');
assert.equal((await store.readPage(storage,showcaseId)).title,'Title');

// Escape closes the reader first, and presentation preview on the following Escape.
els.get('viewer').open=false;els.get('publish-dialog').open=false;
assert.equal(els.get('presentation-preview').hidden,false);
els.get('presentation-preview').onclick();
assert.ok(document.documentElement.hasAttribute('data-presentation-preview'));
els.get('viewer').open=true;
events.keydown({key:'Escape',preventDefault(){}});
assert.ok(document.documentElement.hasAttribute('data-presentation-preview'));
els.get('viewer').open=false;
events.keydown({key:'Escape',preventDefault(){}});
assert.ok(!document.documentElement.hasAttribute('data-presentation-preview'));
assert.ok(!read('page.html').includes('Story template'));

assert.equal(els.get('text').children.length,2);
assert.equal(els.get('text').children[0].textContent,DEMO_COLLECTION.text.split('\n\n')[0]);
assert.equal(els.get('text').children[1].textContent,DEMO_COLLECTION.text.split('\n\n')[1]);


// Both styles finish image motion before starting text; loading never reveals then hides.
const motionCalls=[];
const animate=(frames,options)=>{let resolve,reject;const finished=new Promise((yes,no)=>{resolve=yes;reject=no});finished.catch(()=>{});const animation={finished,cancelled:false,finish:resolve,cancel(){this.cancelled=true;reject(new Error('cancelled'));}};motionCalls.push({frames,options,animation});return animation;};
document.body.classList={contains:name=>name==='solstice'};
context.window.matchMedia=()=>({matches:false});
const hero=els.get('viewer-image');hero.complete=true;hero.naturalWidth=1200;hero.naturalHeight=800;
hero.getBoundingClientRect=()=>({left:100,top:200,width:900,height:600});hero.animate=animate;
els.get('viewer').animate=animate;els.get('viewer-article').animate=animate;
document.getElementById('viewer-reading').querySelector=()=>({animate});
const clicked=els.get('gallery').children[0].children[0],source=clicked.children[0];
source.naturalWidth=1200;source.naturalHeight=800;
source.getBoundingClientRect=()=>({left:20,top:50,width:300,height:250});
clicked.onclick();assert.equal(motionCalls.length,2);
assert.equal(els.get('viewer').attrs['data-opening'],'image');
motionCalls[0].animation.finish();await tick();assert.equal(motionCalls.length,4);
assert.equal(els.get('viewer').attrs['data-opening'],'text');
motionCalls[2].animation.finish();motionCalls[3].animation.finish();await tick();
assert.ok(!els.get('viewer').hasAttribute('data-opening'));
els.get('close-viewer').onclick();
document.body.classList={contains:name=>name==='nocturne'};
hero.complete=false;clicked.onclick();assert.equal(motionCalls.length,4);
assert.equal(els.get('viewer').attrs['data-opening'],'waiting');
const staleLoad=hero.handlers.load;hero.handlers.load();assert.equal(motionCalls.length,5);
assert.equal(motionCalls[4].options.duration,520);
assert.deepEqual(Object.keys(motionCalls[4].frames[0]),['opacity']);
motionCalls[4].animation.finish();await tick();assert.equal(motionCalls.length,7);
assert.equal(motionCalls[5].options.duration,380);
assert.equal(els.get('viewer').attrs['data-opening'],'text');
els.get('close-viewer').onclick();await tick();
assert.ok(!els.get('viewer').hasAttribute('data-opening'));staleLoad();assert.equal(motionCalls.length,7);
hero.complete=false;clicked.onclick();hero.handlers.error();assert.ok(!els.get('viewer').hasAttribute('data-opening'));
els.get('close-viewer').onclick();
context.window.matchMedia=()=>({matches:true});clicked.onclick();assert.equal(motionCalls.length,7);
assert.ok(!els.get('viewer').hasAttribute('data-opening'));
els.get('close-viewer').onclick();
