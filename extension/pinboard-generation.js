export async function imageReference(source) {
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(source || ''));
  return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
}
// Explicit user action only. The companion owns durable per-model evidence.
export async function generationImage(source) {
  if (!source) throw Error('Choose an image first.');
  if (/^https?:/.test(source)) {
    const origin=new URL(source).origin+'/*';
    if (!await chrome.permissions.request({origins:[origin]})) throw Error('Allow access to this image site, or choose a local image.');
  }
  const response = await fetch(source, {credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(20000)});
  if (!response.ok) throw Error('Image could not be loaded.');
  const reader=response.body.getReader(),parts=[];let size=0;
  try {
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>10*1024*1024)throw Error('Choose an image below 10 MB for tagging.');parts.push(value);}
  } finally {await reader.cancel();}
  const blob = new Blob(parts,{type:response.headers.get('Content-Type') || 'application/octet-stream'});
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
    status('Generating '+({objects:'Things / People',face:'Faces',anime:'Anime'}[model])+'…');
    const response = await send({type:'api',path:'/v1/tag-image',body:{model,image,item_id:node.url,display_choices:choices}});
    const result=response?.data || response;
    if (response?.ok===false || !Array.isArray(result?.suggestions)) {
      const error = response?.error;
      throw Error((error?.code ? error.code+': ' : '')+(error?.message || 'Companion did not return tag predictions.'));
    }
    // Preserve original predictions. Display selection is a separate field.
    results[model] = {...result,display_choices:{...choices}};
    await save(model,results[model]);
  }
  return results;
}
