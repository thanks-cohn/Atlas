import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const text=readFileSync(new URL('../extension/pinboard-generation.js',import.meta.url),'utf8');
const {generateModels}=await import('data:text/javascript;base64,'+Buffer.from(text).toString('base64'));
let calls=[],saved=[];
const options={node:{url:'https://example.com/'},image:'data:image/png;base64,AA==',choices:{objects:true,people:true,face:true,anime:false},status:()=>{},save:async(source,result)=>saved.push({source,result}),send:async request=>{calls.push(request);return {ok:true,source:request.body.model,model:'example',suggestions:[{tag:'smile',score:.8}]};}};
await generateModels(options);
assert.deepEqual(calls.map(x=>x.body.model),['objects','face']);
assert.equal(saved.length,2);assert.equal(saved[0].result.suggestions[0].tag,'smile');
assert.equal(calls[0].body.item_id,'https://example.com/');
calls=[];saved=[];
await generateModels({...options,choices:{anime:true}});assert.deepEqual(calls.map(x=>x.body.model),['anime']);
calls=[];saved=[];
await assert.rejects(()=>generateModels({...options,send:async request=>request.body.model==='objects'?{data:{suggestions:[]}}:{ok:false,error:{code:'TAG_BUSY',message:'Busy'}}}),/TAG_BUSY/);
assert.equal(saved.length,1); // Completed source survives a later source failure.
console.log('PASS: explicit sequential generation, shared Things/People pass, Anime selection, original predictions and partial success.');
const generationStub=await import('data:text/javascript;base64,'+Buffer.from(text.replace("const {rasterImage} = await import('./image-file.js');","const rasterImage=async blob=>({size:blob.size,type:blob.type});")).toString('base64'));
const originalFetch=globalThis.fetch;globalThis.fetch=()=>{throw Error('Local image must not use fetch');};
try {
  assert.deepEqual(await generationStub.generationImage('data:image/png;base64,AA=='),{size:1,type:'image/png'});
  await assert.rejects(()=>generationStub.generationImage('data:image/svg+xml;base64,AA=='),/supported image/);
} finally {globalThis.fetch=originalFetch;}
console.log('PASS: local covers decode without network/CSP changes; unsupported data media rejected.');

const {generatedTags}=await import('data:text/javascript;base64,'+Buffer.from(text).toString('base64'));
const runs={objects:{image_reference:'current',display_choices:{objects:true,people:false},suggestions:[{tag:'Cat',score:.8},{tag:'person',score:.9}]},anime:{image_reference:'current',suggestions:[{tag:'cat',score:.7},{tag:'smile',score:.6}]},face:{image_reference:'old',suggestions:[{tag:'stale'}]}};
const original=JSON.stringify(runs);
assert.deepEqual(generatedTags(runs,'current',false).map(t=>t.label),['Cat']);
const visible=generatedTags(runs,'current',true);
assert.deepEqual(visible.map(t=>t.label),['Cat','smile']);assert.equal(visible[0].sources.length,2);
assert.deepEqual(generatedTags(runs,'replacement',true),[]);
assert.equal(JSON.stringify(runs),original);
console.log('PASS: generated card projection keeps provenance, deduplicates sources, honors image/Anime/display gates and never mutates evidence.');

