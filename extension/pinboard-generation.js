export async function imageReference(source) {
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(source || ''));
  return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
}
// Explicit user action only. The companion owns durable per-model evidence.
export async function generationImage(source) {
  if (!source) throw Error('Choose an image first.');
  let blob;
  if (source.startsWith('data:')) {
    // Decode local covers without fetch: connect-src deliberately excludes data:.
    const match=/^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(source);
    if(!match || match[2].length>14*1024*1024)throw Error('Choose a supported image below 10 MB.');
    const raw=atob(match[2]);
    if(raw.length>10*1024*1024)throw Error('Choose an image below 10 MB for tagging.');
    blob=new Blob([Uint8Array.from(raw,char=>char.charCodeAt(0))],{type:match[1]});
  } else {
    if (!/^https?:/.test(source))throw Error('Choose a local image or an HTTP image URL.');
    const origin=new URL(source).origin+'/*';
    if (!await chrome.permissions.request({origins:[origin]})) throw Error('Allow access to this image site, or choose a local image.');
    const response = await fetch(source, {credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(20000)});
    if (!response.ok) throw Error('Image could not be loaded.');
    const reader=response.body.getReader(),parts=[];let size=0;
    try {
      while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>10*1024*1024)throw Error('Choose an image below 10 MB for tagging.');parts.push(value);}
    } finally {await reader.cancel();}
    blob = new Blob(parts,{type:response.headers.get('Content-Type') || 'application/octet-stream'});
  }
  const {rasterImage} = await import('./image-file.js');
  return rasterImage(blob);
}

export async function generateModels({node,image,choices,send,save,status}) {
  const models = [];
  if (choices.objects || choices.people) models.push('objects');
  if (choices.face) models.push('face');
  if (choices.anime) models.push('anime');
  const results = {};
  for (const model of models) {
    status('Generating '+({objects:'Image tags',face:'Faces',people:'People',anime:'Anime'}[model])+'…');
    const response = await send({type:'api',path:'/v1/tag-image',body:{model,image,item_id:node.itemKey || node.url,display_choices:choices}});
    const result=response?.data || response;
    if (response?.ok===false || !Array.isArray(result?.suggestions)) {
      const error = response?.error;
      throw Error((error?.code ? error.code+': ' : '')+(error?.message || 'Companion did not return tag predictions.'));
    }
    // Preserve original predictions. Display selection is a separate field.
    const source=result.source || model;
    results[source] = {...result,display_choices:{...choices}};
    await save(source,results[source]);
    // New companions split photo tagging from structured People; old helpers
    // keep their shared Things/People pass. Never run a second Faces alias.
    if(model==='objects' && result.people_source==='people' && (choices.people || choices.face)){
      const faceIndex=models.indexOf('face');
      if(faceIndex!==-1)models.splice(faceIndex,1);
      models.splice(models.indexOf(model)+1,0,'people');
    }
  }
  return results;
}

// Accept older single-result storage without rewriting original evidence.
export function modelRuns(value){return Array.isArray(value)?value:(value?[value]:[]);}

export function tagKey(label){return label.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();}

export function checkpointState(history,number){
  const chain=[],seen=new Set();let checkpoint=history.checkpoints.find(c=>c.number===number);
  while(checkpoint){
    if(seen.has(checkpoint.number))throw Error('Cyclic tag checkpoint.');
    seen.add(checkpoint.number);chain.push(checkpoint);
    checkpoint=checkpoint.base?history.checkpoints.find(c=>c.number===checkpoint.base):null;
  }
  const tags=new Map();
  for(const state of chain.reverse()){
    for(const key of state.removed || [])tags.delete(key);
    for(const tag of state.tags || state.added || [])tags.set(tag.key,tag);
  }
  return [...tags.values()];
}

