import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
class Node{
 constructor(tag){this.tag=tag;this.children=[];this.style={};this.events={};this.scrollTop=0;this.clientHeight=480;this.classList={add(){},remove(){},contains:()=>true};}
 append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}
 setAttribute(){}removeAttribute(){}addEventListener(name,fn){this.events[name]=fn;}
 showModal(){this.open=true;}close(){this.open=false;this.events.close?.();}
}
const ids={};const get=id=>ids[id] ||=new Node('div');
let writes=0;const records=Array.from({length:5000},(_,id)=>({id:String(id),parent:{title:'Card '+id},removedAt:'2026-10-19',state:'removed',entry:{origin:{filename:'photo.png'},notes:[],bookmarks:[],tags:['human']}}));
const context={document:{getElementById:get,createElement:tag=>new Node(tag),body:new Node('body')},chrome:{storage:{local:{get:async()=>({recovery:records})},onChanged:{addListener(){}}}},createImageEntries:()=>({restore:async()=>{writes++;}}),IMAGE_RECOVERY:'recovery',URL,Blob,setTimeout};
let source=readFileSync('extension/image-recovery.js','utf8').replace(/^import .*\n/,'');vm.runInNewContext(source,context);
await get('image-recovery-open').onclick();await new Promise(resolve=>setTimeout(resolve,0));
const list=get('image-recovery-list');assert.equal(list.children.length,20);assert.equal(list.children[1].children[0].textContent,'Card 4999');assert.equal(get('image-recovery-detail').children.length,0);
list.children[1].ondblclick();assert.equal(get('image-recovery-dialog').open,true);assert.equal(get('image-recovery-detail').children.length,1);
get('image-recovery-close').onclick();assert.equal(get('image-recovery-detail').children.length,0);
list.scrollTop=4990*80;list.events.scroll();assert(list.children.length<=20);assert.equal(list.children.at(-1).style.height,'0px');
list.children[1].onkeydown({key:'Enter',preventDefault(){}});assert.equal(get('image-recovery-dialog').open,true);get('image-recovery-close').onclick();assert.equal(writes,0,'expansion must not modify recovery storage');
list.scrollTop=0;list.events.scroll();assert.equal(list.children[1].children[0].textContent,'Card 4999');
console.log('PASS: 5,000 records use at most 18 compact rows; scroll in both directions, double-click/keyboard details, close cleanup, no writes on expansion.');
