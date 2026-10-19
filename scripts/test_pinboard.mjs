import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../extension/'+name,import.meta.url),'utf8');
const moduleOf=async name=>import('data:text/javascript;base64,'+Buffer.from(read(name)).toString('base64'));
const holdsModule=await moduleOf('pinboard-card-hold.js');
const model=await moduleOf('pinboard-model.js'),coversModule=await moduleOf('bookmark-covers.js');
const roots=[{id:'0',children:[{id:'1',parentId:'0',title:'Work',children:Array.from({length:1000},(_,i)=>({id:String(i+10),parentId:'1',title:'Bookmark '+i,url:'https://example.com/'+i+'.jpg'}))}]}];
assert.equal(model.pinItems(roots).length,1000);assert.equal(model.pinItems(roots,'missing').length,0);
assert.equal(model.pinItems([{id:'x',url:'javascript:alert(1)'}]).length,0);
assert.equal(model.pinItems([{id:'x',url:'https://u:p@example.com/'}]).length,0);
const data={},storage={get:async keys=>Object.fromEntries((Array.isArray(keys)?keys:[keys]).map(key=>[key,data[key]])),set:async v=>Object.assign(data,v)};
const node={id:'10',url:'https://example.com/0.jpg'},id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
await model.createPinboard(storage,node,'Research',id,'1');assert.equal((await model.linkedPinboards(storage,node))[0].folderId,'1');
assert.equal((await model.linkedPinboards(storage,{...node,url:'https://changed.example/'})).length,0);
await model.removePinboard(storage,id);assert.equal((await model.linkedPinboards(storage,node)).length,0);

