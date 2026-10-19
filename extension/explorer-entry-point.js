// Presentation preference only: never creates, broadens or revokes a grant.
export const ENTRY_POINT_KEY='atlas.explorer.entry-point.v1';
function rootPath(grant){
 const raw=String(grant.root || '');
 const windows=/^[a-z]:[\\/]|^\\\\/.test(raw);
 let path=raw.replace(/\\/g,'/').replace(/\/+$/,'');
 if(windows)path=path.toLowerCase();
 return {path:path || (raw.startsWith('/')?'/':''),windows};
}
export function validRelativeFolder(path){
 return typeof path==='string' && !path.startsWith('/') && !path.includes('\\') && !path.includes(':') && !path.split('/').some(part=>part==='..' || part==='.');
}
export function chooseEntryPoint(grants,preference){
 if(preference && validRelativeFolder(preference.path)){
  const grant=grants.find(item=>item.id===preference.grantId);
  if(grant)return {grant,path:preference.path,label:preference.path.split('/').filter(Boolean).at(-1) || grant.label || grant.id};
 }
 // Parent grants precede descendants. Unrelated roots use shallowest then path/ID
 // order, so reconnect/list ordering cannot silently change the default.
 const sorted=grants.map(grant=>({grant,...rootPath(grant)})).sort((a,b)=>{
  const depth=item=>item.path?item.path.split('/').filter(Boolean).length:Infinity;
  return depth(a)-depth(b) || a.path.localeCompare(b.path) || String(a.grant.id).localeCompare(String(b.grant.id));
 });
 const first=sorted[0]?.grant;
 return first?{grant:first,path:'',label:first.label || first.id}:null;
}
