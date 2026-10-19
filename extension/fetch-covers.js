// Permission-aware viewport cover retrieval. No site scripts, cookies, tabs or content injection.
export function coverURL(value,base) {
  try {
    const u=new URL(value,base),h=u.hostname.toLowerCase();
    if(!['https:','http:'].includes(u.protocol) || u.username || u.password || u.href.length>8192 || !h.includes('.') || h.endsWith('.local') || h.endsWith('.localhost') || /^[\d.]+$/.test(h) || h.includes(':') || [...u.searchParams.keys()].some(k=>/^(x-amz-|x-goog-|token$|signature$)/i.test(k)))return null;
    return u.href;
  }catch{return null;}
}
function unescapeAttribute(text){return text.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi,entity=>{const s=entity.slice(1,-1).toLowerCase();if(s[0]==='#'){const n=s[1]==='x'?parseInt(s.slice(2),16):parseInt(s.slice(1),10);return n>0 && n<=0x10ffff?String.fromCodePoint(n):'';}return {amp:'&',quot:'"',apos:"'",lt:'<',gt:'>'}[s];});}
export function coverCandidates(html,base){
  const ranked=[];
  // Only metadata tags: never instantiate untrusted HTML or load its scripts/resources.
  for(const tag of html.replace(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'').match(/<(?:meta|link)\b[^>]*>/gi) || []){
    const attrs={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))attrs[m[1].toLowerCase()]=unescapeAttribute(m[2]??m[3]??m[4]);
    const kind=(attrs.property || attrs.name || attrs.rel || '').toLowerCase();
    const rank=['og:image','og:image:url','twitter:image','twitter:image:src','image_src'].indexOf(kind);
    if(rank<0)continue;const url=coverURL(attrs.content || attrs.href,base);if(url)ranked.push({url,rank});
  }
  return [...new Set(ranked.sort((a,b)=>a.rank-b.rank).map(x=>x.url))].slice(0,3);
}
export async function boundedResponse(response,max,signal){
  if(!response.ok)throw Error('COVER_HTTP_'+response.status);
  if(Number(response.headers.get('content-length'))>max)throw Error('COVER_RESPONSE_TOO_LARGE');
  const reader=response.body.getReader(),chunks=[];let size=0;
  try{while(true){if(signal.aborted)throw new DOMException('Cancelled','AbortError');const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max)throw Error('COVER_RESPONSE_TOO_LARGE');chunks.push(value);}}
  finally{await reader.cancel().catch(()=>{});}
  return new Blob(chunks,{type:response.headers.get('content-type') || ''});
}
export async function retrieveCover(url,signal,raster,fetcher=fetch){
  if(!coverURL(url))throw Error('COVER_URL_UNSUPPORTED');
  const get=async(url,max)=>{
    const response=await fetcher(url,{signal,credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',cache:'no-store'});
    return boundedResponse(response,max,signal);
  };
  const page=await get(url,2*1024*1024);
  if(page.type.startsWith('image/'))return raster(page,40000);
  if(!/text\/html|application\/xhtml\+xml/i.test(page.type))throw Error('COVER_NOT_HTML');
  const candidates=coverCandidates(await page.text(),url);if(!candidates.length)throw Error('COVER_NOT_FOUND');
  let last;
  for(const candidate of candidates){try{return await raster(await get(candidate,5*1024*1024),40000);}catch(error){if(signal.aborted)throw error;last=error;}}
  throw last || Error('COVER_NOT_FOUND');
}
export function installCoverFetch({getScope,getNodes,getMounted,hasCover,saveCover,raster,onSaved}){
  const $=id=>document.getElementById(id),key='atlas.coverFetch.v1.'+(new URL(location.href).searchParams.get('id') || 'default');
  const autoKey='atlas.coverFetch.automatic.v1';
  let initialized=false,permissionGranted=false,autoEnabled=true,autoPaused=false,automatic=false;
  let running=false,busy=false,mode='visible',scope='',done={},retries={},queue=[],pending=new Set(),controller=null,timer=null,notice='',generation=0;
  const identity=node=>node.id+'|'+node.url;
  const progress=()=>{const values=Object.values(done),saved=values.filter(x=>x==='saved').length,failed=values.filter(x=>x!=='saved' && x!=='skipped').length;$('fetch-progress').textContent=`${running?'Fetching covers': 'Cover fetch paused'} · ${saved} saved · ${failed} unavailable · ${queue.length} queued${notice?' · '+notice:''}`;$('fetch-cancel').hidden=!running;$('fetch-start').textContent=Object.keys(done).length || queue.length?'Resume fetching':'Fetch bookmark covers';};
  const checkpoint=()=>chrome.storage.local.set({[key]:{version:3,scope,mode,done,retries}});
  function stop(){running=false;generation++;controller?.abort();clearTimeout(timer);timer=null;queue=[];pending.clear();progress();}
  function add(nodes,force=false){for(const node of nodes){const id=identity(node);if(coverURL(node.url) && !hasCover(node) && (!done[id] || force) && !pending.has(id)){queue.push(node);pending.add(id);}}}
  function discover(){if(!initialized)return;if(!running && autoEnabled && !autoPaused && permissionGranted){running=true;automatic=true;mode='visible';scope=getScope();generation++;}if(!running)return;if(scope!==getScope()){stop();if(autoEnabled && !autoPaused){discover();return;}notice='Collection changed; start a new fetch.';progress();return;}if(mode==='visible'){const visible=getMounted().filter(({element})=>{const rect=element.getBoundingClientRect();const buffer=automatic?200:0;return rect.bottom>-buffer && rect.top<window.innerHeight+buffer;}).map(x=>x.node);const ids=new Set(visible.map(identity));queue=queue.filter(node=>{if(ids.has(identity(node)))return true;pending.delete(identity(node));return false;});add(visible);}if(mode!=='visible' && !busy && !queue.length){running=false;notice=notice || 'Finished this selection.';}progress();pump();}
  async function pump(){
    if(!running || busy || timer || !queue.length)return;
    busy=true;const node=queue.shift(),id=identity(node),epoch=generation;controller=new AbortController();const activeController=controller;const timeout=setTimeout(()=>activeController.abort(),12000);
    try{
      if(!hasCover(node)){
        const image=await retrieveCover(node.url,activeController.signal,raster);
        if(!running || epoch!==generation)return;
        const saved=await saveCover(node,image);done[id]=saved?'saved':'skipped';onSaved(node);
      }else done[id]='skipped';
    }catch(error){
      if(epoch!==generation || !running)return;
      if(String(error.message).toUpperCase().includes('STORAGE') || String(error.message).toUpperCase().includes('QUOTA')){notice='Image storage is full. Increase Saved image storage in Board settings, or remove covers, then resume.';autoPaused=true;stop();return;}
      done[id]=error.name==='AbortError'?'COVER_TIMEOUT':(error.message || 'COVER_FETCH_FAILED');notice=done[id];
    }finally{
      clearTimeout(timeout);pending.delete(id);busy=false;
      if(epoch===generation){try{await checkpoint();}catch{notice='COVER_CHECKPOINT_FAILED';autoPaused=true;stop();}progress();}
      if(running && !queue.length && mode!=='visible'){running=false;notice=notice || 'Finished this selection.';progress();}
      if(running && queue.length){timer=setTimeout(()=>{timer=null;discover();pump();},500);}
    }
  }
  async function begin(single){
    // Chrome requires the optional permission request directly inside this click gesture.
    let allowed;try{allowed=await chrome.permissions.request({origins:['https://*/*','http://*/*']});}catch{notice='COVER_PERMISSION_FAILED';progress();return;}
    if(!allowed){notice='Site access declined; existing covers are unchanged.';progress();return;}
    permissionGranted=true;await ready;
    if(busy){notice='Cancel the active request and try again when it finishes.';progress();return;}
    stop();autoPaused=false;automatic=false;scope=getScope();mode=single?'single':$('fetch-mode').value;notice='';
    const retryTargets=single?[single]:mode==='visible'?getMounted().filter(({element})=>{const rect=element.getBoundingClientRect();return rect.bottom>0 && rect.top<window.innerHeight;}).map(item=>item.node):[];
    let limited=0;const approvedRetries=[];
    for(const node of retryTargets){
      const id=identity(node),outcome=done[id];
      if(hasCover(node) || !coverURL(node.url) || !outcome)continue;
      if(outcome==='saved' || outcome==='skipped'){delete done[id];continue;}
      if((retries[id] || 0)>=2){limited++;continue;}
      retries[id]=(retries[id] || 0)+1;done[id]='COVER_RETRY_PENDING';approvedRetries.push(node);
    }
    // Reserve retry budgets durably before starting another network request.
    try{await checkpoint();}catch{notice='COVER_CHECKPOINT_FAILED';autoPaused=true;progress();return;}
    if(limited)notice='Retry limit reached for '+limited+' card(s): at most two retries per bookmark URL.';
    add(approvedRetries,true);
    if(single){add([single]);}else if(mode==='all')add(getNodes());
    running=true;generation++;progress();discover();
  }
  const ready=(async()=>{
    try{const record=(await chrome.storage.local.get(key))[key];if([1,2,3].includes(record?.version) && record.done && typeof record.done==='object')done=record.done;
      if(record?.version===3 && record.retries && typeof record.retries==='object')retries=Object.fromEntries(Object.entries(record.retries).map(([id,count])=>[id,Number.isInteger(count)?Math.max(0,Math.min(2,count)):2]));
      autoEnabled=(await chrome.storage.local.get(autoKey))[autoKey]!==false;
      permissionGranted=Boolean(await chrome.permissions.contains?.({origins:['https://*/*','http://*/*']}));
    }catch{notice='Automatic fetch could not check settings or site access. Use Fetch to enable.';}
    if(autoEnabled && !permissionGranted)notice='Enable website access with Fetch to load visible covers automatically.';
    $('auto-fetch-covers').checked=autoEnabled;initialized=true;discover();progress();
  })();
  $('auto-fetch-covers').onchange=event=>{
    const enabled=event.target.checked;
    // Request immediately in the gesture, before storage/initialization awaits.
    let access;try{access=enabled && !permissionGranted?Promise.resolve(chrome.permissions.request({origins:['https://*/*','http://*/*']})).catch(()=>false):null;}catch{access=Promise.resolve(false);}
    return (async()=>{
      await ready;autoEnabled=enabled;autoPaused=false;stop();
      try{await chrome.storage.local.set({[autoKey]:autoEnabled});}catch{notice='Automatic-fetch preference could not be saved.';progress();return;}
      if(access){try{permissionGranted=Boolean(await access);}catch{permissionGranted=false;}}
      notice=autoEnabled && !permissionGranted?'Site access declined; use Fetch to enable.':'';
      if(autoEnabled)discover();progress();
    })();
  };
  $('fetch-start').onclick=()=>begin();$('fetch-cancel').onclick=()=>{autoPaused=true;stop();};
  $('fetch-mode').onchange=()=>{stop();notice='Choose Fetch to start this mode.';progress();};
  return {discover,request:node=>begin(node),stop,ready};
}