const {mergeGeneratedRun}=await import('data:text/javascript;base64,'+Buffer.from(text).toString('base64'));
const first={run_id:'things-1',model:'detector',image_reference:'cover',image_payload_sha256:'encoded-a',display_choices:{objects:true,people:false},suggestions:[{tag:'cat',score:.9},{tag:'person',score:.8}]};
const people={...first,run_id:'people-1',image_payload_sha256:'encoded-b',display_choices:{objects:false,people:true},suggestions:[{tag:'person',score:.85}]};
let accumulated=mergeGeneratedRun({},'objects',first);
accumulated=mergeGeneratedRun(accumulated,'objects',people);
assert.deepEqual(generatedTags(accumulated,'cover').map(t=>t.label),['cat','person']);
const faces={run_id:'faces-1',image_reference:'cover',image_payload_sha256:'encoded-c',model:'faces',suggestions:[{tag:'smile',score:.7}]};
accumulated=mergeGeneratedRun(accumulated,'face',faces);
assert.deepEqual(generatedTags(accumulated,'cover').map(t=>t.label),['cat','person','smile']);
accumulated=mergeGeneratedRun(accumulated,'objects',{...people,run_id:'empty-1',suggestions:[]});
assert.deepEqual(generatedTags(accumulated,'cover').map(t=>t.label),['cat','person','smile']);
assert.equal(accumulated.objects.length,3);
assert.equal(mergeGeneratedRun(accumulated,'face',faces).face.length,1);
const replaced=mergeGeneratedRun(accumulated,'face',{...faces,run_id:'new-cover',image_reference:'replacement'});
assert.deepEqual(Object.keys(replaced),['face']);
const migrated=mergeGeneratedRun({objects:first},'face',faces);
assert.deepEqual(generatedTags(migrated,'cover').map(t=>t.label),['cat','smile']);
assert.equal(first.display_choices.people,false);assert.equal(first.image_payload_sha256,'encoded-a');
console.log('PASS: Things → People → Faces and empty reruns accumulate, preview re-encoding does not erase tags, same-run saves are idempotent, legacy records migrate and replacement covers remain isolated.');

// New rich helpers advertise the split after Things. Legacy helpers above keep
// their original shared pass; optional Anime still requires activation/selection.
calls=[];saved=[];
await generateModels({...options,choices:{objects:true,people:true,face:true,anime:false},send:async request=>{
 calls.push(request);return {ok:true,source:request.body.model,model:'rich-test',people_source:request.body.model==='objects'?'people':undefined,suggestions:[]};
}});
assert.deepEqual(calls.map(x=>x.body.model),['objects','people']);
assert.deepEqual(saved.map(x=>x.source),['objects','people']);
const structured={run_id:'person-run',source:'people',model:'mivolo',image_reference:'cover',people:[{age_estimate:32}],suggestions:[{tag:'1 adult male',score:null,category:'people'}]};
const withPeople=mergeGeneratedRun(accumulated,'people',structured);
assert.equal(withPeople.people[0].people[0].age_estimate,32);
assert(generatedTags(withPeople,'cover').some(t=>t.label==='1 adult male'));
assert(!generatedTags(withPeople,'cover').some(t=>t.sources.some(s=>s.source==='anime')));
console.log('PASS: rich Things/People split runs once, structured source survives storage, Anime remains opt-in.');

const {checkpointTags,tagKey}=await import('data:text/javascript;base64,'+Buffer.from(readFileSync(new URL('../extension/pinboard-generation.js',import.meta.url),'utf8')).toString('base64'));
const repeated={...structured,run_id:'person-run-2',suggestions:[{tag:' 1   person ',category:'people'}],person_count:1};
let compact=mergeGeneratedRun({},'people',repeated);
let history=checkpointTags(null,compact,'cover',{source:'people',run_id:repeated.run_id,batch_id:'batch-1',at:'2026-10-19T06:00:00Z'});
compact=mergeGeneratedRun(compact,'people',{...repeated,run_id:'person-run-3'});
history=checkpointTags(history,compact,'cover',{source:'people',run_id:'person-run-3',batch_id:'batch-2',at:'2026-10-19T06:01:00Z'});
assert.equal(compact.people.length,1);
assert.deepEqual(generatedTags(compact,'cover').map(t=>t.label),['1 person']);
assert.equal(history.checkpoints.length,1);assert.equal(history.executions.length,2);
assert.equal(history.executions[0].checkpoint,history.executions[1].checkpoint);
assert.equal(checkpointTags(history,compact,'cover',history.executions[1]).executions.length,2);
const changed=mergeGeneratedRun(compact,'people',{...repeated,run_id:'person-run-4',person_count:2,suggestions:[{tag:'2 people',count_key:'people'}]});
assert.deepEqual(generatedTags(changed,'cover').map(t=>t.label),['2 people']);
assert.equal(changed.people.length,2); // Different historical state remains available.
history=checkpointTags(history,changed,'cover',{source:'people',run_id:'person-run-4',batch_id:'batch-3',at:'2026-10-19T06:02:00Z'});
assert.equal(history.checkpoints.length,2);assert.equal(history.current,2);
assert.equal(tagKey(' ＣＡＴ  '),'cat');
console.log('PASS: equivalent runs share one browser result/checkpoint, executions retain batch/time references, latest People counts replace old count assertions.');

