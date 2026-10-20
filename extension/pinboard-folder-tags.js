// Location evidence is independent of manual assignments, model runs and views.
export const FOLDER_TAGS='atlas.pinboard.folder-tags.v1';
export const FOLDER_TAG_SETTINGS='atlas.pinboard.folder-tag-settings.v1';
export const folderTagKey=value=>String(value).normalize('NFKC').trim().toLowerCase();
export function bookmarkLocations(roots){
  const locations={};
  function visit(node,path){
    if(node.url){try{const url=new URL(node.url);if(!['http:','https:'].includes(url.protocol) || url.username || url.password)return;}catch{return;}locations[node.id]={provider:'chrome-bookmarks',placementId:node.id,url:node.url,path};return;}
    const next=node.title?.trim()?[...path,{id:node.id,label:node.title}]:path;
    for(const child of node.children || [])visit(child,next);
  }
  for(const root of roots)visit(root,[]);
  return locations;
}
export function reconcileLocations(previous={},locations,at=new Date().toISOString()){
  const result={...previous};
  for(const id of new Set([...Object.keys(previous),...Object.keys(locations)])){
    const prior=previous[id],location=locations[id] || null;
    if(JSON.stringify(prior?.location ?? null)===JSON.stringify(location))continue;
    const tags=[...new Set((location?.path || []).map(part=>folderTagKey(part.label)).filter(Boolean))];
    result[id]={...prior,version:1,source:'folder',location,tags,updatedAt:at,
      history:[...(prior?.history || []),...(prior? [{location:prior.location,tags:prior.tags,recordedAt:prior.updatedAt,supersededAt:at}]:[])]};
  }
  return result;
}
export function createFolderTags({storage,scope,lock=fn=>navigator.locks.request('atlas-pages-v1',fn)}){
  let records={},enabled=true;
  async function load(){const saved=await storage.get([FOLDER_TAGS,FOLDER_TAG_SETTINGS]);records=saved[FOLDER_TAGS] || {};enabled=saved[FOLDER_TAG_SETTINGS]?.[scope]!==false;}
  async function sync(roots){await lock(async()=>{const saved=await storage.get(FOLDER_TAGS),prior=saved[FOLDER_TAGS] || {},next=reconcileLocations(prior,bookmarkLocations(roots));if(JSON.stringify(prior)!==JSON.stringify(next))await storage.set({[FOLDER_TAGS]:next});records=next;});}
  function tags(node){if(!enabled)return [];const parent=node?.parentNode || node,id=parent?.folderSourceBookmarkId || (!parent?.cardId?parent?.id:null),record=records[id];return record?.location?.url===parent?.url?record.tags:[];}
  return {load,sync,tags,enabled:()=>enabled,
    vocabulary:nodes=>[...new Set(nodes.flatMap(tags))],
    async setEnabled(value){await lock(async()=>{const saved=await storage.get(FOLDER_TAG_SETTINGS);await storage.set({[FOLDER_TAG_SETTINGS]:{...saved[FOLDER_TAG_SETTINGS],[scope]:value===true}});});enabled=value===true;}
  };
}
