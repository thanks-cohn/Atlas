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
    status('Generating '+({objects:'Things / People',face:'Faces',people:'People',anime:'Anime'}[model])+'…');
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
  next[source]=[...prior.filter(run=>!result.run_id || run.run_id!==result.run_id),result];
  return next;
}

// Derived presentation only. Each run keeps its own original predictions,
// display choices and provenance; a later request cannot erase earlier choices.
export function generatedTags(runs,reference,animeEnabled=false) {
  const grouped=new Map();
  for(const source of ['objects','people','face','anime']){
    if(source==='anime' && !animeEnabled)continue;
    for(const run of modelRuns(runs?.[source])){
      if(!reference || run.image_reference!==reference)continue;
      for(const suggestion of run.suggestions || []){
        if(typeof suggestion.tag!=='string')continue;
        const label=suggestion.tag.trim(),key=label.normalize('NFKC').toLowerCase();
        if(source==='objects' && run.display_choices && !run.display_choices[suggestion.category || (key==='person' ? 'people' : 'objects')])continue;
        if(!key)continue;
        if(!grouped.has(key))grouped.set(key,{label,sources:[]});
        grouped.get(key).sources.push({source,model:run.model,run_id:run.run_id,score:suggestion.score});
      }
    }
  }
  return [...grouped.values()];
}