// Compact presentation checkpoints are separate from untouched inference runs.
// Identical states share a checkpoint, while every execution retains a reference.
export function checkpointTags(current,runs,reference,execution,animeEnabled=false,presentation={}){
  const labels=new Map(),removed=new Set(Object.keys(presentation.removed || {}).map(tagKey));
  for(const label of presentation.human || [])if(typeof label==='string' && tagKey(label))labels.set(tagKey(label),label.trim());
  for(const tag of generatedTags(runs,reference,animeEnabled))if(!removed.has(tagKey(tag.label)) && !labels.has(tagKey(tag.label)))labels.set(tagKey(tag.label),tag.label);
  const tags=[...labels].map(([key,label])=>({key,label})).sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0);
  const signature=JSON.stringify(tags.map(t=>t.key));
  const next=structuredClone(current || {schema:1,checkpoints:[],executions:[]});
  if(next.executions.some(e=>e.source===execution.source && e.run_id && e.run_id===execution.run_id))return next;
  const previous=next.checkpoints.find(c=>c.number===next.current && c.image_reference===reference);
  let checkpoint=next.checkpoints.find(c=>c.image_reference===reference && c.signature===signature);
  if(!checkpoint){
    const before=new Map((previous?checkpointState(next,previous.number):[]).map(t=>[t.key,t]));
    const after=new Set(tags.map(t=>t.key));
    checkpoint={number:next.checkpoints.length+1,image_reference:reference,signature,created_at:execution.at,
      ...(previous?{base:previous.number,added:tags.filter(t=>!before.has(t.key)),removed:[...before.keys()].filter(key=>!after.has(key))}:{tags})};
    next.checkpoints.push(checkpoint);
  }
  next.executions.push({...execution,number:next.executions.length+1,checkpoint:checkpoint.number,
    previous:previous?.number || null,change:previous?.number===checkpoint.number?'unchanged':previous?'changed':'initial'});
  next.current=checkpoint.number;
  next.current_tags=tags.map(t=>t.label);
  return next;
}

// Runs are additive for one chosen cover. Encoded preview bytes may vary between
// requests; the stable cover reference decides whether this is the same image.
export function mergeGeneratedRun(current,source,result){
  if(!['objects','people','face','anime'].includes(source) || !result.image_reference)throw Error('Missing model or image identity.');
  const next={};
  for(const key of ['objects','people','face','anime']){
    const matching=modelRuns(current?.[key]).filter(run=>run.image_reference===result.image_reference);
    if(matching.length)next[key]=matching;
  }
  const prior=next[source] || [];
  const signature=run=>JSON.stringify({model:run.model,choices:run.display_choices,
    tags:[...new Set((run.suggestions || []).filter(s=>typeof s.tag==='string').map(s=>tagKey(s.tag)))].sort(),
    people:run.people,aggregation:run.aggregation,person_count:run.person_count});
  const identity=signature(result);
  // Original per-execution scores/evidence remain in the companion journal.
  // Browser current state stores one copy of equivalent output, newest last.
  next[source]=[...prior.filter(run=>(!result.run_id || run.run_id!==result.run_id) && signature(run)!==identity),result];
  return next;
}

// Derived presentation only. Each run keeps its own original predictions,
// display choices and provenance; a later request cannot erase earlier choices.
export function generatedTags(runs,reference,animeEnabled=false) {
  const grouped=new Map();
  for(const source of ['objects','people','face','anime']){
    if(source==='anime' && !animeEnabled)continue;
    const matching=modelRuns(runs?.[source]).filter(run=>reference && run.image_reference===reference);
    for(const run of matching){
      if(!reference || run.image_reference!==reference)continue;
      for(const suggestion of run.suggestions || []){
        if(typeof suggestion.tag!=='string')continue;
        // Count assertions describe one image in one run, never a sum of runs.
        if(source==='people' && run!==matching.at(-1))continue;
        const label=suggestion.tag.trim().replace(/\s+/g,' '),key=tagKey(label);
        if(source==='objects' && run.display_choices && !run.display_choices[suggestion.category || (Object.hasOwn(run.display_choices,'people') && key==='person' ? 'people' : 'objects')])continue;
        if(!key)continue;
        if(!grouped.has(key))grouped.set(key,{label,sources:[]});
        grouped.get(key).sources.push({source,model:run.model,run_id:run.run_id,score:suggestion.score});
      }
    }
  }
  return [...grouped.values()];
}
