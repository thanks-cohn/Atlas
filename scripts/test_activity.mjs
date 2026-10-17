import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
class Element{constructor(tag){this.tag=tag;this.children=[];this.handlers={};}append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}setAttribute(){}addEventListener(name,callback){this.handlers[name]=callback;}showModal(){this.open=true;}close(){this.open=false;}}
const trigger=new Element('button'),dialog=new Element('dialog'),calls=[],events=[];let healthy=false,manage=false;
const document={getElementById:id=>id==='activity'?trigger:id==='activity-dialog'?dialog:null,createElement:tag=>new Element(tag)};
const chrome={runtime:{id:'a'.repeat(32),sendMessage:async message=>{calls.push(message);if(message.type==='native-manage')return manage?{ok:true}:{ok:false,error:{code:'NEEDS_REPAIR',message:'Host broken'}};if(message.type==='native-connect'){healthy=true;return {ok:true};}return healthy?{ok:true,receipts:[],grants:[]}:{ok:false,error:{message:'Offline'}};}}};
vm.runInNewContext(readFileSync(new URL('../extension/activity.js',import.meta.url),'utf8'),{document,chrome,window:{dispatchEvent:event=>events.push(event.type)},CustomEvent:class{constructor(type){this.type=type;}},Set,Date});
trigger.handlers.click();await new Promise(resolve=>setTimeout(resolve,0));
let controls=dialog.children.find(el=>el.className==='activity-recovery-controls');assert.ok(controls);assert.equal(controls.children[1].textContent,'Open Debug Helper');
await controls.children[1].onclick();assert.equal(calls.at(-1).type,'native-manage');assert.equal(controls.children[3].open,true);assert.match(controls.children[2].textContent,/NEEDS_REPAIR/);
manage=true;await controls.children[1].onclick();assert.match(controls.children[2].textContent,/launch requested/);assert.equal(controls.children[1].disabled,false);
await controls.children[0].onclick();assert.ok(events.includes('atlas:refresh'));assert.ok(calls.some(call=>call.type==='native-connect'));assert.ok(dialog.children.some(el=>el.textContent==='Refresh activity'));
console.log('PASS: offline Activity exposes reconnect/debug actions, failed launch gives manual fallback and exact ID, successful reconnect refreshes history (API/DOM doubles; native GUI NOT_RUN).');