const animations=[],motionFinishes=[];
let previewContent,tagEditorNode,previewOptions;
let holdImpl={hold(){},touch(){},active:()=>[],clear(){}};
let blankOptions,blankImpl={show(){},load:async()=>{},nodes:()=>[]};
let scroll=0,fetchOptions,tagEditorOptions;const frames=[];const listeners={};
class El{
 constructor(tag='div'){this.tag=tag;this.children=[];this.value='';this.attrs={};this.handlers={};this.hidden=false;this.style={};this.classList={add:name=>this.ready=name};this.clientWidth=1100;}
 append(...nodes){for(const node of nodes)if(node.tag==='fragment')this.children.push(...node.children);else{if(node.parent)node.parent.children=node.parent.children.filter(child=>child!==node);this.children.push(node);node.parent=this;}}
 insertBefore(node,before){if(node.parent)node.remove();const index=this.children.indexOf(before);node.parent=this;this.children.splice(index,0,node);}
 replaceChildren(...nodes){for(const child of this.children)child.parent=null;this.children=[];this.append(...nodes);}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);this.parent=null;}
 animate(frames,options){animations.push({card:this,frames,options});let finish;const finished=new Promise(resolve=>finish=resolve);motionFinishes.push(finish);return {finished,cancel(){finish();}};}
 get isConnected(){let root=this;while(root.parent)root=root.parent;return root===document.body || root===document.documentElement || root===elements.get('pins');}
 querySelector(tag){for(const child of this.children){if(child.tag===tag)return child;const found=child.querySelector(tag);if(found)return found;}return null;}
 replaceWith(node){const index=this.parent.children.indexOf(this);node.parent=this.parent;this.parent.children[index]=node;this.parent=null;}
 contains(){return false;}focus(){}
 getBoundingClientRect(){const top=this===elements.get('pins')?-scroll:this.className==='pin'?(parseFloat(this.style.top)||0)-scroll:0;const height=this.className==='pin'?(parseFloat(this.style.height)||800):800;return {top,bottom:top+height,height};}
 get options(){return this.children;}
 setAttribute(k,v){this.attrs[k]=v;} removeAttribute(k){delete this.attrs[k];}
 addEventListener(k,fn){this.handlers[k]=fn;}showModal(){this.open=true;}close(){this.open=false;this.handlers.close?.();}
 scrollIntoView(){scroll=0;}click(){this.onclick?.();}
}
const elements=new Map();const document={querySelector:()=>new El(),getElementById:id=>{if(!elements.has(id))elements.set(id,new El());return elements.get(id);},createElement:tag=>new El(tag),createDocumentFragment:()=>new El('fragment'),documentElement:new El()};
const {publicImageURL}=await moduleOf('pages-store.js');
const {generateModels,generatedTags,mergeGeneratedRun,tagKey,checkpointTags}=await moduleOf('pinboard-generation.js');
const galleryModule=await import('../extension/image-entries.js');
const context={installSourceNavigation:()=>{},...galleryModule,structuredClone,crypto,createImageEntries:options=>galleryModule.createImageEntries({...options,lock:fn=>fn()}),heldMasonry:holdsModule.heldMasonry,createCardHold:()=>new Proxy({},{get:(_,key)=>holdImpl[key]}),connectionWriter:()=>async()=>{},installPreviewSections:options=>{previewOptions=options;return {setContent:(key,value)=>previewContent={key,...value}};},TAG_VOCABULARY:'atlas-tag-vocabulary-v1',removeBookmarkTag:async()=>{throw Error('Unexpected human mutation');},generateModels,generatedTags,mergeGeneratedRun,tagKey,checkpointTags,imageReference:async source=>source,generationImage:async()=> 'data:image/png;base64,AA==',installTagEditor:options=>{tagEditorOptions=options;return node=>{tagEditorNode=node;};},installBlankBoard:options=>{blankOptions=options;return new Proxy({},{get:(_,key)=>blankImpl[key]});},installCoverFetch:options=>{fetchOptions=options;return {discover(){},stop(){},request(){}};},publicImageURL,...model,...coversModule,document,URL,location:{href:'chrome-extension://atlas/pinboard.html'},window:{get scrollY(){return scroll;},innerWidth:1200,addEventListener:(name,fn)=>{const previous=listeners[name];listeners[name]=previous?event=>{previous(event);fn(event);}:fn;},scrollBy:({top})=>scroll+=top},requestAnimationFrame:fn=>{frames.push(fn);return frames.length;},setTimeout,clearTimeout,navigator:{locks:{request:async(_,fn)=>fn()}},rasterImage:async()=>'',chrome:{bookmarks:{getTree:async()=>roots,get:async id=>roots[0].children[0].children.filter(node=>node.id===id)},storage:{local:storage},runtime:{sendMessage:async()=>({paired:false})}}};
vm.runInNewContext(read('pinboard.js').replace(/^import .*\n/gm,''),context);
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));await tick();await tick();
const $=id=>document.getElementById(id),cards=()=>$('pins').children.filter(el=>el.className==='pin-block').flatMap(el=>el.children);
const flush=()=>{const work=frames.splice(0);for(const fn of work)fn();};
flush();assert.equal(cards().length,72);
const originalCard=cards()[0];
scroll=12000;listeners.scroll();flush();assert.ok(cards().length<=72);assert.ok(!cards().includes(originalCard));
assert.ok(parseFloat($('pins').children[0].style.height)>0);
scroll=0;listeners.scroll();flush();assert.equal(cards().length,72);assert.notEqual(cards()[0],originalCard);
$('card-limit').value='24';$('card-limit').onchange();await tick();assert.equal(cards().length,24);assert.equal(data[model.PINBOARD_SETTINGS].limit,24);
const pin=cards()[0];assert.equal(pin.children[0].children[0].loading,'lazy');
assert.equal(pin.children[0].children[1].className,'pin-loading');
pin.children[0].children[0].onload();assert.equal(pin.children[0].ready,'is-ready');
vm.runInContext("metadataState='ready'",context);await pin.children[0].onclick();assert.equal($('detail').open,true);assert.equal($('detail-link').href,node.url);
$('close').onclick();assert.equal($('detail').open,false);delete data[galleryModule.IMAGE_ENTRIES];await vm.runInContext('imageEntries.load()',context);
assert.equal(pin.children[1].children[0].href,node.url);
roots[0].children[0].children[0].url='https://example.com/plain';await $('refresh').onclick();
const narrow=cards()[0].children[0];assert.equal(narrow.className,'pin-empty');assert.equal(narrow.children[1].textContent,'+');
narrow.children[1].onclick();assert.equal($('image-source').open,true);
$('cover-url').value='javascript:alert(1)';await $('save-image-url').onclick();assert.match($('image-status').textContent,/HTTP/);
$('cover-url').value='https://example.com/cover.webp';await $('save-image-url').onclick();assert.equal($('image-source').open,false);
assert.equal(data[coversModule.COVER_KEY]['10'].image,'https://example.com/cover.webp');
assert.equal(coversModule.bookmarkCover(roots[0].children[0].children[0],data[coversModule.COVER_KEY]),'https://example.com/cover.webp');
$('images-only').checked=true;$('images-only').onchange();await tick();assert.ok(!cards().some(card=>card.children[0].className==='pin-empty'));assert.match($('status').textContent,/1,000 bookmarks/);
assert.equal(data[model.PINBOARD_SETTINGS].imagesOnly,true);
// Remember intrinsic ratios across eviction rather than collapsing to unknown lazy height.
const geometryCard=cards()[0],geometryImage=geometryCard.children[0].children[0];
geometryImage.naturalWidth=1200;geometryImage.naturalHeight=800;geometryImage.onload();
assert.equal(geometryCard.children[0].style.aspectRatio,'1200 / 800');
scroll=12000;listeners.scroll();flush();scroll=0;listeners.scroll();flush();
assert.equal(cards()[0].children[0].style.aspectRatio,'1200 / 800');
// A retrieved cover replaces its own card, retaining neighbors, spacer and scroll.
$('images-only').checked=false;
const fetched=roots[0].children[0].children[1];fetched.url='https://example.com/missing-cover';
await $('refresh').onclick();flush();
const before=cards(),spacer=$('pins').children[0];scroll=155;
assert.equal(await fetchOptions.saveCover(fetched,'https://example.com/fetched.webp'),true);
fetchOptions.onSaved(fetched);
const after=cards();assert.notEqual(after[1],before[1]);assert.equal(after[0],before[0]);assert.equal(after[2],before[2]);assert.equal($('pins').children[0],spacer);assert.equal(scroll,155);
after[1].children[0].children[0].onload();assert.equal(scroll,155);flush();assert.equal(scroll,155);
// Offscreen successes do not rebuild the current view.
const visible=cards();fetchOptions.onSaved(roots[0].children[0].children[900]);assert.deepEqual(cards(),visible);
// Real layout coordinates, not remote batches, decide which cards stay mounted.
for(let i=0;i<roots[0].children[0].children.length;i++)roots[0].children[0].children[i].url='https://example.com/'+i+(i%3===0?'.jpg':'/page');
await $('refresh').onclick();
for(const cap of [24,48,72,96,144]){
 $('card-limit').value=String(cap);$('card-limit').onchange();
 for(const top of [0,300,12000,6000,900,3000,0]){
  scroll=top;listeners.scroll();flush();
  const visible=vm.runInNewContext('positions.filter(p=>p.y+p.height>=localScroll() && p.y<=localScroll()+(window.innerHeight || 768)).map(p=>p.node.id)',context);
  const mounted=new Set(cards().map(card=>card.atlasNode.id));assert.ok(cards().length<=Math.max(cap,visible.length));
  assert.ok(cards().every(card=>parseFloat(card.style.width)<=260),'Cards should remain compact');
  for(const id of visible)assert.ok(mounted.has(id),'Visible card '+id+' missing at '+top+' cap '+cap);
  assert.ok(cards().some(card=>{const r=card.getBoundingClientRect();return r.bottom>=0 && r.top<=768;}),'Empty viewport at '+top);
 }
}
// Pointer hover has a native click/keyboard fallback; leaving doesn't trap the dock open.
const dock=$('fetch-dock');dock.handlers.pointerenter({pointerType:'mouse'});assert.equal(dock.open,true);dock.handlers.pointerleave();assert.equal(dock.open,false);
dock.handlers.pointerenter({pointerType:'touch'});assert.equal(dock.open,false);
// Exact Atlas bookmark tags appear on image and URL-only cards, safely and bounded.
const taggedImage=roots[0].children[0].children[0],taggedURL=roots[0].children[0].children[1];
const tagCatalog={resources:{r:{id:'r',kind:'bookmark',locators:[{provider:'web',reference:taggedImage.url}]},q:{id:'q',kind:'bookmark',locators:[{provider:'web',reference:taggedURL.url}]}},relations:[],tags:{r:['Design','Travel','Art','<img src=x onerror=alert(1)>','Architecture','Photography','Ideas','Design',' Travel '],q:['Notes','Personal']}};
context.chrome.runtime.sendMessage=async message=>message.type==='state'?{paired:true}:{data:tagCatalog};
await $('refresh').onclick();flush();
let tagged=cards()[0],strip=tagged.children[1].children[2];assert.equal(strip.className,'pin-tags');assert.equal(strip.children.length,6);assert.equal(strip.children[3].children[0].textContent,'<img src=x onerror=alert(1)>');assert.equal(strip.children[5].textContent,'+2');
assert.equal(tagged.children[1].style.height,'138px');
await strip.children[5].onclick();assert.equal($('detail').open,true);assert.equal($('detail-tags').children.length,7);assert.ok($('detail-tags').children.every(chip=>chip.className.includes('human-tag')));$('preview-add-tag').onclick();assert.equal(tagEditorNode.parentNode.id,taggedImage.id,'Preview Add Tag reuses the existing picker for the current card');$('close').onclick();delete data[galleryModule.IMAGE_ENTRIES];await vm.runInContext('imageEntries.load()',context);
const urlTags=cards()[1].children.at(-1);assert.equal(urlTags.className,'pin-tags');assert.equal(urlTags.children.length,2);
// Refresh retrieves edits to the existing catalog rather than requiring a new tab.
tagCatalog.tags.r=['Updated'];await $('refresh').onclick();flush();assert.equal(cards()[0].children[1].children[2].children[0].children[0].textContent,'Updated');
// Window calculation stays bounded at any position, including huge scroll jumps and boundaries.
for(const limit of [24,48,72,96,144])for(const top of [0,1,5000,1e8]){
 const plan=model.visibleBlocks(1000,limit,new Map(),[],top);
 assert.ok((plan.last-plan.first)*model.BATCH<=limit);assert.ok(plan.first>=0);assert.ok(plan.last<=Math.ceil(1000/model.BATCH));
}
const coverage=model.visibleBlocks(240,72,new Map(Array.from({length:10},(_,i)=>[i,100])),[],150,250);
assert.equal(coverage.first,1);assert.equal(coverage.last,4);assert.equal(coverage.top,100);
assert.ok(coverage.top<=150);assert.ok(coverage.sizes.slice(0,coverage.last).reduce((a,b)=>a+b,0)>=400);
assert.equal(model.cardLimit(100000),72);assert.equal(model.visibleBlocks(0,72,new Map(),[],0).last,0);
console.log('PASS: 1,000-bookmark viewport-first window, compact widths independent of buffer budget, eviction/rebuild, bounded overscan, loading geometry, filter persistence and source/preview safety. DOM/API doubles; Chrome hardware QA NOT_RUN.');

