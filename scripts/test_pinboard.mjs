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

let scroll=0;const frames=[];const listeners={};
class El{
 constructor(tag='div'){this.tag=tag;this.children=[];this.value='';this.attrs={};this.handlers={};this.hidden=false;this.style={};this.classList={add:name=>this.ready=name};this.clientWidth=1100;}
 append(...nodes){for(const node of nodes)if(node.tag==='fragment')this.children.push(...node.children);else{this.children.push(node);node.parent=this;}}
 replaceChildren(...nodes){this.children=[];this.append(...nodes);}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);}
 contains(){return false;}focus(){}
 getBoundingClientRect(){return {top:this===elements.get('pins')?-scroll:0,height:800};}
 get options(){return this.children;}
 setAttribute(k,v){this.attrs[k]=v;} removeAttribute(k){delete this.attrs[k];}
 addEventListener(k,fn){this.handlers[k]=fn;}showModal(){this.open=true;}close(){this.open=false;this.handlers.close?.();}
 scrollIntoView(){scroll=0;}click(){this.onclick?.();}
}
const elements=new Map();const document={getElementById:id=>{if(!elements.has(id))elements.set(id,new El());return elements.get(id);},createElement:tag=>new El(tag),createDocumentFragment:()=>new El('fragment'),documentElement:new El()};
const {publicImageURL}=await moduleOf('pages-store.js');
const context={publicImageURL,...model,...coversModule,document,URL,location:{href:'chrome-extension://atlas/pinboard.html'},window:{innerWidth:1200,addEventListener:(name,fn)=>listeners[name]=fn,scrollBy:({top})=>scroll+=top},requestAnimationFrame:fn=>{frames.push(fn);return frames.length;},setTimeout,clearTimeout,navigator:{locks:{request:async(_,fn)=>fn()}},rasterImage:async()=>'',chrome:{bookmarks:{getTree:async()=>roots},storage:{local:storage},runtime:{sendMessage:async()=>({paired:false})}}};
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
// Window calculation stays bounded at any position, including huge scroll jumps and boundaries.
for(const limit of [24,48,72,96,144])for(const top of [0,1,5000,1e8]){
 const plan=model.visibleBlocks(1000,limit,new Map(),[],top);
 assert.ok((plan.last-plan.first)*model.BATCH<=limit);assert.ok(plan.first>=0);assert.ok(plan.last<=Math.ceil(1000/model.BATCH));
}
assert.equal(model.cardLimit(100000),72);assert.equal(model.visibleBlocks(0,72,new Map(),[],0).last,0);
console.log('PASS: 1,000-bookmark scrolling window, distant-card eviction/rebuild, configurable hard cap, spacers, Atlas loading placeholder, image-only filter persistence and source/preview safety. DOM/API doubles; Chrome hardware QA NOT_RUN.');
