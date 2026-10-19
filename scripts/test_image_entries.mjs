import assert from 'node:assert/strict';
import {createImageEntries,IMAGE_ENTRIES,IMAGE_RECOVERY,RUNS,REMOVALS,entryKey,localImageOrigin} from '../extension/image-entries.js';
import {COVER_KEY} from '../extension/bookmark-covers.js';
let saved={},reject=false,sequence=0,tail=Promise.resolve();
const storage={get:async keys=>Object.fromEntries((Array.isArray(keys)?keys:[keys]).map(k=>[k,structuredClone(saved[k])])),set:async changes=>{if(reject)throw Error('Quota');Object.assign(saved,structuredClone(changes));}};
const store=createImageEntries({storage,uuid:()=>String(++sequence),lock:fn=>{const result=tail.then(fn);tail=result.catch(()=>{});return result;}});
const parent={id:'a',url:'https://site.example',title:'Example',aliases:['b']},owner=parent.url;
saved[RUNS]={[owner]:{objects:[{run_id:'old',suggestions:[{tag:'blue'}]}]}};saved[REMOVALS]={[owner]:{old:{actor:'human'}}};
const a=(await store.ensure(owner,parent,'https://images.example/a.jpg',{tags:['Human'],notes:[{id:'n',title:'Note',text:'A'}],bookmarks:[{id:'b',url:'https://other.example'}]})).entries[0];
assert.equal((await store.ensure(owner,parent,'https://images.example/changed.jpg')).entries.length,1);assert.equal(store.entry(owner,a.id).runs.objects[0].run_id,'old');assert.ok(saved[RUNS][entryKey(a.id)]);
const origin={provider:'local',filename:'b.png',path:null,sha256:'abc',hashStatus:'verified-original'};
const b=await store.add(owner,'data:image/png;base64,AA==',origin);assert.deepEqual(b.tags,[]);assert.deepEqual(b.notes,[]);assert.equal(store.gallery(owner).defaultId,a.id);
await store.mutate(owner,b.id,item=>{item.tags.push('B');item.notes.push({id:'bn',title:'B note',text:'Body'});});assert.deepEqual(store.entry(owner,a.id).tags,['Human']);
await store.setDefault(owner,b.id);assert.equal(saved[COVER_KEY].a.image,'data:image/png;base64,AA==');assert.equal(saved[COVER_KEY].b.image,'data:image/png;base64,AA==');
const before=structuredClone(saved);reject=true;await assert.rejects(()=>store.remove(owner,b.id),/Quota/);assert.deepEqual(saved,before);reject=false;
saved[RUNS][entryKey(b.id)]={anime:[{model:'JoyTag',run_id:'j',suggestions:[{tag:'B',score:.9}]}]};
const removed=await store.remove(owner,b.id);assert.equal(removed.entry.origin.filename,'b.png');assert.equal(removed.entry.image,undefined);assert.equal(removed.imageReference,null);assert.equal(removed.bytesRetained,false);assert.equal(removed.entry.runs.anime[0].model,'JoyTag');assert.equal(removed.entry.notes[0].text,'Body');assert.equal(store.gallery(owner).defaultId,a.id);
await store.restore(removed.id);await store.restore(removed.id);assert.equal(store.gallery(owner).entries.length,2);assert.equal(store.entry(owner,b.id).image,null);assert.equal(store.gallery(owner).defaultId,a.id);
const remote=await store.remove(owner,a.id);assert.equal(remote.imageReference,'https://images.example/a.jpg');assert.equal(remote.entry.tags[0],'Human');assert.equal(remote.entry.notes[0].id,'n');
await assert.rejects(()=>store.mutate(owner,a.id,item=>item.tags.push('Late')),/removed/);
await store.restore(remote.id);assert.equal(store.entry(owner,a.id).image,remote.imageReference);
const [c,d]=await Promise.all([store.add(owner,'https://images.example/same.jpg',{provider:'web',url:'https://images.example/same.jpg'}),store.add(owner,'https://images.example/same.jpg',{provider:'web',url:'https://images.example/same.jpg'})]);assert.notEqual(c.id,d.id);assert.equal(store.gallery(owner).entries.length,4);
const reloaded=createImageEntries({storage,lock:fn=>fn()});await reloaded.load();assert.equal(reloaded.entry(owner,c.id).id,c.id);assert.equal(saved[IMAGE_RECOVERY].length,2);assert.equal(saved[IMAGE_ENTRIES][owner].schema,1);
const file=new Blob(['abc'],{type:'image/png'});Object.defineProperty(file,'name',{value:'original.png'});const observed=await localImageOrigin(file);assert.equal(observed.sha256,'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');assert.equal(observed.path,null);
console.log('PASS: idempotent migration, independent entry JSON, original-byte hash, default aliases, atomic recovery failure, metadata-only removal, provenance restore, stale target rejection and concurrent additions.');
const identical={provider:'web',url:'https://images.example/same.jpg',sha256:'same-hash'};
const one=await store.add(owner,identical.url,identical);await store.mutate(owner,one.id,item=>{item.tags=['Only original'];item.notes=[{id:'only-one',title:'Private context',text:'Do not inherit'}];item.runs={objects:[{model:'one',suggestions:[{tag:'generated'}]}]};});
const two=await store.add(owner,identical.url,identical);assert.notEqual(one.id,two.id);assert.deepEqual(two.tags,[]);assert.deepEqual(two.notes,[]);assert.deepEqual(two.bookmarks,[]);assert.deepEqual(two.runs,{});assert.equal(two.origin.sha256,one.origin.sha256);
const {urlImageOrigin}=await import('../extension/image-entries.js');globalThis.chrome={permissions:{request:async()=>false}};const denied=await urlImageOrigin(identical.url);assert.equal(denied.url,identical.url);assert.equal(denied.sha256,null);assert.equal(denied.hashStatus,'unavailable');delete globalThis.chrome;
console.log('PASS: identical URL/hash can be added again with zero inherited human/model data; unreadable URL retains its origin without a fake digest.');

