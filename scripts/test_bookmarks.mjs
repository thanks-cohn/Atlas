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
const coversModule = await import('data:text/javascript;base64,'+Buffer.from(read('bookmark-covers.js')).toString('base64'));
const pagesModule = await import('data:text/javascript;base64,'+Buffer.from(read('pages-store.js')).toString('base64'));
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
  constructor(tag='div') {this.tagName=tag;this.children=[];this.value='';this.hidden=false;this.attrs={};this.handlers={};this.className='';this.dataset={};this.scrollTop=0;}
  append(...items){this.children.push(...items);} replaceChildren(...items){this.children=items;}
  querySelectorAll(selector){return this.children.flatMap(child=>[...(selector.startsWith('.') && child.className === selector.slice(1) ? [child] : []),...child.querySelectorAll(selector)]);}
  setAttribute(k,v){this.attrs[k]=v;} removeAttribute(k){delete this.attrs[k];}
  addEventListener(k,fn){this.handlers[k]=fn;}
  showModal(){this.open=true;} close(){this.open=false;this.handlers.close?.();} focus(){document.activeElement=this;this.onfocus?.();} remove(){this.removed=true;} closest(){return null;}
}
const created=[];const els=new Map();const classes=new Set();const events={};const calls=[];
const document={getElementById:id=>{if(!els.has(id))els.set(id,new El());return els.get(id);},createElement:tag=>{const el=new El(tag);created.push(el);if(tag==='canvas'){el.getContext=()=>({drawImage(){}});el.toDataURL=()=> 'data:image/webp;base64,BBBB';}el.click=()=>{};return el;},body:{append(...items){created.push(...items);},classList:{contains:x=>classes.has(x),add:x=>classes.add(x),remove:x=>classes.delete(x)}}};
let failRead=false;
const bookmarks={get:async id=>[nodes.get(id)],getTree:async()=>{if(failRead)throw Error('denied');return tree;},update:async(id,changes)=>{calls.push(['update',id,changes]);Object.assign(nodes.get(id),changes);}};
for(const name of ['onCreated','onRemoved','onChanged','onMoved','onChildrenReordered','onImportEnded'])bookmarks[name]={addListener:fn=>events[name]=fn};
const storage={};let storageListener;let paired=false;const nativePages={};let catalogRevision=1,failMetadata=false,failMetadataTag='';let catalog={resources:{},relations:[],tags:{}};
const {DEMO_COLLECTION}=await import('data:text/javascript;base64,'+Buffer.from(read('gallery-demo.js')).toString('base64'));
const pinboards=await import('data:text/javascript;base64,'+Buffer.from(read('pinboard-model.js')).toString('base64'));
const context={requestAnimationFrame:fn=>fn(),...pinboards,DEMO_COLLECTION,...model,...coversModule,...pagesModule,withPageLock:task=>task(),library:async()=>({pages:Object.values(nativePages).map(page=>({id:page.id,libraryRevision:page.libraryRevision}))}),readLibraryPage:async id=>nativePages[id],crypto:{randomUUID:()=> 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'},document,window:{addEventListener(){}},chrome:{bookmarks,runtime:{getURL:path=>'chrome-extension://atlas/'+path,sendMessage:async message=>{
 if(message.type==='state')return {paired};
 if(message.body){if(failMetadata || message.body.args?.tag===failMetadataTag)return {ok:false,error:{code:'REVISION_CONFLICT'}};const {action,args,expected_revision}=message.body;assert.equal(expected_revision,catalogRevision);let result;
 if(action==='add_resource'){result='new-resource';catalog.resources[result]={id:result,...args};}
 else if(action==='tag'){catalog.tags[args.resource]=[...new Set([...(catalog.tags[args.resource] || []),args.tag])];}
 else if(action==='update_resource')catalog.resources[args.resource].note=args.note;
 else throw Error('unexpected mutation');catalogRevision++;return {data:catalog,revision:catalogRevision,result};}
 return {data:catalog,revision:catalogRevision};} },storage:{local:{get:async key=>({[key]:storage[key]}),set:async values=>Object.assign(storage,values)},onChanged:{addListener:fn=>storageListener=fn}},tabs:{query:async()=>[{id:42}],update:async(id,arg)=>calls.push(['open',id,arg])}},createImageBitmap:async()=>({width:1280,height:720,close(){}}),setTimeout,clearTimeout,prompt:()=> 'Renamed',confirm:()=>false,URL};
