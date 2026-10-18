// Exclusive presentation state only. Content remains owned by existing stores.
export function installPreviewSections(){
  const $=id=>document.getElementById(id),make=(tag,text='',cls='')=>{const node=document.createElement(tag);node.textContent=text;node.className=cls;return node;};
  const names=['notes','bookmarks'];let active=null,identity=null;
  const button=name=>$('preview-'+name),panel=name=>$('preview-'+name+'-panel');
  function select(name){active=active===name?null:name;for(const key of names){const open=active===key;button(key).setAttribute('aria-expanded',String(open));panel(key).hidden=!open;}if(active){const scroller=$('detail-scroll'),content=panel(active).getBoundingClientRect?.(),viewport=scroller.getBoundingClientRect?.();if(content && viewport && content.bottom>viewport.bottom)scroller.scrollBy?.({top:content.bottom-viewport.bottom,behavior:'instant'});}}
  for(const name of names)button(name).onclick=()=>select(name);
  function safeURL(value){try{const url=new URL(value);return ['http:','https:'].includes(url.protocol) && !url.username && !url.password?url.href:null;}catch{return null;}}
  return {setContent(key,{notes=[],bookmarks=[],available=true}={}){
    if(key!==identity){identity=key;active=null;}const notesHost=panel('notes'),bookmarksHost=panel('bookmarks');notesHost.replaceChildren();bookmarksHost.replaceChildren();
    const seen=new Set();for(const note of notes){if(!note.text || seen.has(note.id))continue;seen.add(note.id);const row=make('article','','preview-note');row.append(make('h3',note.title || 'Note'),make('p',note.text));notesHost.append(row);}
    if(!notesHost.children.length)notesHost.append(make('p',available?'No notes yet.':'Notes are unavailable right now.','preview-section-empty'));
    const urls=new Set();for(const bookmark of bookmarks){const url=safeURL(bookmark.url);if(!url || urls.has(url))continue;urls.add(url);const row=make('a','','preview-bookmark');row.href=url;row.target='_blank';row.rel='noopener noreferrer';row.append(make('strong',bookmark.title || url),make('span',url));bookmarksHost.append(row);}
    if(!bookmarksHost.children.length)bookmarksHost.append(make('p',available?'No linked bookmarks yet.':'Linked bookmarks are unavailable right now.','preview-section-empty'));
    for(const name of names){button(name).setAttribute('aria-expanded',String(active===name));panel(name).hidden=active!==name;}
  }};
}
