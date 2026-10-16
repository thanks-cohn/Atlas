import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read = name => readFileSync(new URL('../extension/'+name, import.meta.url),'utf8');
const model = await import('data:text/javascript;base64,'+Buffer.from(read('bookmark-model.js')).toString('base64'));
const tree=[{id:'0',title:'',children:[{id:'1',parentId:'0',title:'Bar',folderType:'bookmarks-bar',children:[
  {id:'3',parentId:'1',title:'Zulu',url:'https://z.example/'},
  {id:'4',parentId:'1',title:'Alpha folder',children:[{id:'5',parentId:'4',title:'Child',url:'https://a.example/'}]},
  {id:'6',parentId:'1',title:'Managed',unmodifiable:'managed',children:[]},
  {id:'7',parentId:'1',title:'Script',url:'javascript:alert(1)'},
]}]}];
const nodes=model.indexBookmarks(tree);
assert.deepEqual([...nodes.keys()],['0','1','3','4','5','6','7']);
assert.deepEqual(model.findBookmarks(nodes,'A.EXAMPLE').map(n=>n.id),['5']);
assert.equal(model.editableBookmark(nodes.get('1'),nodes),false);
assert.equal(model.editableBookmark(nodes.get('6'),nodes),false);
assert.equal(model.editableBookmark(nodes.get('3'),nodes),true);
assert.deepEqual(model.folderTargets(nodes,'4').map(n=>n.id),['1']);
assert.deepEqual(model.bookmarkTrail(nodes,'5').map(n=>n.id),['0','1','4','5']);
assert.equal(model.openableBookmark('javascript:alert(1)'),false);
assert.equal(model.openableBookmark('data:text/html,hello'),false);
assert.equal(model.openableBookmark('https://example.com'),true);
class El {
  constructor(tag='div') {this.tagName=tag;this.children=[];this.value='';this.hidden=false;this.attrs={};this.handlers={};this.className='';}
  append(...items){this.children.push(...items);} replaceChildren(...items){this.children=items;}
  querySelectorAll(selector){return this.children.flatMap(child=>[...(selector === '.bookmark-open' && child.className === 'bookmark-open' ? [child] : []),...child.querySelectorAll(selector)]);}
  setAttribute(k,v){this.attrs[k]=v;} removeAttribute(k){delete this.attrs[k];}
  addEventListener(k,fn){this.handlers[k]=fn;}
}
const els=new Map();const classes=new Set();const events={};const calls=[];
const document={getElementById:id=>{if(!els.has(id))els.set(id,new El());return els.get(id);},createElement:tag=>new El(tag),body:{classList:{contains:x=>classes.has(x),add:x=>classes.add(x),remove:x=>classes.delete(x)}}};
let failRead=false;
const bookmarks={getTree:async()=>{if(failRead)throw Error('denied');return tree;},update:async(id,changes)=>{calls.push(['update',id,changes]);Object.assign(nodes.get(id),changes);}};
for(const name of ['onCreated','onRemoved','onChanged','onMoved','onChildrenReordered','onImportEnded'])bookmarks[name]={addListener:fn=>events[name]=fn};
const context={...model,document,window:{addEventListener(){}},chrome:{bookmarks,tabs:{create:async arg=>calls.push(['open',arg])}},setTimeout,clearTimeout,prompt:()=> 'Renamed',confirm:()=>false,URL};
vm.runInNewContext(read('bookmarks.js').replace(/^import .*\n/,''),context);
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
els.get('bookmarks-open').onclick();await tick();
assert.equal(classes.has('bookmarks-mode'),true);
assert.equal(els.get('bookmarks-list').children.length,1);
await els.get('bookmarks-list').children[0].children[0].ondblclick();
let rows=els.get('bookmarks-list').children;
assert.equal(rows.length,4);assert.match(rows[0].children[0].children[0].textContent,/Zulu/);
await rows[0].children[0].ondblclick();assert.equal(calls[0][1].url,'https://z.example/');
await rows[3].children[0].ondblclick();assert.match(els.get('bookmarks-status').textContent,/BOOKMARK_URL_BLOCKED/);
assert.equal(calls.filter(c=>c[0]==='open').length,1);
await rows[0].children[1].children[1].children[0].onclick();
assert.equal(nodes.get('3').title,'Renamed');assert.equal(calls.at(-1)[0],'update');
els.get('bookmarks-search').value='a.example';els.get('bookmarks-search').oninput();
assert.equal(els.get('bookmarks-list').children.length,1);assert.equal(els.get('bookmarks-new').disabled,true);
failRead=true;await els.get('bookmarks-refresh').onclick();assert.match(els.get('bookmarks-status').textContent,/BOOKMARK_READ_FAILED/);
els.get('home').handlers.click();assert.equal(classes.has('bookmarks-mode'),false);
assert.ok(events.onMoved && events.onRemoved && events.onImportEnded);
console.log('PASS: native order/search/protected folders/cycle targets/URL safety; shelf navigation, open, blocked script, rename, read failure and return to files (API/DOM doubles, not Chrome runtime).');
