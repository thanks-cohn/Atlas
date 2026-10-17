// Explicit user-selected files only. Keep original bytes separate from adaptive previews.
function failure(code,message) { return Object.assign(new Error(message),{code}); }
export async function imageType(file) {
  const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer());
  const text=String.fromCharCode(...bytes);
  if (bytes[0]===137 && text.slice(1,4)==='PNG' && bytes[4]===13 && bytes[5]===10 && bytes[6]===26 && bytes[7]===10) return 'image/png';
  if (bytes[0]===255 && bytes[1]===216 && bytes[2]===255) return 'image/jpeg';
  if (text.startsWith('GIF87a') || text.startsWith('GIF89a')) return 'image/gif';
  if (text.startsWith('RIFF') && text.slice(8,12)==='WEBP') return 'image/webp';
  throw failure('IMAGE_TYPE_UNSUPPORTED','The selected file is not a supported PNG, JPEG, WebP or GIF.');
}
export async function rasterImage(file, maxChars = 700000) {
  if (!Number.isSafeInteger(maxChars) || maxChars < 30000 || maxChars > 700000) throw failure('IMAGE_PREVIEW_BUDGET','Invalid preview size budget.');
  if (file.size > 10 * 1024 * 1024) throw failure('IMAGE_TOO_LARGE',`This file is ${(file.size/1048576).toFixed(1)} MB. The current import limit is 10 MB per image.`);
  await imageType(file);
  let bitmap;
  try {
    try { bitmap=await createImageBitmap(file); }
    catch { throw failure('IMAGE_DECODE_FAILED','Chrome could not decode this image. It may be damaged or use an unsupported encoding.'); }
    if (!bitmap.width || !bitmap.height || bitmap.width*bitmap.height>40000000) throw failure('IMAGE_DIMENSIONS','This image exceeds the current 40-megapixel decoding limit.');
    const canvas=document.createElement('canvas'),context=canvas.getContext('2d');
    if (!context) throw failure('IMAGE_CANVAS_UNAVAILABLE','Chrome could not create an image preview.');
    for (const edge of [1600,1280,1024,800,640,480]) {
      const scale=Math.min(1,edge/Math.max(bitmap.width,bitmap.height));
      canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
      context.drawImage(bitmap,0,0,canvas.width,canvas.height);
      for (const quality of [.84,.72,.58,.42]) {
        const source=canvas.toDataURL('image/webp',quality);
        if (source.length<=maxChars && /^data:image\/(?:webp|png|jpeg);base64,/.test(source)) return source;
      }
    }
    throw failure('IMAGE_PREVIEW_TOO_LARGE','A bounded preview could not be made. Try a smaller image; the original file has not been changed.');
  } finally { bitmap?.close(); }
}
