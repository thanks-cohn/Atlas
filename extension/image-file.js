// Re-encode explicitly chosen raster files; no imported HTML, script, or remote scraping.
export async function rasterImage(file) {
  if (file.size > 10 * 1024 * 1024 || !['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)) throw new Error('IMAGE_TYPE_OR_SIZE');
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 40000000) throw new Error('IMAGE_DIMENSIONS');
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const source = canvas.toDataURL('image/webp', 0.84);
    if (source.length > 700000) throw new Error('IMAGE_ENCODED_SIZE');
    return source;
  } finally { bitmap?.close(); }
}
