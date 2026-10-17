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
class El{
 constructor(tag='div'){this.tag=tag;this.children=[];this.value='';this.attrs={};this.handlers={};this.hidden=false;}
 append(...nodes){for(const node of nodes)if(node.tag==='fragment')this.children.push(...node.children);else this.children.push(node);}
 replaceChildren(...nodes){this.children=[];this.append(...nodes);}
 get options(){return this.children;}
 setAttribute(k,v){this.attrs[k]=v;} removeAttribute(k){delete this.attrs[k];}
 addEventListener(k,fn){this.handlers[k]=fn;}showModal(){this.open=true;}close(){this.open=false;this.handlers.close?.();}
 scrollIntoView(){}click(){this.onclick?.();}
}
const elements=new Map();const document={getElementById:id=>{if(!elements.has(id))elements.set(id,new El());return elements.get(id);},createElement:tag=>new El(tag),createDocumentFragment:()=>new El('fragment'),documentElement:new El()};
let intersection;class Observer{constructor(fn){intersection=fn;}observe(){}}
const {publicImageURL}=await moduleOf('pages-store.js');
const context={publicImageURL,...model,...coversModule,document,URL,location:{href:'chrome-extension://atlas/pinboard.html'},window:{IntersectionObserver:Observer},IntersectionObserver:Observer,setTimeout,clearTimeout,navigator:{locks:{request:async(_,fn)=>fn()}},rasterImage:async()=>'',chrome:{bookmarks:{getTree:async()=>roots},storage:{local:storage},runtime:{sendMessage:async()=>({paired:false})}}};
vm.runInNewContext(read('pinboard.js').replace(/^import .*\n/gm,''),context);
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));await tick();await tick();
const $=id=>document.getElementById(id);
assert.equal($('pins').children.length,24);
for(let i=0;i<12;i++)intersection([{isIntersecting:true}]);
assert.equal($('pins').children.length,96);assert.equal($('more').hidden,true);
$('next').onclick();assert.equal($('pins').children.length,24);assert.match($('status').textContent,/97–120/);
$('previous').onclick();assert.match($('status').textContent,/1–24/);
const pin=$('pins').children[0];assert.equal(pin.children[0].children[0].loading,'lazy');
pin.children[0].onclick();assert.equal($('detail').open,true);assert.equal($('detail-link').href,node.url);
$('close').onclick();assert.equal($('detail').open,false);
assert.equal(pin.children[1].children[0].href,node.url);
// Image-free bookmarks have a URL and an accessible add-image control, not an empty image.
roots[0].children[0].children[0].url='https://example.com/plain';await $('refresh').onclick();
const narrow=$('pins').children[0].children[0];assert.equal(narrow.className,'pin-empty');assert.equal(narrow.children[1].textContent,'+');
console.log('PASS: 1,000-bookmark pinboard, 96-card DOM cap, lazy images, folder/URL safety, paging, image preview vs source link, image-free + card and saved board identity. DOM/API doubles; Chrome hardware QA NOT_RUN.');