vm.runInNewContext(read('bookmarks.js').replace(/^import .*\n/gm,''),context);
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
els.get('bookmarks-open').onclick();await tick();
assert.equal(classes.has('bookmarks-mode'),true);assert.equal(els.get('activity')?.handlers.click,undefined,'Activity must not exit the bookmark workspace');
assert.equal(els.get('bookmarks-list').children.length,1);
// Folder title navigates once; URL title navigates current tab once.
await els.get('bookmarks-list').children[0].children[1].onclick();await tick();
let rows=els.get('bookmarks-list').children;
assert.equal(rows.length,4);assert.match(rows[0].children[1].children[0].textContent,/Zulu/);
await rows[0].children[1].onclick();assert.equal(calls[0][1],42);assert.equal(calls[0][2].url,'https://z.example/');
await rows[3].children[1].onclick();assert.match(els.get('bookmarks-status').textContent,/BOOKMARK_URL_BLOCKED/);
assert.equal(calls.filter(c=>c[0]==='open').length,1);
// Arrow explores without navigating, image is above associated content, back restores rows.
const dataImage='data:image/webp;base64,AAAA';
storage[coversModule.COVER_KEY]=coversModule.setBookmarkCover({},nodes.get('3'),dataImage);
await els.get('bookmarks-refresh').onclick();rows=els.get('bookmarks-list').children;
els.get('bookmarks-workspace').scrollHeight=900;
rows[0].children[0].onclick();await tick();
assert.equal(els.get('bookmarks-workspace').scrollTop,900,'Disclosure opens at the bottom');
els.get('bookmarks-workspace').handlers.wheel();els.get('bookmarks-workspace').scrollTop=123;vm.runInContext('alignRevealBottom()',context);assert.equal(els.get('bookmarks-workspace').scrollTop,123,'User scroll cancels bottom anchoring');
let preview=els.get('bookmarks-preview');
assert.equal(preview.hidden,false);assert.equal(preview.children[0].textContent,'←');
assert.equal(preview.children[0].attrs['aria-expanded'],'true');
assert.equal(preview.children[2].src,dataImage);
assert.equal(calls.filter(c=>c[0]==='open').length,1);
preview.children[0].onclick();rows=els.get('bookmarks-list').children;assert.equal(rows.length,4);assert.equal(preview.hidden,true);
// File selection stores a bounded raster cover and rendering survives refresh.
rows[0].children[0].onclick();await tick();
preview.children.find(el=>el.className==='bookmark-image-actions').children[0].onclick();
let input=created.filter(el=>el.tagName==='input').at(-1);input.files=[{size:1024,type:'image/png'}];await input.onchange();
assert.equal(storage[coversModule.COVER_KEY]['3'].image,'data:image/webp;base64,BBBB');
assert.equal(preview.children[2].src,'data:image/webp;base64,BBBB');
preview.children.find(el=>el.className==='bookmark-image-actions').children[0].onclick();
input=created.filter(el=>el.tagName==='input').at(-1);input.files=[{size:1024,type:'image/svg+xml'}];await input.onchange();
assert.match(els.get('bookmarks-status').textContent,/BOOKMARK_IMAGE_SAVE_FAILED/);
assert.equal(storage[coversModule.COVER_KEY]['3'].image,'data:image/webp;base64,BBBB');
preview.children[0].onclick();rows=els.get('bookmarks-list').children;
// Exact Atlas web-locator associations appear underneath; no prefix or ID guesses.
paired=true;catalog={resources:{r:{id:'r',kind:'bookmark',note:'My note',locators:[{provider:'web',reference:'https://z.example/'}]},n:{id:'n',kind:'note',title:'Linked note',note:'Body',locators:[]}},relations:[{from:'r',to:'n',type:'reference-for'}],tags:{r:['example']}};
rows[0].children[0].onclick();await tick();await tick();
assert.ok(preview.children.flatMap(el=>el.children).some(el=>el.textContent==='My note'));
assert.ok(preview.children.flatMap(el=>el.children).flatMap(el=>[el,...el.children]).some(el=>el.textContent==='example'));
assert.ok(preview.children.some(el=>el.tagName==='details'));
// Add metadata lives between cover actions and Associated Items; native catalog persists it.
const addSection=()=>preview.children.find(el=>el.className==='bookmark-add-section');
assert.ok(preview.children.indexOf(addSection())<preview.children.findIndex(el=>el.textContent==='Associated Items'));
const metadataDialog=()=>created.filter(el=>el.className==='bookmark-metadata-dialog').at(-1);
addSection().children[1].children[0].onclick();let metadata=metadataDialog(),metadataForm=metadata.children[0],metadataInput=metadataForm.children[2].children[0];
await tick();const dropdown=metadataForm.children[3].children[0];assert.ok(dropdown.children.some(option=>option.value==='example'));
metadataInput.value='Design, Travel, , Design';dropdown.value='example';dropdown.onchange();assert.equal(metadataInput.value,'Design, Travel, Design, example');
await metadataForm.onsubmit({preventDefault(){}});assert.equal(metadata.open,true);assert.equal(metadataInput.value,'');assert.ok(catalog.tags.r.includes('Design'));assert.ok(catalog.tags.r.includes('Travel'));assert.equal(catalog.tags.r.filter(tag=>tag==='Design').length,1);assert.ok(metadataForm.children[4].children.some(pill=>pill.textContent==='Travel'));
metadataInput.value='Architecture';await metadataForm.onsubmit({preventDefault(){}});assert.equal(metadata.open,true);assert.ok(catalog.tags.r.includes('Architecture'));
metadataInput.value='Confirmed, Unconfirmed';failMetadataTag='Unconfirmed';await metadataForm.onsubmit({preventDefault(){}});assert.ok(catalog.tags.r.includes('Confirmed'));assert.ok(!catalog.tags.r.includes('Unconfirmed'));assert.equal(metadataInput.value,'Confirmed, Unconfirmed');assert.equal(metadata.open,true);assert.match(metadataForm.children.find(el=>el.attrs.role==='status').textContent,/1 of 2 confirmed/);
failMetadataTag='';await metadataForm.onsubmit({preventDefault(){}});assert.ok(catalog.tags.r.includes('Unconfirmed'));assert.equal(catalog.tags.r.filter(tag=>tag==='Confirmed').length,1);
metadata.children[1].onclick();assert.equal(metadata.open,false);
addSection().children[1].children[1].onclick();metadata=metadataDialog();metadataForm=metadata.children[0];metadataInput=metadataForm.children[2].children[0];assert.equal(metadataInput.value,'My note');metadataInput.value='Updated note';await metadataForm.onsubmit({preventDefault(){}});assert.equal(catalog.resources.r.note,'Updated note');
addSection().children[1].children[0].onclick();metadata=metadataDialog();metadataForm=metadata.children[0];metadataInput=metadataForm.children[2].children[0];metadataInput.value='Keep my input';paired=false;await metadataForm.onsubmit({preventDefault(){}});assert.equal(metadata.open,true);assert.equal(metadataInput.value,'Keep my input');assert.match(metadataForm.children.find(el=>el.attrs.role==='status').textContent,/COMPANION_OFFLINE/);paired=true;
failMetadata=true;await metadataForm.onsubmit({preventDefault(){}});assert.equal(metadata.open,true);assert.match(metadataForm.children.find(el=>el.attrs.role==='status').textContent,/REVISION_CONFLICT/);assert.ok(!catalog.tags.r.includes('Keep my input'));failMetadata=false;metadata.close();
// A native bookmark without an Atlas resource is registered once with its exact URL.
delete catalog.resources.r;delete catalog.tags.r;
addSection().children[1].children[0].onclick();metadata=metadataDialog();metadataForm=metadata.children[0];metadataForm.children[2].children[0].value='New tag';await metadataForm.onsubmit({preventDefault(){}});assert.equal(catalog.resources['new-resource'].locators[0].reference,'https://z.example/');assert.deepEqual(catalog.tags['new-resource'],['New tag']);assert.equal(metadata.open,true);metadata.children[1].onclick();assert.equal(metadata.open,false);
// Add Item creates a durable gallery page with a visible link below the image.
assert.ok(preview.children.some(el=>el.tagName==='h3'&&el.textContent==='Associated Items'));
preview.children.find(el=>el.tagName==='button'&&el.textContent==='Add Item').onclick();
const dialog=created.filter(el=>el.tagName==='dialog').at(-1),form=dialog.children[0];
const titleControl=form.children.find(el=>el.tagName==='label'&&el.textContent==='Title').children[0];titleControl.value='My Gallery';
const templateControl=form.children.find(el=>el.tagName==='label'&&el.textContent==='Format').children[0];
const styleControl=form.children.find(el=>el.tagName==='label'&&el.textContent==='Appearance').children[0];assert.equal(styleControl.value,'nocturne');styleControl.value='solstice';
assert.equal(templateControl.value,'gallery');assert.equal(templateControl.children.length,1);assert.ok(!form.children.some(el=>el.textContent==='Bookmark collection'));
await form.onsubmit({preventDefault(){}});await tick();
assert.ok(preview.children.flatMap(el=>[el,...el.children]).some(el=>el.tagName==='a'&&el.textContent==='▧ My Gallery'&&el.href.includes('page.html?id=')));
const storedPage=storage[pagesModule.PAGE_PREFIX+'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'];assert.equal(storedPage.template,'gallery');assert.equal(storedPage.galleryStyle,'solstice');
assert.equal(storedPage.title,'My Gallery');
assert.equal(storedPage.images.length,24);
assert.ok(storedPage.images.every(image=>image.title&&image.article.split('\n\n').length===5));
assert.equal(new Set(storedPage.images.map(image=>image.id)).size,24);
// Pinboard is its own Add Item choice, not a gallery with a different label.
const kindControl=form.children.find(el=>el.tagName==='label'&&el.textContent==='Type').children[0];kindControl.value='pinboard';kindControl.onchange();
assert.equal(form.children.find(el=>el.textContent==='Appearance').hidden,true);assert.equal(templateControl.value,'2010s');assert.equal(templateControl.children.length,1);
titleControl.value='My Pins';await form.onsubmit({preventDefault(){}});await tick();
assert.ok(preview.children.flatMap(el=>[el,...el.children]).some(el=>el.tagName==='a'&&el.textContent==='▧ My Pins'&&el.href.includes('pinboard.html?id=')));
assert.equal((await pinboards.linkedPinboards(context.chrome.storage.local,nodes.get('3'))).length,1);
const pinRow=preview.children.find(el=>el.className==='associated-gallery-row'&&el.children[0].textContent==='▧ My Pins');
context.confirm=()=>true;await pinRow.children[1].onclick();context.confirm=()=>false;
assert.equal((await pinboards.linkedPinboards(context.chrome.storage.local,nodes.get('3'))).length,0);
// Clearing Chrome cache does not destroy the separately saved native record.
nativePages[storedPage.id]={...storedPage,libraryRevision:1};delete storage[pagesModule.PAGE_PREFIX+storedPage.id];delete storage[pagesModule.ITEM_PREFIX+'3'];
preview.children[0].onclick();rows=els.get('bookmarks-list').children;rows[0].children[0].onclick();
for(let i=0;i<5;i++)await tick();
assert.equal(storage[pagesModule.PAGE_PREFIX+storedPage.id].title,'My Gallery');
assert.ok(preview.children.flatMap(el=>[el,...el.children]).some(el=>el.tagName==='a'&&el.textContent==='▧ My Gallery'));
// Cancel preserves the gallery; confirmed deletion persists a marker and stays hidden after recovery.
let deleteControl=preview.children.find(el=>el.className==='associated-gallery-row').children[1];
await deleteControl.onclick();assert.equal(storage[pagesModule.PAGE_PREFIX+storedPage.id].deleted,undefined);
context.confirm=()=>true;
context.saveLibraryPage=async page=>{nativePages[page.id]={...page,libraryRevision:2};return {libraryRevision:2};};
await deleteControl.onclick();await tick();
assert.equal(nativePages[storedPage.id].deleted,true);
assert.ok(!preview.children.some(el=>el.className==='associated-gallery-row'));
delete storage[pagesModule.PAGE_PREFIX+storedPage.id];delete storage[pagesModule.ITEM_PREFIX+'3'];
preview.children[0].onclick();rows=els.get('bookmarks-list').children;rows[0].children[0].onclick();
for(let i=0;i<5;i++)await tick();
assert.ok(!preview.children.some(el=>el.className==='associated-gallery-row'));
context.confirm=()=>false;
const esc={key:'Escape',target:new El(),preventDefault(){},stopPropagation(){}};
els.get('bookmarks-workspace').handlers.keydown(esc);rows=els.get('bookmarks-list').children;assert.equal(rows.length,4);
await rows[0].children[2].children[1].children[0].onclick();assert.equal(nodes.get('3').title,'Renamed');
els.get('bookmarks-search').value='a.example';els.get('bookmarks-search').oninput();
assert.equal(els.get('bookmarks-list').children.length,1);assert.equal(els.get('bookmarks-new').disabled,true);
failRead=true;await els.get('bookmarks-refresh').onclick();assert.match(els.get('bookmarks-status').textContent,/BOOKMARK_READ_FAILED/);
els.get('home').handlers.click();assert.equal(classes.has('bookmarks-mode'),false);
assert.ok(events.onMoved && events.onRemoved && events.onImportEnded);
// Imported/hostile cover values cannot become executable image sources.
assert.equal(coversModule.safeCover('data:image/svg+xml;base64,AAAA'),false);
assert.equal(coversModule.directImage('javascript:alert(1).png'),null);
assert.equal(coversModule.directImage('https://example.com/cover.jpg?size=large'),'https://example.com/cover.jpg?size=large');
assert.equal(coversModule.bookmarkCover({id:'3',url:'https://changed.example/'},storage[coversModule.COVER_KEY]),null);
assert.equal(coversModule.setBookmarkCover({},nodes.get('3'),'https://example.com/x.png')['3'].image,'https://example.com/x.png');
assert.throws(()=>coversModule.setBookmarkCover({},nodes.get('3'),'https://u:p@example.com/x.png'));
assert.throws(()=>coversModule.setBookmarkCover({},nodes.get('3'),'javascript:alert(1)'));
assert.throws(()=>coversModule.setBookmarkCover({},nodes.get('3'),'https://example.com/x?token=secret'));
assert.throws(()=>coversModule.setBookmarkCover({padding:'x'.repeat(coversModule.MAX_COVERS_BYTES)},nodes.get('3'),dataImage),/STORAGE_FULL/);
console.log('PASS: native bookmark hierarchy, current-tab titles, independent disclosure/back/Esc, saved images, exact linked metadata, URL/cover safety, quota bounds and existing CRUD (API/DOM doubles; actual Chrome NOT_RUN).');

