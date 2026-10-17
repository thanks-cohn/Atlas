import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../extension/'+name,import.meta.url),'utf8');
const moduleOf=async name=>import('data:text/javascript;base64,'+Buffer.from(read(name)).toString('base64'));
const model=await moduleOf('pinboard-model.js'),coversModule=await moduleOf('bookmark-covers.js');
const roots=[{id:'0',children:[{id:'1',parentId:'0',title:'Work',children:Array.from({length:1000},(_,i)=>({id:String(i+10),parentId:'1',title:'Bookmark '+i,url:'https://example.com/'+i+'.jpg'}))}]}];
assert.equal(model.pinItems(roots).length,1000);assert.equal(model.pinItems(roots,'missing').length,0);
assert.equal(model.pinItems([{id:'x',url:'javascript:alert(1)'}]).length,0);
assert.equal(model.pinItems([{id:'x',url:'https://u:p@example.com/'}]).length,0);
const data={},storage={get:async key=>({[key]:data[key]}),set:async v=>Object.assign(data,v)};
const node={id:'10',url:'https://example.com/0.jpg'},id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
await model.createPinboard(storage,node,'Research',id,'1');assert.equal((await model.linkedPinboards(storage,node))[0].folderId,'1');
assert.equal((await model.linkedPinboards(storage,{...node,url:'https://changed.example/'})).length,0);
await model.removePinboard(storage,id);assert.equal((await model.linkedPinboards(storage,node)).length,0);

let scroll=0,fetchOptions;const frames=[];const listeners={};
class El{
 constructor(tag='div'){this.tag=tag;this.children=[];this.value='';this.attrs={};this.handlers={};this.hidden=false;this.style={};this.classList={add:name=>this.ready=name};this.clientWidth=1100;}
 append(...nodes){for(const node of nodes)if(node.tag==='fragment')this.children.push(...node.children);else{this.children.push(node);node.parent=this;}}
 replaceChildren(...nodes){this.children=[];this.append(...nodes);}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);}
 get isConnected(){return !!this.parent;}
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
const context={installBlankBoard:()=>({show(){}}),installCoverFetch:options=>{fetchOptions=options;return {discover(){},stop(){},request(){}};},publicImageURL,...model,...coversModule,document,URL,location:{href:'chrome-extension://atlas/pinboard.html'},window:{get scrollY(){return scroll;},innerWidth:1200,addEventListener:(name,fn)=>listeners[name]=fn,scrollBy:({top})=>scroll+=top},requestAnimationFrame:fn=>{frames.push(fn);return frames.length;},setTimeout,clearTimeout,navigator:{locks:{request:async(_,fn)=>fn()}},rasterImage:async()=>'',chrome:{bookmarks:{getTree:async()=>roots,get:async id=>roots[0].children[0].children.filter(node=>node.id===id)},storage:{local:storage},runtime:{sendMessage:async()=>({paired:false})}}};
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
pin.children[0].onclick();assert.equal($('detail').open,true);assert.equal($('detail-link').href,node.url);
$('close').onclick();assert.equal($('detail').open,false);
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
let tagged=cards()[0],strip=tagged.children[1].children[2];assert.equal(strip.className,'pin-tags');assert.equal(strip.children.length,6);assert.equal(strip.children[3].textContent,'<img src=x onerror=alert(1)>');assert.equal(strip.children[5].textContent,'+2');
assert.equal(tagged.children[1].style.height,'138px');
strip.children[5].onclick();assert.equal($('detail').open,true);assert.equal($('detail-tags').children.length,7);$('close').onclick();
const urlTags=cards()[1].children.at(-1);assert.equal(urlTags.className,'pin-tags');assert.equal(urlTags.children.length,2);
// Refresh retrieves edits to the existing catalog rather than requiring a new tab.
tagCatalog.tags.r=['Updated'];await $('refresh').onclick();flush();assert.equal(cards()[0].children[1].children[2].children[0].textContent,'Updated');
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

// Multiple card tags remain pending until Enter / Apply; applied removal is immediate.
assert.deepEqual(model.tagQuery('mountains tags:Design,Travel'),{text:'mountains',tags:['Design','Travel']});
assert.deepEqual(model.tagQuery('tags:Design, Travel mountains'),{text:'mountains',tags:['Design','Travel']});
assert.deepEqual(model.tagQuery('tags:Design tags:Design,Art'),{text:'',tags:['Design','Art']});
assert.equal(model.matchesTags(['A','B'],['A','B']),true);assert.equal(model.matchesTags(['A'],['A','B']),false);
tagCatalog.tags.r=['Art','Design'];tagCatalog.tags.q=['Art'];await $('refresh').onclick();flush();
const imageTags=cards()[0].children[1].children[2];imageTags.children[0].onclick();
assert.equal(vm.runInContext('activeTags.length',context),0);
const otherTag=cards()[0].children[1].children[2].children[1];otherTag.onclick();
$('apply-tags').onclick();flush();assert.equal(cards().length,1);assert.equal(cards()[0].atlasNode.id,taggedImage.id);
assert.equal($('active-tags').children.length,3);
// A normal text query is intersected with ALL selected tags.
$('search').value='not-found';vm.runInContext('render()',context);assert.equal(cards().length,0);
$('search').value='';vm.runInContext('render()',context);assert.equal(cards().length,1);
// Clicking active Design broadens automatically to both Art bookmarks.
cards()[0].children[1].children[2].children[1].onclick();assert.equal(cards().length,2);
$('search').value='tags:Design';vm.runInContext('render()',context);assert.equal(cards().length,1);
$('active-tags').children.at(-1).onclick();assert.equal(cards().length,2);
$('tags-only').checked=true;$('tags-only').onchange();await tick();assert.equal(cards().length,2);assert.equal(data[model.PINBOARD_SETTINGS].tagsOnly,true);
assert.equal(fetchOptions.getNodes().length,2);
console.log('PASS: all-tag intersection, cross-card staging, applied chip removal, tags clauses, search scoping and tagged-only persistence.');

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
assert.equal(model.matchesTags(['Design'],['design']),true);
// No temporary paired token must not suppress the read that can reconnect natively.
let catalogReads=0,stateReads=0;
context.chrome.runtime.sendMessage=async message=>{if(message.type==='state'){stateReads++;return {paired:false};}catalogReads++;return {data:tagCatalog};};
vm.runInContext("activeTags=[];pendingTags.clear();$('search').value='tag:art';$('tags-only').checked=false",context);
await $('refresh').onclick();assert.ok(catalogReads>0);assert.equal(stateReads,0);assert.equal(cards().length,2);assert.equal($('tag-browser').hidden,false);assert.equal($('apply-tags').hidden,true);
// Empty/unavailable metadata does not leave a useless empty palette or imply no saved tags exist.
context.chrome.runtime.sendMessage=async()=>({ok:false,error:{code:'NEEDS_PAIRING'}});
vm.runInContext('associations=new Map()',context);await $('refresh').onclick();assert.equal($('tag-browser').hidden,true);assert.match($('status').textContent,/Connect your companion/);