// Highlighted tags reorder without hiding; explicit search filters within them.
assert.deepEqual(model.tagQuery('mountains tags:Design,Travel'),{text:'mountains',tags:['Design','Travel']});
assert.deepEqual(model.tagQuery('tags:Design, Travel mountains'),{text:'mountains',tags:['Design','Travel']});
assert.deepEqual(model.tagQuery('tags:Design tags:Design,Art'),{text:'',tags:['Design','Art']});
tagCatalog.tags.r=['Art','Design'];tagCatalog.tags.q=['Art'];await $('refresh').onclick();flush();
const imageTags=cards()[0].children[1].children[2];imageTags.children[0].children[0].onclick();
assert.equal(vm.runInContext('highlightedTags.size',context),1);
const otherTag=cards()[0].children[1].children[2].children[1];otherTag.children[0].onclick();
flush();assert.equal(vm.runInContext('items.length',context),1000);assert.equal(cards().length,144);assert.equal(cards()[0].atlasNode.id,taggedImage.id);
assert.equal($('active-tags').children.length,3);
// A normal text query is intersected with ALL selected tags.
$('search').value='not-found';vm.runInContext('render()',context);assert.equal(cards().length,0);
$('search').value='';vm.runInContext('render()',context);assert.equal(cards().length,144);assert.equal(vm.runInContext('items.length',context),1000);
// Clicking active Design broadens automatically to both Art bookmarks.
cards()[0].children[1].children[2].children[1].children[0].onclick();assert.equal(cards().length,144);assert.equal(vm.runInContext('items.length',context),1000);
$('search').value='tag:Design';vm.runInContext('render()',context);assert.equal(vm.runInContext('items.length',context),1000);assert.equal(cards()[0].atlasNode.id,taggedImage.id);
$('active-tags').children.at(-1).onclick();assert.equal(cards().length,144);assert.equal(vm.runInContext('items.length',context),1000);
$('tags-only').checked=true;$('tags-only').onchange();await tick();assert.equal(cards().length,2);assert.equal(data[model.PINBOARD_SETTINGS].tagsOnly,true);
assert.equal(fetchOptions.getNodes().length,2);
console.log('PASS: highlighted tags prioritize without hiding, typed tag ranking, chip removal, tag clauses, ordinary text filtering and tagged-only persistence.');

// Highlighting is immediately additive ranking, not an implicit search or save.
$('tags-only').checked=false;vm.runInContext("highlightedTags.clear();$('search').value='';render()",context);
tagCatalog.tags.q=['Second Only'];await $('refresh').onclick();flush();
const priorNodes=vm.runInContext('items.map(node=>node.id)',context);
const secondPair=cards().find(card=>card.atlasNode.id===taggedURL.id).children.at(-1).children[0];
secondPair.children[0].onclick();flush();
assert.equal(vm.runInContext('items[0].id',context),taggedURL.id);
assert.equal(vm.runInContext('items.length',context),1000);
assert.equal($('active-tags').children[0].textContent,'Prioritizing');
assert.deepEqual(Array.from(vm.runInContext('items.slice(1).map(node=>node.id)',context)),Array.from(priorNodes).filter(id=>id!==taggedURL.id));
$('search').value='tag:Second';vm.runInContext('render()',context);assert.equal(vm.runInContext('items.length',context),1000);
$('search').value='Bookmark';vm.runInContext('render()',context);assert.equal(vm.runInContext('items.length',context),1000);
$('search').value='';vm.runInContext('render()',context);assert.equal(vm.runInContext('items.length',context),1000);
$('active-tags').children.at(-1).onclick();assert.deepEqual(Array.from(vm.runInContext('items.map(node=>node.id)',context)),Array.from(priorNodes));
tagCatalog.tags.q=['Art'];
console.log('PASS: selecting a tag on a later card moves all matches first, preserves all other cards in stable order, ordinary text search filters without making tag clauses restrictive and clearing selection restores order.');

