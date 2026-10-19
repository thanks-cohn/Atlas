// Extension-local presentation metadata; never changes a native bookmark or grants files.
export const COVER_KEY = 'atlasBookmarkCoversV1';
export const COVER_BUDGET_KEY='atlas.bookmarkCoverBudgetMiB.v1';
export function coverBudgetMiB(value){return Number.isInteger(Number(value)) && Number(value)>=8 && Number(value)<=512?Number(value):64;}
export const MAX_COVER_LENGTH = 700000;
// Serialized cover-map budget, separate from browser quota and mounted image memory.
export const MAX_COVERS_BYTES = 64 * 1024 * 1024;
export const MAX_COVERS_LENGTH = MAX_COVERS_BYTES; // Legacy import compatibility.
export function coverStorageBytes(covers) { return new TextEncoder().encode(JSON.stringify(covers)).byteLength; }
export function safeCover(value) {
  return typeof value === 'string' && value.length <= MAX_COVER_LENGTH &&
    /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}
// Explicit user-selected public image references are supported alongside local previews.
export function safeCoverReference(value) {
  if (safeCover(value)) return true;
  if(typeof value!=='string' || value.length>8192)return false;
  try { const url=new URL(value);return ['http:','https:'].includes(url.protocol) && !url.username && !url.password && ![...url.searchParams.keys()].some(key=>/^(x-amz-|x-goog-|token$|signature$)/i.test(key)); }catch{return false;}
}
export function directImage(url) {
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol) && /\.(?:png|jpe?g|webp|gif|avif)$/i.test(parsed.pathname) ? parsed.href : null;
  } catch { return null; }
}
export function bookmarkCover(node, covers) {
  const saved = Object.hasOwn(covers, node.id) ? covers[node.id] : Object.values(covers).find(cover=>cover?.url===(node.url || '')) || null;
  if(saved?.url===(node.url || '') && saved.image===null)return null;
  return saved?.url === (node.url || '') && safeCoverReference(saved.image) ? saved.image : directImage(node.url);
}
// Reader for an immutable storage snapshot. Keep alias lookup and image validation
// out of scroll work; constructing a new reader observes the next snapshot.
export function createBookmarkCoverReader(covers) {
  const byURL=new Map(),validated=new Map();
  for(const cover of Object.values(covers))if(cover && !byURL.has(cover.url))byURL.set(cover.url,cover);
  return node=>{
    const url=node.url || '',saved=Object.hasOwn(covers,node.id)?covers[node.id]:byURL.get(url);
    if(saved?.url===url){
      if(saved.image===null)return null;
      if(!validated.has(saved.image))validated.set(saved.image,safeCoverReference(saved.image));
      if(validated.get(saved.image))return saved.image;
    }
    return directImage(node.url);
  };
}
export function setBookmarkCover(covers, node, image, budgetMiB=64) {
  if (image !== null && !safeCoverReference(image)) throw new Error('BOOKMARK_IMAGE_INVALID');
  const result = {...covers};
  if (image === null) delete result[node.id];
  else Object.defineProperty(result, node.id, {value: {url: node.url || '', image}, enumerable: true, configurable: true});
  if (image!==null && coverStorageBytes(result) > coverBudgetMiB(budgetMiB)*1024*1024) throw new Error('BOOKMARK_IMAGE_STORAGE_FULL');
  return result;
}
export function bookmarkAssociations(node, data) {
  const resources = Object.values(data?.resources || {});
  // Exact web locator match only: native IDs and Atlas resource IDs are different namespaces.
  const matches = resources.filter(r => r.kind === 'bookmark' && r.locators?.some(l => l.provider === 'web' && l.reference === node.url));
  const ids = new Set(matches.map(r => r.id));
  const related = (data?.relations || []).filter(r => ids.has(r.from)).map(r => ({relation: r.type, resource: data.resources[r.to]})).filter(r => r.resource);
  const tags = [...new Set(matches.flatMap(r => data.tags?.[r.id] || []))];
  const image = related.filter(r => r.resource.kind === 'image').flatMap(r => r.resource.locators || []).map(l => l.provider === 'web' ? directImage(l.reference) : null).find(Boolean) || null;
  return {matches, related, tags, image};
}
