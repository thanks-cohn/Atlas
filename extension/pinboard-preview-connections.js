// Native bookmarks use revision-checked Atlas resources; authored cards keep their adapter.
export function connectionWriter({catalog,validateBookmark,isAuthored,local,onSnapshot}){
  return async(node,action,value)=>{
    if(action==='bookmark')await validateBookmark(value);
    if(isAuthored(node))return local(node,action,value);
    return navigator.locks.request('atlas-pages-v1',async()=>{
      await validateBookmark(node);
      let snapshot=await catalog();
      async function change(action,args){snapshot=await catalog({action,args,expected_revision:snapshot.revision});return snapshot;}
      async function bookmark(item){let match=Object.values(snapshot.data.resources || {}).find(r=>r.kind==='bookmark' && r.locators?.some(l=>l.provider==='web' && l.reference===item.url));if(!match){await change('add_resource',{kind:'bookmark',title:item.title || item.url,locators:[{provider:'web',reference:item.url}]});match=snapshot.data.resources[snapshot.result];}if(!match)throw Error('Could not confirm bookmark registration.');return match;}
      const source=await bookmark(node);let target;
      if(action==='note'){
        target=Object.values(snapshot.data.resources || {}).find(r=>r.kind==='note' && r.locators?.some(l=>l.provider==='atlas' && l.reference===value.id));
        if(target && target.note!==value.text)await change('update_resource',{resource:target.id,title:value.text.split('\n')[0].slice(0,200),note:value.text});
        if(!target){await change('add_resource',{kind:'note',title:value.text.split('\n')[0].slice(0,200),note:value.text,locators:[{provider:'atlas',reference:value.id}]});target=snapshot.data.resources[snapshot.result];}
      }else target=await bookmark(value);
      if(!target)throw Error('Could not confirm saved content. Your input remains.');
      if(source.id===target.id)throw Error('Choose a different bookmark.');
      const type=action==='note'?'has-note':'related-bookmark';
      if(!(snapshot.data.relations || []).some(r=>r.from===source.id && r.to===target.id && r.type===type))await change('link',{source:source.id,target:target.id,relation_type:type});
      onSnapshot(snapshot.data);
    });
  };
}