// A storage-change read begun before Add Image must not restore the old cache
// after the committed transaction, or count/arrows regress to one entry.
let releaseOldRead,holdRead=false;
const racingStorage={...storage,get:async keys=>{const value=await storage.get(keys);if(holdRead && keys===IMAGE_ENTRIES){holdRead=false;await new Promise(resolve=>releaseOldRead=resolve);}return value;}};
const racing=createImageEntries({storage:racingStorage,uuid:()=>String(++sequence),lock:fn=>fn()});
await racing.load();
const countBefore=racing.gallery(owner).entries.length;
holdRead=true;const staleLoad=racing.load();await new Promise(resolve=>setTimeout(resolve,0));
await racing.add(owner,'https://images.example/concurrent.jpg',{provider:'web'});
releaseOldRead();await staleLoad;
assert.equal(racing.gallery(owner).entries.length,countBefore+1,'A stale read must not erase the newly committed image from the view cache');
console.log('PASS: delayed pre-add storage reads cannot roll back gallery count/cache after commit.');
// Migrating an untagged legacy image must not emit empty global tag-state writes.
const writes=[],clean={};const quiet=createImageEntries({storage:{get:async keys=>Object.fromEntries(keys.map(key=>[key,clean[key]])),set:async value=>{writes.push(Object.keys(value));Object.assign(clean,value);}},lock:fn=>fn(),uuid:()=>crypto.randomUUID()});
await quiet.ensure('https://fixture.test/untagged',{id:'untagged',url:'https://fixture.test/untagged'},'https://fixture.test/image.jpg');
assert(writes.every(keys=>!keys.includes(RUNS) && !keys.includes(REMOVALS)),'Empty imports should not notify every tag-index consumer');
console.log('PASS: untagged legacy-gallery import does not write empty global model/removal maps; existing nonempty provenance migration remains tested.');
