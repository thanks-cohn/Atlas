// Native bookmark references, not copies of a user's collection.
export const PINBOARDS_KEY='atlas.pinboards.v1';
export const BATCH=24, WINDOW=96;
export function pinItems(roots,folderId='all',query='') {
  const result=[];const q=query.trim().toLocaleLowerCase();
  function visit(node,inside) {
    inside=inside || folderId==='all' || node.id===folderId;
    if(inside && node.url) {
      try { const url=new URL(node.url);if(['http:','https:'].includes(url.protocol) && !url.username && !url.password && (!q || (node.title+' '+node.url).toLocaleLowerCase().includes(q))) result.push(node); } catch {}
    }
    for(const child of node.children || [])visit(child,inside);
  }
  for(const root of roots)visit(root,false);
  return result;
}
export function boardRecord(value) {
  if(value?.version!==1 || typeof value.id!=='string' || !/^[a-f0-9-]{36}$/.test(value.id) || typeof value.title!=='string' || !value.title.trim() || value.title.length>200 || typeof value.folderId!=='string' || value.folderId.length>128 || typeof value.sourceBookmark?.id!=='string' || typeof value.sourceBookmark?.url!=='string')throw Error('PINBOARD_INVALID');
  return value;
}
export async function createPinboard(storage,node,title,id,folderId='all') {
  const board=boardRecord({version:1,id,title:title.trim(),folderId,sourceBookmark:{id:node.id,url:node.url || ''}});
  const saved=(await storage.get(PINBOARDS_KEY))[PINBOARDS_KEY] || {};
  if(Object.keys(saved).length>=100)throw Error('PINBOARD_LIMIT');
  if(Object.hasOwn(saved,id))throw Error('PINBOARD_EXISTS');
  await storage.set({[PINBOARDS_KEY]:{...saved,[id]:board}});return board;
}
export async function linkedPinboards(storage,node) {
  return Object.values((await storage.get(PINBOARDS_KEY))[PINBOARDS_KEY] || {}).map(boardRecord).filter(b=>b.sourceBookmark.id===node.id && b.sourceBookmark.url===(node.url || ''));
}
export async function removePinboard(storage,id) {
  const saved={...((await storage.get(PINBOARDS_KEY))[PINBOARDS_KEY] || {})};delete saved[id];await storage.set({[PINBOARDS_KEY]:saved});
}
