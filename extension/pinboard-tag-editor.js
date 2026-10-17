// Exact-URL tag editing through the existing revision-checked companion catalog.
export function installTagEditor({onChanged}){
  const make=(tag,text='')=>{const e=document.createElement(tag);e.textContent=text;return e;};
  async function request(body){const result=await chrome.runtime.sendMessage({type:'api',path:'/v1/catalog',...(body?{body}:{})});if(result?.ok===false || !result?.data || !Number.isSafeInteger(result.revision))throw Error('Connect your companion, then retry.');return result;}
  return async function open(node){
    const dialog=make('dialog');dialog.className='pin-tag-editor';dialog.setAttribute('aria-label','Edit bookmark tags');
    const head=make('div');head.className='tag-editor-head';const close=make('button','×');close.setAttribute('aria-label','Close tag editor');close.onclick=()=>dialog.close();head.append(make('h2','Bookmark tags'),close);
    const title=make('p',node.title || node.url),attached=make('div'),label=make('label','Add an existing tag'),select=make('select'),add=make('button','Add Tag'),message=make('p','Loading tags…'),retry=make('button','Retry');retry.hidden=true;message.setAttribute('role','status');label.append(select);dialog.append(head,title,attached,label,add,message,retry);
    let snapshot=null,busy=false;
    const resources=data=>Object.values(data.resources || {}).filter(r=>r.kind==='bookmark' && r.locators?.some(l=>l.provider==='web' && l.reference===node.url));
    function controls(){add.disabled=busy || !snapshot || !select.value;select.disabled=busy || !snapshot;close.disabled=busy;for(const b of attached.children)b.disabled=busy;}
    function paint(){
      const data=snapshot.data,owned=[...new Set(resources(data).flatMap(r=>data.tags?.[r.id] || []))];
      attached.replaceChildren(...owned.map(tag=>{const b=make('button',tag+' ×');b.setAttribute('aria-label','Remove tag '+tag);b.onclick=()=>mutate('untag',tag);return b;}));
      if(!owned.length)attached.append(make('p','No tags attached.'));
      const known=[...new Set(Object.values(data.tags || {}).flat().filter(t=>typeof t==='string' && !owned.includes(t)))].sort((a,b)=>a.localeCompare(b));
      const placeholder=make('option',known.length?'Choose a tag…':'No other saved tags');placeholder.value='';select.replaceChildren(placeholder,...known.map(tag=>{const option=make('option',tag);option.value=tag;return option;}));select.value='';controls();
    }
    async function load(){busy=true;retry.hidden=true;controls();try{snapshot=await request();paint();message.textContent='';}catch(error){message.textContent=error.message;retry.hidden=false;}finally{busy=false;controls();}}
    async function mutate(action,tag){
      if(busy)return;busy=true;controls();retry.hidden=true;
      try{
        await navigator.locks.request('atlas-pages-v1',async()=>{
          const [current]=await chrome.bookmarks.get(node.id);if(current?.url!==node.url)throw Error('This bookmark changed. Close and select it again.');
          snapshot=await request();let matches=resources(snapshot.data);
          if(action==='tag' && !Object.values(snapshot.data.tags || {}).flat().includes(tag))throw Error('That tag is no longer available. Retry to reload.');
          if(action==='tag' && !matches.length){snapshot=await request({action:'add_resource',args:{kind:'bookmark',title:node.title || node.url,locators:[{provider:'web',reference:node.url}]},expected_revision:snapshot.revision});matches=resources(snapshot.data);if(!matches.length)throw Error('Could not confirm bookmark registration. Retry.');}
          for(const resource of (action==='tag'?matches.slice(0,1):matches)){
            if(action==='tag' && (snapshot.data.tags?.[resource.id] || []).includes(tag))continue;
            if(action==='untag' && !(snapshot.data.tags?.[resource.id] || []).includes(tag))continue;
            snapshot=await request({action,args:{resource:resource.id,tag},expected_revision:snapshot.revision});
          }
        });
        paint();message.textContent='Saved.';await onChanged(snapshot.data);
      }catch(error){message.textContent=error.message || 'Could not confirm the change. Retry to reload saved tags.';retry.hidden=false;if(snapshot)paint();}
      finally{busy=false;controls();}
    }
    select.onchange=controls;add.onclick=()=>{if(select.value)mutate('tag',select.value);};retry.onclick=load;
    dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();await load();
  };
}