// The former four-million-character ceiling no longer blocks image additions.
const largerCovers=coversModule.setBookmarkCover({padding:'x'.repeat(4000001)},nodes.get('3'),dataImage);
assert.ok(coversModule.coverStorageBytes(largerCovers)>4000000);
assert.equal(coversModule.coverStorageBytes({label:'é'}),new TextEncoder().encode(JSON.stringify({label:'é'})).length);
assert.ok(JSON.parse(readFileSync(new URL('../extension/manifest.json',import.meta.url),'utf8')).permissions.includes('unlimitedStorage'));
assert.equal(coversModule.coverBudgetMiB(undefined),64);
assert.equal(coversModule.coverBudgetMiB(128),128);
assert.equal(coversModule.coverBudgetMiB(-1),64);
assert.equal(coversModule.coverBudgetMiB(512.5),64);
const overSmall={padding:'x'.repeat(9*1024*1024)};
assert.throws(()=>coversModule.setBookmarkCover(overSmall,nodes.get('3'),dataImage,8),/STORAGE_FULL/);
assert.doesNotThrow(()=>coversModule.setBookmarkCover(overSmall,nodes.get('3'),dataImage,16));
// Lowering the budget must never prevent explicit cover removal, even while over budget.
assert.doesNotThrow(()=>coversModule.setBookmarkCover(overSmall,nodes.get('3'),null,8));

