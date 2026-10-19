import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {chooseEntryPoint,ENTRY_POINT_KEY,validRelativeFolder} from '../extension/explorer-entry-point.js';
const user={id:'u',label:'User',root:'C:\\Users\\jg202'},docs={id:'d',label:'Documents',root:'c:\\users\\jg202\\Documents'},other={id:'x',label:'Other',root:'D:\\Archive'};
assert.equal(chooseEntryPoint([docs,user]).grant.id,'u');
assert.equal(chooseEntryPoint([user,docs]).grant.id,'u');
assert.equal(chooseEntryPoint([docs,user],{grantId:'d',path:''}).grant.id,'d');
assert.equal(chooseEntryPoint([docs,user],{grantId:'u',path:'Documents/Art'}).label,'Art');
assert.equal(chooseEntryPoint([docs,user],{grantId:'revoked',path:''}).grant.id,'u');
assert.equal(chooseEntryPoint([docs,user],{grantId:'d',path:'../escape'}).grant.id,'u');
assert.equal(chooseEntryPoint([]),null);
assert.equal(chooseEntryPoint([docs,other,user]).grant.id,chooseEntryPoint([user,other,docs]).grant.id);
assert.equal(chooseEntryPoint([{id:'child',root:'/home/user/docs'},{id:'parent',root:'/home/user'}]).grant.id,'parent');
for(const bad of ['/etc','C:/Users','../secret','foo/../bar','foo\\bar'])assert.equal(validRelativeFolder(bad),false);
assert.equal(chooseEntryPoint([docs]).grant.id,'d','Never invent a parent grant');
class Node{
 constructor(){this.children=[];this.dataset={};}
 append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}
 close(){}showModal(){}
}
const ids={},$=id=>ids[id] ||=new Node();let saved={},destination;
const context={$ ,ENTRY_POINT_KEY,chooseEntryPoint,entryPointPreference:null,state:{grants:[docs,user],grant:user,path:'Documents/Art'},text:(tag,value,cls)=>Object.assign(new Node(),{tag,textContent:value,className:cls}),Option:function(label,value){this.textContent=label;this.value=value;},chrome:{storage:{local:{set:async value=>Object.assign(saved,structuredClone(value))}}},navigate:(grant,path)=>destination={grant,path},showPair(){}};
const source=readFileSync('extension/explorer.js','utf8');const start=source.indexOf('function renderEntryPoint(){'),end=source.indexOf('async function loadGrants()',start);
vm.runInNewContext(source.slice(start,end),context);context.renderEntryPoint();assert.equal($('roots').children.length,1);$('roots').children[0].onclick();assert.equal(destination.grant.id,'u');
await $('entry-point-choice').onchange({target:{value:JSON.stringify({grantId:'d',path:''})}});assert.deepEqual(saved[ENTRY_POINT_KEY],{grantId:'d',path:''});assert.equal($('roots').children.length,1);$('roots').children[0].onclick();assert.equal(destination.grant.id,'d');
await $('entry-point-current').onclick();assert.equal(saved[ENTRY_POINT_KEY].path,'Documents/Art');$('roots').children[0].onclick();assert.equal(destination.path,'Documents/Art');
context.entryPointPreference=JSON.parse(JSON.stringify(saved[ENTRY_POINT_KEY]));context.renderEntryPoint();assert.equal($('roots').children.length,1);
await $('entry-point-choice').onchange({target:{value:''}});assert.equal(saved[ENTRY_POINT_KEY],null);$('roots').children[0].onclick();assert.equal(destination.grant.id,'u');assert.equal(context.state.grants.length,2);
console.log('PASS: single sidebar entry, highest authorized ancestor, explicit root/subfolder override and persistence, automatic reset, revoked preference fallback, no broadened grants.');