// Cover storage is a shared persisted setting, independent of visible card budget.
$('cover-budget').value='128';await $('save-cover-budget').onclick();assert.equal(data[coversModule.COVER_BUDGET_KEY],128);assert.match($('cover-usage').textContent,/128 MiB limit/);
$('cover-budget').value='0';await $('save-cover-budget').onclick();assert.equal(data[coversModule.COVER_BUDGET_KEY],128);assert.match($('cover-budget-status').textContent,/8 to 512/);
$('cover-budget').value='64';await $('save-cover-budget').onclick();
assert.match(read('pinboard.html'),/value="all" selected/);
context.crypto={randomUUID:()=> 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'};
$('new-pinboard').onclick();assert.equal($('new-board-dialog').open,true);
$('new-board-title').value='My new board';await $('new-board-form').onsubmit({preventDefault(){}});
assert.equal(data[model.PINBOARDS_KEY]['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'].folderId,'blank');assert.match(context.location.href,/id=bbbb/);
const repeats=[{id:'root',children:[{id:'f1',children:[{id:'a',title:'First',url:'https://example.com/item'}]},{id:'f2',children:[{id:'b',title:'Second',url:'https://example.com/item'},{id:'c',title:'Other query',url:'https://example.com/item?x=1'},{id:'d',title:'Fragment',url:'https://example.com/item#part'}]}]}];
assert.equal(model.pinItems(repeats,'all').length,3);assert.equal(model.pinItems(repeats,'f2').length,3);assert.equal(model.pinItems(repeats,'all','Second')[0].id,'b');

assert.deepEqual(model.tagQuery('tag:Art,Design mountains'),{text:'mountains',tags:['Art','Design']});
// No temporary paired token must not suppress the read that can reconnect natively.
let catalogReads=0,stateReads=0;
context.chrome.runtime.sendMessage=async message=>{if(message.type==='state'){stateReads++;return {paired:false};}catalogReads++;return {data:tagCatalog};};
vm.runInContext("highlightedTags.clear();$('search').value='tag:art';$('tags-only').checked=false",context);
await $('refresh').onclick();assert.ok(catalogReads>0);assert.equal(stateReads,0);assert.equal(vm.runInContext('items.length',context),1000);assert.equal($('tag-browser').hidden,false);assert.ok(!read('pinboard.html').includes('apply-tags'));
// Empty/unavailable metadata does not leave a useless empty palette or imply no saved tags exist.
context.chrome.runtime.sendMessage=async()=>({ok:false,error:{code:'NEEDS_PAIRING'}});
vm.runInContext('associations=new Map()',context);await $('refresh').onclick();assert.equal($('tag-browser').hidden,false);assert.match($('tag-field').children[0].textContent,/Connect your companion/);

// Metadata saves preserve image nodes and neighboring cards instead of resetting the board.
context.chrome.runtime.sendMessage=async()=>({data:tagCatalog});
vm.runInContext("highlightedTags.clear();$('search').value='';$('tags-only').checked=false",context);
await $('refresh').onclick();flush();const stable=cards(),stableImage=stable[0].children[0].children[0];
vm.runInContext('tagsChangedURL=items[0].url',context);tagCatalog.tags.r=['Art','Updated'];await tagEditorOptions.onChanged(tagCatalog);flush();
assert.equal(cards()[0],stable[0]);assert.equal(cards()[0].children[0].children[0],stableImage);assert.equal(cards()[1],stable[1]);
assert.ok(cards()[1].children.some(c=>c.className.includes('empty-tag-edit')));

// Minimal preview controls: explicit inference, Settings gate and no startup model jobs.
const previousGet=context.chrome.storage.local.get;
context.chrome.storage.local.get=async keys=>Array.isArray(keys)?Object.assign({},...await Promise.all(keys.map(key=>previousGet(key)))):previousGet(keys);
vm.runInContext('openDetail(items[0])',context);await tick();await tick();
assert.equal($('tag-anime-wrap').hidden,true);assert.equal($('tag-anime-choice').checked,false);
assert.equal($('tag-image-choice').checked,true);assert.equal($('tag-people-choice').checked,true);
let generationRequests=0;const send=context.chrome.runtime.sendMessage;context.chrome.runtime.sendMessage=async message=>{generationRequests++;return send(message);};
assert.equal(generationRequests,0);
context.chrome.runtime.sendMessage=async message=>{generationRequests++;assert.equal(message.path,'/v1/tag-image');return {data:{source:message.body.model,model:'test',suggestions:[]}};};
await $('run-image-tagging').onclick();assert.equal(generationRequests,1);assert.equal($('tagging-selection-status').textContent,'Tags generated.');
$('joytag-enabled').checked=true;await $('joytag-enabled').onchange();assert.equal(data['atlas-joytag-enabled-v1'],true);assert.equal($('tag-anime-wrap').hidden,false);
$('tag-anime-choice').checked=true;await $('tag-anime-choice').handlers.change();
assert.equal(data['atlas-tagging-studio-layout-v1'][vm.runInContext('itemKey(selected)',context)].anime,true);
$('close').onclick();vm.runInContext('openDetail(items[0])',context);await tick();await tick();assert.equal($('tag-anime-choice').checked,true);
$('joytag-enabled').checked=false;await $('joytag-enabled').onchange();assert.equal($('tag-anime-wrap').hidden,true);assert.equal($('tag-anime-choice').checked,false);
for(const id of ['tag-image-choice','tag-people-choice'])$(id).checked=false;
await $('tag-people-choice').handlers.change();assert.equal($('run-image-tagging').disabled,true);
const previewMarkup=read('pinboard.html').split('<dialog id="detail"')[1].split('<dialog id="image-source"')[0];
assert.ok(previewMarkup.includes('> Anime</label>'));assert.ok(!previewMarkup.includes('JoyTag'));assert.ok(!previewMarkup.includes('detail-preview-tags'));
console.log('PASS: compact preview model choices, Settings-only JoyTag gate, preference restore, empty selection and explicit generation and no automatic model requests.');
// Successful generation attaches a derived tag to the existing card and filters,
// without promoting machine output into the human catalog or replacing images.
vm.runInContext("highlightedTags.clear();$('search').value='';$('tags-only').checked=false",context);
await $('refresh').onclick();flush();
const machineCard=cards()[0],machineImage=machineCard.children[0].children[0];
vm.runInContext('openDetail(items[0])',context);await tick();await tick();
const humanBefore=JSON.stringify(tagCatalog);
context.chrome.runtime.sendMessage=async()=>({ok:true,source:'objects',model:'test',image_payload_sha256:'payload',suggestions:[{tag:'Machine Cat',score:.9},{tag:'Art',score:.8}]});
$('tag-image-choice').checked=true;$('tag-people-choice').checked=false;
await $('run-image-tagging').onclick();flush();
assert.equal(cards()[0],machineCard);assert.equal(cards()[0].children[0].children[0],machineImage);
const derived=vm.runInContext('tagsFor(items[0])',context);
assert.ok(derived.includes('Machine Cat'));assert.equal(derived.filter(tag=>tag.toLowerCase()==='art').length,1);
assert.equal(JSON.stringify(tagCatalog),humanBefore);
await vm.runInContext('showGeneratedTags(selected)',context);
assert.ok($('detail-generated-tags').children.length>0);assert.ok($('detail-generated-tags').children.every(chip=>chip.className.includes('preview-tag-pair') && !chip.className.includes('human-tag')),'Generated chips join the field directly without a heading, and keep distinct presentation');
$('search').value='tag:Machine Cat';
// Exercise the tag predicate directly: whitespace search grammar is independent.
assert.equal(vm.runInContext("tagsFor(items[0]).includes('Machine Cat')",context),true);
console.log('PASS: generated tags appear immediately on stable bookmark cards, participate in filtering, deduplicate human labels and leave human metadata unchanged.');

assert.ok(data['atlas-tag-vocabulary-v1'].includes('Machine Cat'));
const rawBefore=JSON.stringify(data['atlas-image-tagging-runs-v1']);
const tagPair=machineCard.children[1].children.find(e=>e.className==='pin-tags').children.find(e=>e.children[0]?.textContent==='Machine Cat');
assert.equal(tagPair.children[1].textContent,'×');
await tagPair.children[1].onclick({stopPropagation(){}});flush();
assert.ok(!vm.runInContext('tagsFor(selected)',context).includes('Machine Cat'));
assert.equal(JSON.stringify(data['atlas-image-tagging-runs-v1']),rawBefore);
assert.ok(data['atlas-tag-vocabulary-v1'].includes('Machine Cat'));
await $('refresh').onclick();
assert.ok(!vm.runInContext('tagsFor(selected)',context).includes('Machine Cat'));
assert.equal(JSON.stringify(tagCatalog),humanBefore);
console.log('PASS: trailing × removes only this card, persists after reload, retains dropdown vocabulary and leaves original predictions intact.');
// Separate clicks accumulate at the real UI save boundary, including different
// preview payload hashes and repeated Things/People calls to the same detector.
$('search').value='';context.chrome.runtime.sendMessage=async()=>({data:tagCatalog});await $('refresh').onclick();flush();
vm.runInContext('openDetail(items[0])',context);await tick();await tick();
let runNumber=0;
context.chrome.runtime.sendMessage=async message=>{runNumber++;return {ok:true,source:message.body.model,model:message.body.model,run_id:'accumulate-'+runNumber,image_payload_sha256:'payload-'+runNumber,suggestions:runNumber===3?[{tag:'smile',score:.9}]:[{tag:'Generated Object',score:.9},{tag:'person',score:.8},{tag:'Machine Cat',score:.8}]};};
$('tag-image-choice').checked=true;$('tag-people-choice').checked=false;await $('run-image-tagging').onclick();
$('tag-image-choice').checked=false;$('tag-people-choice').checked=true;await $('run-image-tagging').onclick();
$('tag-image-choice').checked=true;$('tag-people-choice').checked=true;await $('run-image-tagging').onclick();flush();
const cumulative=vm.runInContext('tagsFor(selected)',context);
assert.ok(cumulative.includes('Generated Object'));assert.ok(cumulative.includes('person'));assert.ok(cumulative.includes('smile'));
assert.ok(!cumulative.includes('Machine Cat'),'Explicit removal must survive all later runs');
assert.ok(data['atlas-image-tagging-runs-v1'][vm.runInContext('itemKey(selected)',context)].objects.length>=2);
assert.equal(JSON.stringify(tagCatalog),humanBefore);
console.log('PASS: three separate UI generations accumulate different payloads and shared-detector choices; explicit × removal and human metadata survive.');
vm.runInContext('highlightedTags.clear();generatedIndex=new Map()',context);
context.chrome.runtime.sendMessage=async()=>({data:tagCatalog});await $('refresh').onclick();flush();
const reloaded=vm.runInContext('tagsFor(selected)',context);
for(const tag of ['Generated Object','person','smile'])assert.ok(reloaded.includes(tag));
assert.ok(!reloaded.includes('Machine Cat'));
assert.equal(vm.runInContext('highlightedTags.size',context),0);
console.log('PASS: cumulative generated attachments survive reloading storage with zero highlighted/selected tags.');

// Alt+Q restores ordinary order without deleting attachments. Open preview and
// editor controls retain key ownership; typed search words are kept.
$('close').onclick();vm.runInContext("highlightedTags=new Set(['smile']);$('search').value='';updatePriorities()",context);
let clearPrevented=false;
listeners.keydown({key:'Escape',target:document.body,preventDefault(){throw Error('Escape must not clear tags');}});
assert.equal(vm.runInContext('highlightedTags.size',context),1);
listeners.keydown({key:'q',altKey:true,target:document.body,preventDefault(){clearPrevented=true;}});
assert.equal(clearPrevented,true);assert.equal(vm.runInContext('highlightedTags.size',context),0);
for(const tag of ['Generated Object','person','smile'])assert.ok(vm.runInContext('tagsFor(selected)',context).includes(tag));
vm.runInContext("highlightedTags.add('smile');$('search').value='Bookmark tag:smile'",context);
vm.runInContext("$('detail').showModal()",context);
listeners.keydown({key:'q',altKey:true,target:document.body,preventDefault(){throw Error('Preview must not clear underlying tags');}});
assert.equal(vm.runInContext('highlightedTags.size',context),1);
$('close').onclick();listeners.keydown({key:'q',altKey:true,target:{matches:()=>true},preventDefault(){throw Error('Editor must keep input handling');}});
assert.equal(vm.runInContext('highlightedTags.size',context),1);
listeners.keydown({key:'q',altKey:true,target:$('search'),preventDefault(){}});
assert.equal(vm.runInContext('highlightedTags.size',context),0);assert.equal($('search').value,'Bookmark');
console.log('PASS: Alt+Q clears highlighted tags/clauses and restores order; attachments/search words persist; Escape never clears selection and dialogs/editors retain handling.');

// Independent legacy ranking fixture (no migrated image contexts).
delete data[galleryModule.IMAGE_ENTRIES];await vm.runInContext('imageEntries.load()',context);
// Graded priority: 3 matches, 2, 1, zero, with stable ties and no double-counting.
$('search').value='';vm.runInContext("highlightedTags.clear();render()",context);
const rankedNodes=roots[0].children[0].children.slice(0,6);
context.rankingFixtures=rankedNodes.map((node,index)=>[node.url,{note:'',tags:[['Alpha'],[],['Alpha','Beta'],['Alpha','Beta','Gamma'],['Beta','Gamma'],['ALPHA','Alpha']][index],image:null}]);
vm.runInContext("associations=new Map(rankingFixtures);highlightedTags=new Set(['Alpha','Beta','Gamma']);updatePriorities()",context);
assert.deepEqual(Array.from(vm.runInContext('items.slice(0,6).map(node=>node.id)',context)),[rankedNodes[3].id,rankedNodes[2].id,rankedNodes[4].id,rankedNodes[0].id,rankedNodes[5].id,rankedNodes[1].id]);
assert.equal(vm.runInContext('items.length',context),1000);
vm.runInContext('highlightedTags.clear();updatePriorities()',context);
const retained=cards().find(card=>card.atlasNode.id===rankedNodes[0].id);
context.rankingFixtures=roots[0].children[0].children.slice(1,31).map(node=>[node.url,{note:'',tags:['Alpha'],image:null}]);
vm.runInContext("associations=new Map(rankingFixtures);highlightedTags.add('Alpha');updatePriorities()",context);
assert.equal(vm.runInContext('items[30].id',context),rankedNodes[0].id);
assert.equal(cards().find(card=>card.atlasNode.id===rankedNodes[0].id),retained,'Moving across virtual batches must retain the card and its image');
assert.ok(animations.length>0);assert.equal(animations.at(-1).options.duration,260);
const animationCount=animations.length;context.window.matchMedia=()=>({matches:true});
vm.runInContext('highlightedTags.clear();updatePriorities()',context);assert.equal(animations.length,animationCount);
console.log('PASS: graded 3/2/1/0 matching priority, stable ties, unique tag scoring, all cards retained, cross-batch image reuse, bounded transform motion and reduced-motion support.');

// Departing cards use their own DOM for a bounded, noninteractive exit; arriving
// cards fade in, and interrupted searches never leave retired nodes behind.
scroll=0;document.body=new El('body');document.body.append($('pins'));context.window.matchMedia=()=>({matches:false});
$('search').value='Bookmark 1';const motionStart=animations.length;vm.runInContext('updatePriorities()',context);
const exits=Array.from(vm.runInContext('[...retiringCards.keys()]',context));
assert.ok(exits.length>0 && exits.length<=8);assert.ok(animations.length-motionStart<=32);
assert.ok(exits.every(card=>card.inert===true && card.attrs['aria-hidden']==='true' && card.style.position==='fixed'));
assert.ok(animations.slice(motionStart).some(animation=>animation.options.duration===100));
$('search').value='Bookmark 99';vm.runInContext('updatePriorities()',context);
assert.ok(animations.slice(motionStart).some(animation=>animation.options.duration===180 && animation.frames[0].opacity===0));

assert.ok(exits.every(card=>!card.isConnected));
for(const finish of motionFinishes.splice(0))finish();await tick();
assert.equal(vm.runInContext('retiringCards.size',context),0);
console.log('PASS: bounded 100ms exits and 180ms entrances, inert departing DOM, rapid-search cleanup and no leftover cards; browser visual smoothness remains separate.');

// One ranking path: click and typed clauses yield the same complete ordering.
context.rankingFixtures=rankedNodes.map((node,index)=>[node.url,{note:'',tags:[['Alpha'],[],['Alpha','Beta'],['Alpha','Beta','Gamma'],['Beta','Gamma'],['ALPHA','Alpha']][index],image:null}]);
vm.runInContext("associations=new Map(rankingFixtures);highlightedTags=new Set(['Alpha','Beta','Gamma']);$('search').value=''",context);
const clickOrder=Array.from(vm.runInContext('filteredNodes().map(node=>node.id)',context));
vm.runInContext("highlightedTags.clear();$('search').value='tag:Alpha,Beta,Gamma'",context);
assert.deepEqual(Array.from(vm.runInContext('filteredNodes().map(node=>node.id)',context)),clickOrder);assert.equal(clickOrder.length,1000);
$('search').value='Bookmark 9 tag:Alpha,Beta';
assert.equal(vm.runInContext('filteredNodes().length',context),model.pinItems(roots,'all','Bookmark 9').length);
assert.ok(vm.runInContext('filteredNodes().some(node=>!tagsFor(node).length)',context));
$('search').value='tag:Art,art,ＡＲＴ';assert.equal(vm.runInContext('selectionTags().length',context),1);assert.equal(vm.runInContext("isSelectedTag('aRt')",context),true);
vm.runInContext("tagButton('ART','pin-tag').onclick()",context);assert.equal($('search').value,'');assert.equal(vm.runInContext('selectionTags().length',context),0);
listeners.keydown({key:'Enter',target:{closest:()=>true},preventDefault(){throw Error('Board must not intercept native tag-button Enter');}});
assert.equal(vm.runInContext('typeof applyTags',context),'undefined');assert.equal(vm.runInContext('typeof activeTags',context),'undefined');
assert.ok(!read('pinboard.css').includes('#apply-tags'));
console.log('PASS: click/typed tag clauses produce identical full graded order; text alone filters; case/Unicode highlighting and unselection agree; old Apply state/control/Enter interception are removed.');

assert.deepEqual(model.tagQuery('tag:'),{text:'',tags:[]});
assert.deepEqual(model.tagQuery('tag:Alpha,'),{text:'',tags:['Alpha']});
console.log('PASS: unfinished tag prefixes and trailing commas do not become accidental text filters while typing.');

// Exercise authored records through the very same production board functions.
const documentKeys={};context.document.addEventListener=(key,fn)=>documentKeys[key]=fn;
vm.runInContext(read('pinboard-blank.js').replace(/export /g,'').replace('function installBlankBoard(', 'function installAuthoredBoard(')+';globalThis.authoredInstall=installAuthoredBoard;',context);
const localStorageKey='atlas.pinboard.cards.v1';
data[localStorageKey]={default:[{id:'auth-a',title:'Authored A',text:'A note',image:'https://images.example/a.jpg',tags:['Alpha'],url:null},{id:'auth-b',title:'Authored B',text:'B note',image:'https://images.example/b.jpg',tags:['Alpha','Beta'],url:taggedImage.url},{id:'auth-c',title:'Authored C',text:'C note',image:null,tags:['Beta'],url:taggedImage.url}]};
blankImpl=context.authoredInstall(blankOptions);await blankImpl.load();$('folder').value='blank';$('search').value='';vm.runInContext('highlightedTags.clear();render()',context);flush();
assert.equal(cards().length,3);assert.ok(cards().every(card=>card.className.startsWith('pin')));assert.equal($('tag-browser').hidden,false);assert.equal($('pins').hidden,false);
const authoredA=cards().find(card=>card.atlasNode.cardId==='auth-a'),authoredB=cards().find(card=>card.atlasNode.cardId==='auth-b');
assert.equal(authoredA.children[0].className,'pin-visual');await authoredA.children[0].onclick();await tick();await tick();assert.equal($('detail').open,true);assert.equal($('detail-title').textContent,'Authored A');assert.equal(previewContent.notes.map(note=>note.text).join('\n\n'),'A note');assert.equal($('detail-link').hidden,true);assert.equal($('edit-authored-card').hidden,false);
$('close').onclick();$('search').value='tag:Alpha,Beta';vm.runInContext('updatePriorities()',context);assert.equal(vm.runInContext('items[0].cardId',context),'auth-b');assert.equal(vm.runInContext('items.length',context),3);
$('search').value='';const isolated=blankImpl.nodes();assert.notEqual(isolated[1].itemKey,isolated[2].itemKey);assert.notEqual(isolated[1].itemKey,taggedImage.url);
const pair=authoredB.children[1].children.find(child=>child.className==='pin-tags').children.find(pair=>pair.children[0].textContent==='Beta');await pair.children[1].onclick({stopPropagation(){}});assert.ok(!blankImpl.metadata(isolated[1]).tags.includes('Beta'));assert.ok(blankImpl.metadata(isolated[2]).tags.includes('Beta'));
const localTagEditor=tagEditorOptions.localAdapter(isolated[1]);await localTagEditor.mutate('tag','Beta');assert.ok(blankImpl.metadata(isolated[1]).tags.includes('Beta'));assert.ok(vm.runInContext('tagsFor(blankBoard.nodes()[1])',context).includes('Beta'));
vm.runInContext('openDetail(blankBoard.nodes()[0])',context);await tick();await tick();
context.chrome.runtime.sendMessage=async message=>{assert.equal(message.path,'/v1/tag-image');assert.equal(message.body.item_id,vm.runInContext('itemKey(selected)',context));return {ok:true,source:'objects',run_id:'auth-run',image_payload_sha256:'auth-payload',suggestions:[{tag:'Authored Machine',score:.9}]};};
$('tag-image-choice').checked=true;$('tag-people-choice').checked=false;await $('run-image-tagging').onclick();
assert.ok(data['atlas-image-tagging-runs-v1'][vm.runInContext('itemKey(selected)',context)]);assert.ok(vm.runInContext('tagsFor(blankBoard.nodes()[0])',context).includes('Authored Machine'));assert.ok(!vm.runInContext('tagsFor(blankBoard.nodes()[1])',context).includes('Authored Machine'));
await blankImpl.patch(isolated[0],{title:'Retitled',image:'https://images.example/new.jpg'});flush();assert.equal(cards().find(card=>card.atlasNode.cardId==='auth-a').children[1].children[0].textContent,'Retitled');assert.ok(vm.runInContext('tagsFor(blankBoard.nodes()[0])',context).includes('Authored Machine'),'Editing parent card must preserve independently owned image evidence');
$('close').onclick();$('preview-board').onclick();assert.equal(blankImpl.region().hidden,true);assert.equal($('pins').hidden,false);assert.equal(cards().length,3);
$('folder').value='all';vm.runInContext('render()',context);$('folder').value='blank';vm.runInContext('render()',context);assert.equal(blankImpl.region().hidden,false);assert.equal($('preview-board').textContent,'Preview');
console.log('PASS: legacy authored cards use common card/preview/ranking/tag/X/generation/masonry functions, unique identities, local mutation, stale-cover isolation, editing refresh and preview exit reset.');

// Browser Web Locks are not reentrant: authored fetch persistence owns its lock.
const originalLock=context.navigator.locks.request;let held=false;
context.navigator.locks.request=async(name,callback)=>{assert.equal(held,false,'Do not acquire the card storage lock recursively');held=true;try{return await callback();}finally{held=false;}};
assert.equal(await fetchOptions.saveCover(blankImpl.nodes()[2],'https://example.com/authored-fetched.webp'),true);
assert.equal(blankImpl.metadata(blankImpl.nodes()[2]).image,'https://example.com/authored-fetched.webp');
context.navigator.locks.request=originalLock;
console.log('PASS: authored cover fetch persists through one nonreentrant storage lock.');

const projection=context.indexAssociations({resources:{a:{id:'a',kind:'bookmark',title:'Source',note:'Own note',locators:[{provider:'web',reference:'https://source.example'}]},n:{id:'n',kind:'note',title:'Linked note',note:'Linked text'},b:{id:'b',kind:'bookmark',title:'Connected site',locators:[{provider:'web',reference:'https://linked.example'}]},other:{id:'other',kind:'bookmark',title:'Unlinked',locators:[{provider:'web',reference:'https://unlinked.example'}]}},tags:{},relations:[{from:'a',to:'n',type:'related'},{from:'a',to:'b',type:'related'}]}).get('https://source.example');
assert.deepEqual(JSON.parse(JSON.stringify(projection.notes)).map(n=>n.text),['Own note','Linked text']);assert.equal(projection.bookmarks.length,1);assert.equal(projection.bookmarks[0].url,'https://linked.example');
console.log('PASS: expansion projects own/explicitly linked notes and bookmarks, with no unrelated library suggestions.');

// Exercise the production hold through the actual card tag click/layout path.
let holdClock=0,holdTimerId=0;const holdTimers=new Map();
holdImpl=holdsModule.createCardHold({onRelease:()=>context.updatePriorities(),setTimer:(fn,ms)=>{holdTimers.set(++holdTimerId,{fn,at:holdClock+ms});return holdTimerId;},clearTimer:id=>holdTimers.delete(id)});
const holdAdvance=ms=>{holdClock+=ms;for(const [id,timer] of [...holdTimers])if(timer.at<=holdClock){holdTimers.delete(id);timer.fn();}};
await blankImpl.patch(blankImpl.nodes()[2],{tags:['Beta','Unique']});vm.runInContext("highlightedTags.clear();$('search').value='';render()",context);flush();
const targetCard=cards().find(card=>card.atlasNode.cardId==='auth-c'),targetPosition={left:targetCard.style.left,top:targetCard.style.top};
const targetTag=targetCard.children[1].children.find(child=>child.className==='pin-tags').children.find(pair=>pair.children[0]?.textContent==='Unique').children[0];targetTag.onclick();
assert.equal(vm.runInContext('items[0].cardId',context),'auth-c','Selection/ranking updates immediately');assert.ok(cards().includes(targetCard));assert.equal(targetCard.style.left,targetPosition.left);assert.equal(targetCard.style.top,targetPosition.top);
holdAdvance(4000);targetCard.handlers.pointermove();holdAdvance(4999);assert.equal(holdImpl.active().length,1);assert.equal(targetCard.style.left,targetPosition.left);holdAdvance(1);assert.equal(holdImpl.active().length,0);assert.equal(targetCard.style.left,'0px');assert.equal(targetCard.style.top,'0px');
console.log('PASS: card tag click immediately selects/ranks but retains the actual card/geometry until five seconds after its last interaction.');

// Arrow scrolling belongs to the hovered/focused tag viewport, never an editor.
let tagHover=true,arrowPrevented=0;
$('tag-browser').matches=()=>tagHover;
Object.assign($('tag-field'),{scrollHeight:600,clientHeight:185,scrollTop:0});
const arrow=(key,target=document.body)=>listeners.keydown({key,target,preventDefault(){arrowPrevented++;}});
arrow('ArrowDown');assert.equal($('tag-field').scrollTop,48);arrow('ArrowUp');assert.equal($('tag-field').scrollTop,0);
arrow('ArrowUp');assert.equal($('tag-field').scrollTop,0);
arrow('ArrowDown',{matches:()=>true});assert.equal($('tag-field').scrollTop,0);
tagHover=false;arrow('ArrowDown');assert.equal($('tag-field').scrollTop,0);
assert.equal(arrowPrevented,3);
console.log('PASS: hovered tag arrows scroll only the tag viewport, clamp at boundaries and leave editors/unhovered board keys alone.');

// Real gallery/store/preview wiring: image-scoped content, star, removal and restore.
await vm.runInContext('openDetail(blankBoard.nodes()[0])',context);
const firstEntry=vm.runInContext('selected.entryId',context),firstOwner=vm.runInContext('selected.galleryOwner',context);
const firstImage=$('detail-image').src;
await vm.runInContext("saveImage(selected,'https://images.example/gallery-b.jpg',{provider:'web',url:'https://images.example/gallery-b.jpg',sha256:'b-hash'})",context);
assert.notEqual(vm.runInContext('selected.entryId',context),firstEntry);assert.equal($('detail-image').src,'https://images.example/gallery-b.jpg');assert.equal($('detail-tags').children.length,0);assert.equal(previewContent.notes.length,0);assert.equal(previewContent.bookmarks.length,0);
const secondEntry=vm.runInContext('selected.entryId',context);assert.equal(data[galleryModule.IMAGE_ENTRIES][firstOwner].defaultId,firstEntry);
const entryTagAdapter=tagEditorOptions.localAdapter(vm.runInContext('selected',context));await entryTagAdapter.mutate('tag','Only B');
await previewOptions.save(vm.runInContext('itemKey(selected)',context),'note',{id:'b-note',title:'B title',text:'B body'});
assert.equal(previewContent.notes[0].text,'B body');
await $('default-image').onclick();assert.equal(data[galleryModule.IMAGE_ENTRIES][firstOwner].defaultId,secondEntry);assert.equal($('default-image').attrs['aria-pressed'],'true');
$('previous-image').onclick();assert.equal(vm.runInContext('selected.entryId',context),firstEntry);assert.equal($('detail-image').src,firstImage);assert.ok(!$('detail-tags').children.some(tag=>tag.children[0]?.textContent==='Only B'));
$('next-image').onclick();assert.equal(previewContent.notes[0].title,'B title');
context.window.confirm=()=>true;await $('remove-image').onclick();const record=data[galleryModule.IMAGE_RECOVERY].at(-1);assert.equal(record.entry.id,secondEntry);assert.equal(record.entry.notes[0].text,'B body');assert.equal(record.entry.tags[0],'Only B');assert.equal(record.imageReference,'https://images.example/gallery-b.jpg');assert.equal(vm.runInContext('selected.entryId',context),firstEntry);
await vm.runInContext('imageEntries.restore('+JSON.stringify(record.id)+')',context);$('next-image').onclick();assert.equal(previewContent.notes[0].text,'B body');
const keyboard=$('detail').handlers.keydown;let intercepted=false;keyboard({key:'ArrowLeft',target:{closest:()=>true},preventDefault(){intercepted=true;}});assert.equal(intercepted,false);
assert.match(read('pinboard.html'),/>Add Image<\/button>/);assert.ok(read('pinboard.html').indexOf('id="default-image"')<read('pinboard.html').indexOf('id="detail-image"'));assert.match(read('explorer.html'),/id="image-recovery-open"/);
console.log('PASS: additive gallery UI preserves A, starts B empty, stores B tags/notes, stars default, navigates contexts, atomically recovers/remounts section and leaves editor arrow keys alone.');

// Owner regression: generated results survive leaving a gallery card, opening
// another card, and rebuilding indexes from durable browser storage.
$('folder').value='blank';$('search').value='';
await vm.runInContext('openDetail(blankBoard.nodes()[0])',context);await tick();await tick();
const persistentKey=vm.runInContext('itemKey(selected)',context);
context.chrome.runtime.sendMessage=async message=>({ok:true,source:'objects',run_id:'persist-reopen',suggestions:[{tag:'Persistent Result',score:.9}]});
$('tag-image-choice').checked=true;$('tag-people-choice').checked=false;await $('run-image-tagging').onclick();
assert(data['atlas-image-tagging-runs-v1'][persistentKey]);
$('close').onclick();await vm.runInContext('openDetail(blankBoard.nodes()[1])',context);await tick();await tick();$('close').onclick();
await vm.runInContext('imageEntries.load();generatedIndex=new Map();refreshGeneratedIndex()',context);
await vm.runInContext('openDetail(blankBoard.nodes()[0])',context);await tick();await tick();
assert.equal(vm.runInContext('itemKey(selected)',context),persistentKey);
assert($('detail-generated-tags').children.some(chip=>chip.children[0].textContent==='Persistent Result'));
assert(vm.runInContext('tagsFor(selected)',context).includes('Persistent Result'));
console.log('PASS: generated gallery tags survive close, other-card visit, cache reload and reopening without another inference.');

// Exercise the real local-file chooser handler, not saveImage directly.
const localOwner=vm.runInContext('selected.galleryOwner',context);
const localCount=data[galleryModule.IMAGE_ENTRIES][localOwner].entries.length;
const priorDefault=data[galleryModule.IMAGE_ENTRIES][localOwner].defaultId;
$('replace-image').onclick();assert.equal($('image-source').open,true);
$('upload-image').onclick();assert.equal($('image-source').open,true,'Keep the modal and its error status visible during file selection/save');
const localFile=Object.assign(new Blob(['local test bytes'],{type:'image/png'}),{name:'chosen.png'});
$('image-file').files=[localFile];context.rasterImage=async()=> 'data:image/png;base64,AA==';
await $('image-file').onchange();await tick();await tick();
assert.equal($('image-source').open,false);
assert.equal(data[galleryModule.IMAGE_ENTRIES][localOwner].entries.length,localCount+1);
assert.equal(data[galleryModule.IMAGE_ENTRIES][localOwner].defaultId,priorDefault);
assert.equal($('image-position').textContent,(localCount+1)+' / '+(localCount+1));
assert.equal($('previous-image').disabled,false);assert.equal($('next-image').disabled,false);
const uploadedId=vm.runInContext('selected.entryId',context);
assert.equal(data[galleryModule.IMAGE_ENTRIES][localOwner].entries.at(-1).origin.filename,'chosen.png');
$('previous-image').onclick();assert.notEqual(vm.runInContext('selected.entryId',context),uploadedId);
$('next-image').onclick();assert.equal(vm.runInContext('selected.entryId',context),uploadedId);
$('replace-image').onclick();context.rasterImage=async()=>{throw Error('IMAGE_DECODE_FAILED');};
await $('image-file').onchange();assert.equal($('image-source').open,true);
assert.match($('image-status').textContent,/IMAGE_DECODE_FAILED/);
assert.equal(data[galleryModule.IMAGE_ENTRIES][localOwner].entries.length,localCount+1);
assert.equal($('upload-image').disabled,false);
console.log('PASS: actual local-file add appends independently, updates count/arrows, keeps default and origin, and shows decode failures without closing chooser or altering gallery.');
