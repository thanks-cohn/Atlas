// Extension-local presentation metadata; never changes a native bookmark or grants files.
export const COVER_KEY = 'atlasBookmarkCoversV1';
export const MAX_COVER_LENGTH = 700000;
export const MAX_COVERS_LENGTH = 4000000;
export function safeCover(value) {
  return typeof value === 'string' && value.length <= MAX_COVER_LENGTH &&
    /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}
export function directImage(url) {
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol) && /\.(?:png|jpe?g|webp|gif|avif)$/i.test(parsed.pathname) ? parsed.href : null;
  } catch { return null; }
}
export function bookmarkCover(node, covers) {
  const saved = Object.hasOwn(covers, node.id) ? covers[node.id] : null;
  return saved?.url === (node.url || '') && safeCover(saved.image) ? saved.image : directImage(node.url);
}
export function setBookmarkCover(covers, node, image) {
  if (image !== null && !safeCover(image)) throw new Error('BOOKMARK_IMAGE_INVALID');
  const result = {...covers};
  if (image === null) delete result[node.id];
  else Object.defineProperty(result, node.id, {value: {url: node.url || '', image}, enumerable: true, configurable: true});
  if (JSON.stringify(result).length > MAX_COVERS_LENGTH) throw new Error('BOOKMARK_IMAGE_STORAGE_FULL');
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
