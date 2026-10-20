// View state only. Provider identities and authority remain in their existing stores.
export const WORKSPACE_KEY = 'atlas.workspace.layout.v1';
export function paneState(provider = 'bookmarks') {
  return {location:{provider,id:''},history:[],index:-1,entries:[],selected:new Set(),anchor:0,query:'',sort:'name',view:'list',pinned:false,preview:null,epoch:0};
}
export function visit(pane, location, record = true) {
  pane.location = {...location}; pane.selected.clear(); pane.query = '';
  if (!pane.pinned) pane.preview = null;
  if(record){pane.history = pane.history.slice(0,pane.index+1);pane.history.push({...location});pane.index++;}
  return ++pane.epoch;
}
export function ordered(pane) {
  const sign = pane.sort === 'descending' ? -1 : 1;
  return pane.entries.filter(e=>e.name.toLocaleLowerCase().includes(pane.query.toLocaleLowerCase())).sort((a,b)=>sign*a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:'base'}) || a.id.localeCompare(b.id));
}
export function select(pane, entries, index, {ctrlKey=false,metaKey=false,shiftKey=false}={}) {
  const id=entries[index]?.id;if(!id)return;
  if(shiftKey){if(!ctrlKey&&!metaKey)pane.selected.clear();for(const e of entries.slice(Math.min(pane.anchor,index),Math.max(pane.anchor,index)+1))pane.selected.add(e.id);}
  else if(ctrlKey||metaKey){pane.selected.has(id)?pane.selected.delete(id):pane.selected.add(id);pane.anchor=index;}
  else {pane.selected=new Set([id]);pane.anchor=index;}
}
export function layoutPreferences(value={}) {
  return {dual:value.dual===true,ratio:Number.isFinite(value.ratio)?Math.min(70,Math.max(30,value.ratio)):50,height:Number.isFinite(value.height)?Math.min(75,Math.max(25,value.height)):55};
}
