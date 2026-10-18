import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync('extension/pinboard.js','utf8');
const code=source.slice(source.indexOf('let renamingBoard=false;'),source.indexOf("$('new-board-form').onsubmit="));
const submit=source.slice(source.indexOf("$('new-board-form').onsubmit="),source.indexOf("$('new-board-form').onsubmit=")).length;
const handler=source.slice(source.indexOf("$('new-board-form').onsubmit=" )).split('\n')[0];
for(const boardId of ['123',null]){
 const ids={};const $=id=>ids[id] ||= {value:'',textContent:'',options:[],focus(){},showModal(){this.open=true;},close(){this.open=false;}};
 $('title').textContent='Old';const record={id:'123',title:'Old',folderId:'blank',sourceBookmark:{id:'',url:''},version:1};const data={boards:{123:record}};
 const context={$,boardId,PINBOARDS_KEY:'boards',boardRecord:x=>x,document:{},navigator:{locks:{request:async(_,fn)=>fn()}},chrome:{storage:{local:{get:async key=>({[key]:data[key]}),set:async value=>Object.assign(data,value)}}}};
 vm.runInNewContext(code+handler,context);$('rename-pinboard').onclick();assert.equal($('new-board-title').value,'Old');$('new-board-title').value='New name';await $('new-board-form').onsubmit({preventDefault(){}});
 assert.equal($('title').textContent,'New name');assert.equal($('new-board-dialog').open,false);if(boardId){assert.equal(data.boards['123'].title,'New name');assert.equal(data.boards['123'].folderId,'blank');}else assert.equal(data['atlas.pinboard.default-title.v1'],'New name');
}
assert.match(readFileSync('extension/pinboard.css','utf8'),/scrollbar-gutter:stable both-edges/);
console.log('PASS: menu renames saved/default pinboards without changing collection membership; symmetric tag gutters.');
