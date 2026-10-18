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
