// Only the trusted worker holds companion credentials. This module never receives them.
export async function library(action,values={}) {
  const result=await chrome.runtime.sendMessage({type:'api',path:'/v1/library',body:{action,...values}});
  if (!result || result.ok===false) {
    const code=result?.error?.code || 'LIBRARY_OFFLINE';
    const message=['NOT_FOUND','UNSUPPORTED'].includes(code) ? 'Update the companion to use durable gallery storage.' : code==='LIBRARY_EDIT_CONFLICT' ? 'The disk library has a different saved version. Reload before editing.' : 'Connect the updated companion to save outside Chrome. Your changes remain in the editor.';
    throw Object.assign(new Error(message),{code});
  }
  return result;
}
export async function saveLibraryPage(page) {
  return library('save-page',{page,expectedRevision:page.libraryRevision ?? null});
}
export async function readLibraryPage(id) { return (await library('read-page',{id})).page; }
export async function importOriginal(file,mime) {
  const bytes=new Uint8Array(await file.arrayBuffer());let text='';
  for(let start=0;start<bytes.length;start+=32768) text+=String.fromCharCode(...bytes.subarray(start,start+32768));
  return (await library('put-asset',{mime,base64:btoa(text)})).asset;
}
