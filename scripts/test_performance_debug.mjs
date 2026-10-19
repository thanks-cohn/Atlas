import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
let now=0,id=0;const frames=new Map(),timers=new Map(),listeners=new Map(),observers=[];
const document={hidden:false,documentElement:{hasAttribute:()=>false},querySelectorAll:selector=>selector==='#pins .pin'?[{},{}]:selector==='img'?[{complete:false}]:[]};
class Observer{
 static supportedEntryTypes=['longtask','event','resource','layout-shift'];
 constructor(fn){this.fn=fn;observers.push(this);}observe(options){this.type=options.type;}disconnect(){this.disconnected=true;}
}
const env={document,location:{href:'chrome-extension://atlas/pinboard.html'},performance:{now:()=>now},PerformanceObserver:Observer,
 requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:key=>frames.delete(key),
 setTimeout:(fn,ms)=>{timers.set(++id,{fn,at:now+ms});return id;},clearTimeout:key=>timers.delete(key),
 addEventListener:(name,fn)=>{const list=listeners.get(name) || [];list.push(fn);listeners.set(name,list);},removeEventListener:(name,fn)=>listeners.set(name,(listeners.get(name) || []).filter(item=>item!==fn))};
const fire=(name,event={})=>{for(const fn of [...(listeners.get(name) || [])])fn(event);};
const frame=ms=>{now+=ms;const batch=[...frames.values()];frames.clear();for(const fn of batch)fn(now);};
vm.runInNewContext(readFileSync('extension/performance-debug.js','utf8'),{window:env,URL,Promise,Number,Math,Object,Map,Set});
const api=env.atlasDebug.performance;
assert.equal(api.isActive(),false);assert.equal(frames.size,0);assert.equal(timers.size,0,'No sampling until explicitly enabled');
assert.equal(api.start({durationMs:999999}).duration_ms,30000);
const finish=api.begin('preview.open-handler');now+=120;finish();finish();assert.equal(api.snapshot().totals.span,1);
fire('keydown',{timeStamp:now-150,isTrusted:true,key:'PRIVATE_TYPED_KEY'});
const painted=api.afterPaint('preview.open');frame(16);frame(16);assert.equal((await painted).status,'opportunity');
for(const observer of observers){if(observer.type==='longtask')observer.fn({getEntries:()=>[{duration:180,name:'PRIVATE_URL'}]});if(observer.type==='resource')observer.fn({getEntries:()=>[{duration:200,initiatorType:'fetch',name:'https://secret.example/private?token=SECRET'}]});}
assert.equal(api.check().rules.find(item=>item.name==='trusted-input-queue').status,'over-budget');
assert.equal(api.snapshot().dom.mounted_cards,2);
assert(!JSON.stringify(api.snapshot()).includes('PRIVATE'));assert(!JSON.stringify(api.snapshot()).includes('secret.example'));
for(let index=0;index<600;index++)frame(16);
let report=api.snapshot();assert(report.samples.length<=report.sample_limit);assert(report.dropped_samples>0);assert(report.summary['span:preview.open-handler'],'Frame samples do not erase the interaction measurement');
document.hidden=true;fire('visibilitychange');frame(1000);document.hidden=false;fire('visibilitychange');frame(16);frame(16);
assert(!api.snapshot().samples.some(item=>item.type==='frame' && item.duration_ms>=1000),'Hidden frames are not classified as stalls');
const pending=api.afterPaint('cancelled-paint');const extraPaints=Array.from({length:10},()=>api.afterPaint('burst'));assert((await extraPaints.at(-1)).status==='coalesced','Pending paint probes are bounded');api.stop();assert.equal((await pending).status,'cancelled');assert.equal(frames.size,0);assert.equal(timers.size,0);assert([...listeners.values()].every(list=>list.length===0));assert(observers.every(item=>item.disconnected));
api.clear();assert.equal(api.snapshot().samples.length,0);
api.start({durationMs:250});const deadline=[...timers.values()].find(timer=>timer.at===now+250);now+=250;deadline.fn();assert.equal(api.isActive(),false,'Capture stops at deadline');
await assert.rejects(()=>api.run('missing'),/NOT_ACTIVE/);
api.start();api.register('test',async()=>({ok:true}));assert.deepEqual(await api.run('test'),{ok:true});await assert.rejects(()=>api.run('missing'),/UNAVAILABLE/);api.stop();
env.PerformanceObserver=undefined;api.start();assert.equal(api.snapshot().support.longtask,false);assert.equal(api.check().rules.find(item=>item.name==='trusted-input-queue').status,'insufficient-data');api.stop();
console.log('PASS: opt-in idle cost, capture deadline/cleanup, bounded samples, retained interaction spans, input budgets, observer capability gaps, privacy, hidden-tab exclusion, paint cancellation and scenario API.');
