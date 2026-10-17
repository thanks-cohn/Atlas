// Page content and bookmark placement are separate, versioned extension-local records.
export const PAGE_PREFIX = 'atlas.page.v1.';
export const ITEM_PREFIX = 'atlas.items.v1.';
export const PAGE_TEMPLATES = Object.freeze([{id: 'gallery', label: 'Gallery', available: true}, {id: 'horizons-v1', label: 'Horizons v1 — planned', available: false}]);
export function publicImageURL(value) {
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || [...url.searchParams.keys()].some(key => /^(x-amz-|x-goog-|token$|signature$)/i.test(key))) return null;
    return url.href;
  } catch { return null; }
}
export function publicationReadiness(page) {
  validatePage(page);
  return {localImages: page.images.filter(image => image.sourceKind === 'local').length, referencedImages: page.images.filter(image => image.sourceKind !== 'local').length, requiresR2Transfer: page.images.some(image => image.sourceKind === 'local'), deploymentAvailable: false};
}
export function pageKey(id) {
  if (typeof id !== 'string' || !/^[a-f0-9-]{36}$/.test(id)) throw new Error('PAGE_ID_INVALID');
  return PAGE_PREFIX + id;
}
export function validatePage(page) {
  if (page?.version !== 1 || page.kind !== 'page' || page.template !== 'gallery' ||
      typeof page.title !== 'string' || !page.title.trim() || page.title.length > 200 ||
      typeof page.text !== 'string' || page.text.length > 100000 || !Number.isSafeInteger(page.revision) || page.revision < 1) throw new Error('PAGE_DATA_INVALID');
  if (!Array.isArray(page.images) || page.images.length > 24 || page.images.some(image =>
    typeof image.id !== 'string' || (image.title !== undefined && (typeof image.title !== 'string' || image.title.length > 200)) || typeof image.caption !== 'string' || image.caption.length > 300 ||
    typeof image.source !== 'string' || image.source.length > 700000 ||
    !(image.sourceKind === 'url' ? publicImageURL(image.source) && image.source.length <= 8192 : image.sourceKind === 'local' && /^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(image.source))) ||
    new Set(page.images.map(image => image.id)).size !== page.images.length || JSON.stringify(page).length > 4000000) throw new Error('PAGE_IMAGES_INVALID');
  pageKey(page.id); return page;
}
export async function readPage(storage, id) {
  const key = pageKey(id), data = await storage.get(key);
  if (!data[key]) return null;
  const page = validatePage(data[key]);
  if (page.id !== id) throw new Error('PAGE_ID_MISMATCH');
  return page;
}
export async function linkedPages(storage, node) {
  const key = ITEM_PREFIX + node.id, record = (await storage.get(key))[key];
  if (!record) return [];
  if (record.version !== 1 || !Array.isArray(record.pageIds) || record.pageIds.length > 200 || new Set(record.pageIds).size !== record.pageIds.length) throw new Error('PAGE_ASSOCIATIONS_INVALID');
  if (record.bookmarkUrl !== (node.url || '')) return [];
  const pages = [];
  for (const id of record.pageIds) { const page = await readPage(storage, id); if (page) pages.push(page); }
  return pages;
}
export async function createLinkedPage(storage, node, {title, template = 'gallery'}, id) {
  const page = validatePage({version: 1, id, kind: 'page', title: title.trim(), text: '', template, images: [], revision: 1, sourceBookmark: {id: node.id, url: node.url || ''}});
  const key = ITEM_PREFIX + node.id, current = (await storage.get(key))[key];
  if (current && (current.version !== 1 || !Array.isArray(current.pageIds))) throw new Error('PAGE_ASSOCIATIONS_INVALID');
  const ids = current?.version === 1 && current.bookmarkUrl === (node.url || '') && Array.isArray(current.pageIds) ? current.pageIds : [];
  if (ids.length >= 200) throw new Error('PAGE_ASSOCIATION_LIMIT');
  if (await readPage(storage, id)) throw new Error('PAGE_ALREADY_EXISTS');
  await storage.set({[pageKey(id)]: page, [key]: {version: 1, bookmarkUrl: node.url || '', pageIds: [...ids, id]}});
  return page;
}
export async function updatePage(storage, id, {title, text, images}, expectedRevision, persist) {
  const current = await readPage(storage, id);
  if (!current) throw new Error('PAGE_NOT_FOUND');
  if (current.revision !== expectedRevision) throw new Error('PAGE_EDIT_CONFLICT');
  const next = validatePage({...current, title: title.trim(), text, images: images ?? current.images, revision: current.revision + 1});
  if (persist) { const saved = await persist(next); next.libraryRevision = saved.libraryRevision; next.libraryLocation = saved.location; }
  try { await storage.set({[pageKey(id)]: next}); } catch(error) { if (persist) throw Object.assign(new Error('Saved to Atlas Library, but Chrome could not update its cache. Reload to recover the disk copy.'),{code:'PAGE_CACHE_WRITE_FAILED'}); throw error; } return next;
}
export function withPageLock(task) { return navigator.locks.request('atlas-pages-v1', task); }
