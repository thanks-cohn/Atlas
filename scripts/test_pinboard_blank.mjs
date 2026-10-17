import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const code=readFileSync('extension/pinboard-blank.js','utf8');
class E{
 constructor(tag){this.tag=tag;this.children=[];this.value='';this.classList={toggle(){}};}
 append(...n){this.children.push(...n);}replaceChildren(...n){this.children=n;}setAttribute(){}focus(){}querySelector(){return null;}
 get lastElementChild(){return this.children.at(-1);}
}
const elements=new Map(),events={};const document={getElementById:id=>{if(!elements.has(id))elements.set(id,new E('div'));return elements.get(id);},createElement:tag=>new E(tag),addEventListener:(type,fn)=>events[type]=fn};
let data={},reject=false;const storage={get:async key=>({[key]:data[key]}),set:async value=>{if(reject)throw Error('Storage full');Object.assign(data,value);}};
const context={document,navigator:{locks:{request:async(_,fn)=>fn()}},crypto:{randomUUID:()=>String(Math.random())}};
vm.createContext(context);vm.runInContext(code.replace(/export /g,'')+';globalThis.install=installBlankBoard;globalThis.clean=cleanCard;',context);
assert.throws(()=>context.clean({title:' ',tags:''}));
assert.equal(context.clean({title:' Name ',tags:'Art, Art, Design'}).tags.length,2);
const args={scope:'one',storage,publicImageURL:url=>url.startsWith('https://')?url:null,rasterImage:async()=> 'data:image/png;base64,AA'};
const board=context.install(args),$=id=>document.getElementById(id),tick=()=>new Promise(r=>setTimeout(r,0));board.show(true);await tick();
const region=$('blank-board'),form=region.children[0],fields=form.children.filter(n=>n.tag==='label').map(n=>n.children[0]);
assert.equal(form.tag,'form');assert.equal(form.children[0].className,'composer-image');
fields[1].value='My card';fields[2].value='First paragraph.\n\nSecond paragraph.';fields[3].value='Art, Design, Art';
// Preview keeps the actual draft form and Escape restores editing.
$('preview-board').onclick();assert.equal(region.children[0],form);events.keydown({key:'Escape',preventDefault(){}});assert.equal(region.children[0],form);
reject=true;await form.onsubmit({preventDefault(){}});assert.equal(region.children[0],form);assert.equal(fields[1].value,'My card');assert.match($('blank-status').textContent,/Storage full/);
reject=false;await form.onsubmit({preventDefault(){}});assert.equal(region.children.length,2);assert.equal(region.children[0].className,'authored-pin');assert.equal(region.children[1].tag,'form');
assert.equal(data['atlas.pinboard.cards.v1'].one[0].title,'My card');assert.equal(data['atlas.pinboard.cards.v1'].one[0].tags.length,2);
const reload=context.install(args);reload.show(true);await tick();assert.equal(region.children[0].children[0].children[0].textContent,'My card');
const other=context.install({...args,scope:'two'});other.show(true);await tick();assert.equal(region.children.length,1);
assert.match(readFileSync('extension/pinboard.css','utf8'),/\.is-preview \.pin-composer\{display:none\}/);
console.log('PASS: blank-board cards persist by board, comma tags, preview draft retention, Escape, save failure retention and fresh adjacent starter. DOM/storage doubles; Chrome visual QA NOT_RUN.');