// Exercise the actual asynchronous renderer with two overlapping reads finishing
// out of order. A stale completion must neither append chips nor replace errors.
const pinboard=readFileSync(new URL('../extension/pinboard.js',import.meta.url),'utf8');
const render=pinboard.slice(pinboard.indexOf('async function showGeneratedTags(node){'),pinboard.indexOf("\n$('run-image-tagging').onclick"));
let pending=[];const host={children:[],replaceChildren(...children){this.children=children;},append(...children){this.children.push(...children);}};
const chrome={storage:{local:{get:key=>key==='runs'?new Promise(resolve=>pending.push(resolve)):Promise.resolve({anime:false})}}};
const selected={id:'same'},itemKey=node=>node?.id;
const show=new Function('chrome','$','imageReference','imageFor','itemKey','selected','humanTagsFor','generatedTags','tagKey','removedTags','removableTag','el',`let generatedRenderVersion=0; const TAGGING_RESULTS='runs',JOYTAG_ACTIVATED='anime'; ${render}; return showGeneratedTags;`)(chrome,()=>host,async()=> 'cover',()=> 'image',itemKey,selected,()=>[],generatedTags,tagKey,()=>({}),(_node,label)=>({label}),(_type,label)=>({label}));
const older=show(selected),newer=show(selected);
pending[1]({runs:{same:compact}});await newer;
pending[0]({runs:{same:compact}});await older;
assert.deepEqual(host.children.map(c=>c.label),['1 person']);
console.log('PASS: overlapping actual renderer completions display one chip; stale reads cannot append duplicates.');
const {checkpointState}=await import('data:text/javascript;base64,'+Buffer.from(readFileSync(new URL('../extension/pinboard-generation.js',import.meta.url),'utf8')).toString('base64'));
assert.equal(history.executions[1].change,'unchanged');
assert.equal(history.checkpoints[1].base,1);
assert.equal(history.checkpoints[1].tags,undefined);
assert.deepEqual(history.checkpoints[1].added.map(t=>t.label),['2 people']);
assert.deepEqual(history.checkpoints[1].removed,['1 person']);
assert.deepEqual(checkpointState(history,2).map(t=>t.label),['2 people']);
const returned=checkpointTags(history,compact,'cover',{source:'people',run_id:'return-run',at:'2026-10-19T06:03:00Z'});
assert.equal(returned.checkpoints.length,2);assert.equal(returned.current,1);
assert.equal(returned.executions.at(-1).previous,2);
assert.equal(returned.executions.at(-1).change,'changed');
console.log('PASS: delta-only changed checkpoints reconstruct exactly; unchanged and returning states reference existing snapshots without copies.');
assert.deepEqual(returned.current_tags,['1 person']);
assert.equal(new Set(returned.current_tags.map(tagKey)).size,returned.current_tags.length);
assert.deepEqual(history.current_tags,['2 people']);
console.log('PASS: current_tags exposes the complete deduplicated presentation as direct JSON, without replaying history.');
const humanSnapshot=checkpointTags(null,compact,'cover',{source:'people',run_id:'human-check',at:'now'},false,{human:['Personal','PERSONAL'],removed:{'1 person':true}});
assert.deepEqual(humanSnapshot.current_tags,['PERSONAL']);
