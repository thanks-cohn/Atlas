// Explicit source-link clicks only; never embeds sites or changes shelf state.
export const SOURCE_BEHAVIOR='atlas.visit-source.behavior.v1';
export const sourceBehavior=value=>value==='split'?'split':'tab';
export function sourceURL(value){try{const url=new URL(value);if(!['https:','http:'].includes(url.protocol) || url.username || url.password)throw Error();return url.href;}catch{throw Error('Choose a valid HTTP(S) source URL.');}}
export function createSourceNavigator({tabs,storage}){
  const owned=new Map(),busy=new Set();
  return async function open(value){
    const url=sourceURL(value),mode=sourceBehavior((await storage.get(SOURCE_BEHAVIOR))[SOURCE_BEHAVIOR]);
    const board=await tabs.getCurrent();
    const separate=async reason=>({mode:'tab',reason,tab:await tabs.create({url,active:true,...(Number.isInteger(board?.id)?{windowId:board.windowId,openerTabId:board.id}:{})})});
    if(mode!=='split')return separate(null);
    if(!Number.isInteger(board?.id) || typeof tabs.createSplit!=='function')return separate('Split view is unavailable; opened a separate tab.');
    if(busy.has(board.id))return {mode:'busy',reason:'Opening source…'};
    busy.add(board.id);
    try{
      const prior=owned.get(board.id);
      if(prior){
        try{
          const [current,source]=await Promise.all([tabs.get(board.id),tabs.get(prior)]);
          if(current.splitViewId>=0 && source.splitViewId===current.splitViewId){await tabs.update(prior,{url,active:true});return {mode:'split',tab:source};}
        }catch{/* Closed source or changed layout: do not alter user-managed tabs. */}
        owned.delete(board.id);
      }
      const current=await tabs.get(board.id);
      if(current.splitViewId>=0)return separate('This pinboard is already split; opened a separate tab.');
      try{
        const tab=await tabs.create({url,windowId:current.windowId,openerTabId:current.id,index:current.index,pinned:current.pinned,active:true,splitWithTabId:current.id});
        if(!(tab.splitViewId>=0))return {mode:'tab',tab,reason:'Split view was not enabled; opened a separate tab.'};
        owned.set(current.id,tab.id);return {mode:'split',tab};
      }catch{return separate('Split view could not open; opened a separate tab.');}
    }finally{busy.delete(board.id);}
  };
}
export function installSourceNavigation({chrome,choice,feedback,anchor,status=()=>{}}){
  const open=createSourceNavigator({tabs:chrome.tabs,storage:chrome.storage.local});let revision=0;
  const restore=async()=>{const epoch=revision;try{const saved=await chrome.storage.local.get(SOURCE_BEHAVIOR);if(epoch===revision)choice.value=sourceBehavior(saved[SOURCE_BEHAVIOR]);}catch{feedback.textContent='Source preference could not be loaded.';}};
  choice.onchange=async()=>{++revision;choice.disabled=true;try{await chrome.storage.local.set({[SOURCE_BEHAVIOR]:sourceBehavior(choice.value)});feedback.textContent='Saved.';}catch{feedback.textContent='Could not save. Try again.';}finally{choice.disabled=false;}};
  chrome.storage.onChanged?.addListener((changes,area)=>{if(area==='local' && changes[SOURCE_BEHAVIOR]){++revision;choice.value=sourceBehavior(changes[SOURCE_BEHAVIOR].newValue);}});
  anchor.onclick=async event=>{
    if(event.defaultPrevented || event.button>0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
    event.preventDefault();
    try{const result=await open(anchor.href);if(result.reason)status(result.reason);}
    catch(error){status(error.message || 'Source could not open. Try again.');}
  };
  restore();return {open};
}