// + Bookmark copies the highlighted item to an existing or newly created folder.
failRead=false;await els.get('bookmarks-refresh').onclick();
let newId=100;
bookmarks.create=async details=>{const node={id:String(newId++),...details,...(!details.url?{children:[]}:{} )};nodes.set(node.id,node);nodes.get(details.parentId).children.push(node);calls.push(['create',details]);return node;};
vm.runInContext("selected='3';folder='1';focused=null;render()",context);
els.get('bookmarks-new').onclick();
let copyDialog=created.filter(e=>e.tagName==='dialog').at(-1),copyForm=copyDialog.children[0];
copyForm.children[2].children[0].value='4';await copyForm.onsubmit({preventDefault(){}});
assert.equal(nodes.get('3').parentId,'1');assert.ok(nodes.get('4').children.some(n=>n.url===nodes.get('3').url));
const beforeCopies=calls.filter(c=>c[0]==='create').length;
vm.runInContext("selected='3'",context);els.get('bookmarks-new').onclick();copyForm=created.filter(e=>e.tagName==='dialog').at(-1).children[0];copyForm.children[2].children[0].value='4';await copyForm.onsubmit({preventDefault(){}});
assert.equal(calls.filter(c=>c[0]==='create').length,beforeCopies,'Same folder must not gain a duplicate');
vm.runInContext("selected='3'",context);els.get('bookmarks-new').onclick();copyForm=created.filter(e=>e.tagName==='dialog').at(-1).children[0];copyForm.children[2].children[0].value='1';copyForm.children[3].children[0].value='New destination';await copyForm.onsubmit({preventDefault(){}});
const newFolder=[...nodes.values()].find(n=>n.title==='New destination');assert.ok(newFolder.children.some(n=>n.url===nodes.get('3').url));
