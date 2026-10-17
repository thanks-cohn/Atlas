import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
class E{constructor(tag){this.tag=tag;this.children=[];this.value='';this.handlers={};}append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}setAttribute(){}addEventListener(k,fn){this.handlers[k]=fn;}showModal(){this.open=true;}close(){this.open=false;this.handlers.close?.();}remove(){this.removed=true;}}
const body=new E('body'),document={createElement:tag=>new E(tag),body};
let revision=1,fail=false,changed=0;let data={resources:{r:{id:'r',kind:'bookmark',locators:[{provider:'web',reference:'https://example.com'}]},other:{id:'other',kind:'bookmark',locators:[{provider:'web',reference:'https://other.example'}]}},tags:{r:['Art'],other:['Design']}};
const mutations=[];const context={document,navigator:{locks:{request:async(_,fn)=>fn()}},chrome:{bookmarks:{get:async()=>[{url:'https://example.com'}]},runtime:{sendMessage:async message=>{if(fail)return {ok:false};const body=message.body;if(body){assert.equal(body.expected_revision,revision);mutations.push(body);const tags=data.tags[body.args.resource] || [];data.tags[body.args.resource]=body.action==='tag'?[...new Set([...tags,body.args.tag])]:tags.filter(t=>t!==body.args.tag);revision++;}return {data:structuredClone(data),revision};}}}};
vm.createContext(context);vm.runInContext(readFileSync('extension/pinboard-tag-editor.js','utf8').replace('export function','function')+';globalThis.install=installTagEditor',context);
const open=context.install({onChanged:()=>changed++});await open({id:'1',url:'https://example.com',title:'Bookmark'});
const dialog=body.children.at(-1),attached=dialog.children[2],select=dialog.children[3].children[0],add=dialog.children[4];
assert.equal(attached.children[0].textContent,'Art ×');assert.equal(add.disabled,true);
select.value='Design';select.onchange();assert.equal(add.disabled,false);add.onclick();await new Promise(r=>setTimeout(r,0));
assert.equal(changed,1);assert.deepEqual(data.tags.r,['Art','Design']);assert.equal(dialog.open,true);
attached.children[0].onclick();await new Promise(r=>setTimeout(r,0));assert.deepEqual(data.tags.r,['Design']);assert.equal(mutations.at(-1).action,'untag');assert.equal(changed,2);
fail=true;await open({id:'1',url:'https://example.com'});assert.match(body.children.at(-1).children[5].textContent,/Connect/);assert.equal(body.children.at(-1).children[6].hidden,false);
console.log('PASS: existing-tag picker, revision-checked add/remove, retained dialog and visible unavailable/retry state. DOM/API doubles; real Chrome NOT_RUN.');
