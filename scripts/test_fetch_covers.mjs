import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../extension/fetch-covers.js',import.meta.url),'utf8');
const {coverURL,coverCandidates,boundedResponse,retrieveCover,installCoverFetch}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
for(const url of ['http://127.0.0.1/a','http://192.168.1.1','http://[::1]/','https://localhost/','file:///a','javascript:alert(1)','https://user:pass@example.com','https://example.com/?token=secret'])assert.equal(coverURL(url),null,url);
assert.deepEqual(coverCandidates(`<script><meta property="og:image" content="https://bad.example/a"></script><meta name='twitter:image' content='/twitter.png'><meta content="/cover.jpg?a=1&amp;b=2" property="og:image"><meta property="og:image" content="javascript:alert(1)">`,'https://example.com/story'),['https://example.com/cover.jpg?a=1&b=2','https://example.com/twitter.png']);
const signal=new AbortController().signal;
await assert.rejects(()=>boundedResponse(new Response('12345'),4,signal),/COVER_RESPONSE_TOO_LARGE/);
await assert.rejects(()=>boundedResponse(new Response('no',{status:403}),10,signal),/COVER_HTTP_403/);
const requests=[];
const fetcher=async(url,options)=>{requests.push([url,options]);return url.endsWith('/story')?new Response('<meta property="og:image" content="/photo.png">',{headers:{'content-type':'text/html'}}):new Response('image-bytes',{headers:{'content-type':'image/png'}});};
assert.equal(await retrieveCover('https://example.com/story',signal,async blob=>{assert.equal(await blob.text(),'image-bytes');return 'preview';},fetcher),'preview');
assert.equal(requests.length,2);for(const [,options] of requests){assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');assert.equal(options.referrerPolicy,'no-referrer');}
// Test queue scope, serial work, durable resume, visible-only selection and cancellation.
const elements=new Map(),$=id=>{if(!elements.has(id))elements.set(id,{value:'all'});return elements.get(id);};
globalThis.document={getElementById:$};globalThis.location={href:'chrome-extension://atlas/pinboard.html'};globalThis.window={innerHeight:500};
const data={};let permission=true,reads=0,active=0,maxActive=0,abortCount=0,block=false;
globalThis.chrome={permissions:{request:async()=>permission},storage:{local:{get:async key=>({[key]:data[key]}),set:async record=>Object.assign(data,structuredClone(record))}}};
globalThis.fetch=async(url,{signal})=>{reads++;active++;maxActive=Math.max(maxActive,active);try{if(block)await new Promise((resolve,reject)=>signal.addEventListener('abort',()=>{abortCount++;reject(new DOMException('Cancelled','AbortError'));},{once:true}));return new Response('<meta property="og:image" content="/cover.png">',{headers:{'content-type':'text/html'}});}finally{active--;}};
const nodes=[{id:'1',url:'https://example.com/a'},{id:'2',url:'https://example.com/b'},{id:'3',url:'https://example.com/c'}],saved=new Set(['1']);let scope='folder-a';
const options={getScope:()=>scope,getNodes:()=>nodes,getMounted:()=>nodes.map((node,i)=>({node,element:{getBoundingClientRect:()=>({top:i===2?600:10,bottom:i===2?650:50})}})),hasCover:node=>saved.has(node.id),saveCover:async node=>{saved.add(node.id);return true;},raster:async()=> 'raster',onSaved:()=>{}};
const tick=()=>new Promise(r=>setTimeout(r,20));
let queue=installCoverFetch(options);permission=false;await $('fetch-start').onclick();assert.equal(reads,0);permission=true;
$('fetch-mode').value='visible';await $('fetch-start').onclick();await tick();assert.deepEqual([...saved],['1','2']);assert.equal(reads,2);assert.equal(maxActive,1);queue.stop();
// Reload: checkpoint skips successful items. All mode queues only the supplied collection.
queue=installCoverFetch(options);$('fetch-mode').value='all';await $('fetch-start').onclick();await tick();assert.ok(saved.has('3'));assert.equal(reads,4);assert.match($('fetch-progress').textContent,/Finished/);
// Cancellation aborts active work; nothing is marked saved, so resume retries it.
scope='folder-b';saved.delete('2');block=true;await queue.request(nodes[1]);await tick();queue.stop();await tick();assert.equal(abortCount,1);assert.equal(saved.has('2'),false);
block=false;await queue.request(nodes[1]);await tick();assert.ok(saved.has('2'));queue.stop();
console.log('PASS: metadata selection, unsafe URLs, response bounds, cookie-free requests, permission denial, collection queue, serial work, visible-only discovery, checkpoint resume and abort/retry (API doubles; Chrome network NOT_RUN).');
