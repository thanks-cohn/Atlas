import assert from 'node:assert/strict';
import {createSourceNavigator,installSourceNavigation,SOURCE_BEHAVIOR,sourceURL} from '../extension/source-navigation.js';
function scenario({split=true,reject=false,existing=-1,enabled=true,ignored=false}={}){
 const saved={[SOURCE_BEHAVIOR]:enabled?'split':'tab'},calls=[];
 // Window has a global shelf, a live pinboard with an open card and other tabs.
 // Source navigation must not modify any of those contexts or DOM state.
 const shelf={open:true,side:'right',selected:'bookmarks'},card={open:true,notes:'draft',image:'entry-a'};
 const board={id:20,index:3,windowId:7,pinned:false,groupId:-1,splitViewId:existing};
 const records=new Map([[20,{...board}]]);
 const tabs={getCurrent:async()=>({...records.get(20)}),get:async id=>{if(!records.has(id))throw Error('closed');return {...records.get(id)};},
 create:async options=>{calls.push(['create',{...options}]);if(options.splitWithTabId && reject)throw Error('not supported');const id=20+records.size,view=options.splitWithTabId && !ignored?8:-1;const tab={...options,id,splitViewId:view};records.set(id,tab);if(view>=0)records.get(20).splitViewId=view;return tab;},
 update:async(id,options)=>{calls.push(['update',id,options]);Object.assign(records.get(id),options);return records.get(id);}};
 if(split)tabs.createSplit=async()=>{};
 const storage={get:async()=>saved,set:async value=>Object.assign(saved,value)};
 return {open:createSourceNavigator({tabs,storage}),calls,shelf,card,records,tabs,storage};
}
let s=scenario();const first=await s.open('https://example.com/source');
assert.equal(first.mode,'split');assert.deepEqual(s.calls[0][1],{url:'https://example.com/source',windowId:7,openerTabId:20,index:3,pinned:false,active:true,splitWithTabId:20});
assert.deepEqual(s.shelf,{open:true,side:'right',selected:'bookmarks'});assert.deepEqual(s.card,{open:true,notes:'draft',image:'entry-a'});
await s.open('https://example.com/other');assert.equal(s.calls.filter(c=>c[0]==='create').length,1);assert.equal(s.calls[1][0],'update');assert.equal(s.calls[1][1],first.tab.id);
s.records.delete(first.tab.id);s.records.get(20).splitViewId=-1;assert.equal((await s.open('https://example.com/new')).mode,'split');
for(const options of [{split:false},{reject:true},{existing:99},{enabled:false},{ignored:true}]){
 const state=scenario(options);const result=await state.open('https://example.com');assert.equal(result.mode,'tab');
 assert.equal(state.calls.filter(c=>c[0]==='create' && !c[1].splitWithTabId).length,options.ignored?0:1);
 assert.equal(state.shelf.open,true);assert.equal(state.card.image,'entry-a');
}
for(const bad of ['javascript:alert(1)','file:///private','https://u:p@example.com/'])assert.throws(()=>sourceURL(bad));
const valid=scenario();await assert.rejects(()=>valid.open('javascript:alert(1)'));assert.equal(valid.calls.length,0);
const choice={value:'tab'},feedback={},anchor={href:'https://example.com'},messages=[];
installSourceNavigation({chrome:{tabs:valid.tabs,storage:{local:valid.storage}},choice,feedback,anchor,status:m=>messages.push(m)});
await new Promise(resolve=>setTimeout(resolve,0));assert.equal(choice.value,'split');choice.value='tab';await choice.onchange();assert.equal((await valid.storage.get())[SOURCE_BEHAVIOR],'tab');
let prevented=false;await anchor.onclick({button:0,ctrlKey:true,preventDefault(){prevented=true;}});assert.equal(prevented,false);
await anchor.onclick({button:0,preventDefault(){prevented=true;}});assert.equal(prevented,true);assert.equal(valid.calls[0][1].splitWithTabId,undefined);
console.log('PASS: shelf+pinboard+source-left scenario, preserved card/shelf state, repeat reuse, closed partner, unsupported/rejected/already-split fallback, URL validation, Settings persistence and modifier clicks. API doubles; real Chrome 155 NOT_RUN.');
