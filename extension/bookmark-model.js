// Pure tree helpers. Native children remain in Chrome order; URL text is never HTML.
export function indexBookmarks(roots) {
  const nodes = new Map();
  const visit = (node) => { nodes.set(node.id, node); for (const child of node.children || []) visit(child); };
  roots.forEach(visit);
  return nodes;
}
export function findBookmarks(nodes, query) {
  const q = query.trim().toLocaleLowerCase();
  return [...nodes.values()].filter(n => n.parentId !== undefined &&
    `${n.title}\n${n.url || ''}`.toLocaleLowerCase().includes(q));
}
export function editableBookmark(node, nodes) {
  return Boolean(node?.parentId !== undefined && !node.unmodifiable && !node.folderType &&
    nodes.get(node.parentId)?.parentId !== undefined);
}
export function folderTargets(nodes, movingId = null) {
  return [...nodes.values()].filter(node => {
    if (node.url || node.parentId === undefined || node.unmodifiable) return false;
    let current = node;
    while (current) {
      if (current.id === movingId) return false;
      current = nodes.get(current.parentId);
    }
    return true;
  });
}
export function bookmarkTrail(nodes, id) {
  const trail = []; let node = nodes.get(id);
  while (node) { trail.unshift(node); node = nodes.get(node.parentId); }
  return trail;
}
export function openableBookmark(url) {
  // Saved executable URLs never execute in the privileged extension page.
  try { return ['https:', 'http:', 'ftp:', 'file:'].includes(new URL(url).protocol); }
  catch { return false; }
}
