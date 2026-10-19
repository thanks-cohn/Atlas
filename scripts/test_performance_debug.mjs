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

api.registerState('test-state',()=>({cards:24,ready:true,title:'PRIVATE',nested:{secret:true},invalid:Infinity}));
api.measure('render.positions-inspected',999);assert.deepEqual(api.snapshot().measurements,{});
api.start();for(let index=0;index<1000;index++)api.measure('render.positions-inspected',index%5);
const aggregate=api.snapshot().measurements['render.positions-inspected'];assert.equal(aggregate.count,1000);assert.equal(aggregate.mean,2);assert.equal(aggregate.max,4);
assert.equal(api.snapshot().application['test-state'].cards,24);assert(!JSON.stringify(api.snapshot()).includes('PRIVATE'));
for(let index=0;index<100;index++)api.measure('metric.'+index,index);assert.equal(Object.keys(api.snapshot().measurements).length,32);
api.stop();api.clear();assert.equal(Object.keys(api.snapshot().measurements).length,0);
console.log('PASS: bounded numeric aggregates survive sample eviction, idle measurement is inactive and application state excludes text and nested content.');

api.start();let release,scoped;api.register('waiting',async(_,probe)=>{scoped=probe;await new Promise(resolve=>release=resolve);return probe.isActive();});
const running=api.run('waiting');await assert.rejects(()=>api.run('test'),/BUSY/);api.stop();api.start();assert.equal(scoped.isActive(),false);release();assert.equal(await running,false);api.stop();
console.log('PASS: scenarios reject overlap and cannot continue measuring a replacement capture.');
// Prolonged capture keeps baseline + bounded trend points and cleans all work.
const beginSoak=now;assert.equal(api.soak({durationMs:999999}).duration_ms,600000);assert.equal(api.snapshot().mode,'soak');assert.equal(api.snapshot().timeline.length,1);
env.performance.memory={usedJSHeapSize:12345};
for(let index=0;index<75;index++){
 now+=5000;const heartbeat=[...timers].find(([,timer])=>timer.at<=now && timer.at!==beginSoak+600000);if(heartbeat){timers.delete(heartbeat[0]);heartbeat[1].fn();}
}
const soakReport=api.snapshot();assert.equal(soakReport.timeline.length,60);assert.equal(soakReport.timeline[0].at_ms,0,'Initial baseline survives long use');assert.equal(soakReport.timeline.at(-1).js_heap_bytes,12345);assert(soakReport.timeline.at(-1).at_ms>=300000);assert(soakReport.samples.length<=240);
api.stop();assert.equal(frames.size,0);assert.equal(timers.size,0);assert(!JSON.stringify(soakReport).includes('PRIVATE'));
api.start({durationMs:999999});assert.equal(api.snapshot().mode,'capture');assert.equal(api.snapshot().timeline.length,0);api.stop();
console.log('PASS: opt-in ten-minute soak retains baseline and bounded numeric trends, optional heap data and complete timer/listener cleanup.');
// Actual Settings controls start only on request and copy a stopped capture.
const controls=Object.fromEntries(['performance-record','performance-copy','performance-status','performance-report'].map(id=>[id,{hidden:true,value:'',focus(){},select(){}}]));
env.document={...document,readyState:'complete',getElementById:id=>controls[id]};let copied='';env.navigator={clipboard:{writeText:async text=>copied=text}};
vm.runInNewContext(readFileSync('extension/performance-debug.js','utf8'),{window:env,URL,Promise,Number,Math,Object,Map,Set});
assert.equal(env.atlasDebug.performance.isActive(),false);controls['performance-record'].onclick();assert.equal(env.atlasDebug.performance.isActive(),true);now+=100;await controls['performance-copy'].onclick();assert.equal(env.atlasDebug.performance.isActive(),false);assert.equal(JSON.parse(copied).mode,'soak');assert.equal(frames.size,0);assert.equal(timers.size,0);
env.navigator.clipboard.writeText=async()=>{throw Error('denied');};await controls['performance-copy'].onclick();assert.equal(controls['performance-report'].hidden,false);assert.equal(JSON.parse(controls['performance-report'].value).mode,'soak');
console.log('PASS: Settings recording/copy controls stay opt-in, stop on copy and provide a selectable report if clipboard access fails.');
