// Exclusive preview state; persistence and image display are injected adapters.
export function installPreviewSections({getBookmarks=()=>[],getImage=()=>null,save=async()=>{},onImage=()=>{},organization=null,onAddImages=()=>{},onDropImages=async()=>{},saveImageNote=async()=>{}}={}){
  const $=id=>document.getElementById(id),make=(tag,text='',cls='')=>{const node=document.createElement(tag);node.textContent=text;node.className=cls;return node;};
  const names=['notes','bookmarks',...($('preview-images')?['images']:[])],drafts=new Map(),imageDrafts=new Map();let active=null,identity=null,content={},editing=false,focusedBookmark=null,busy=false;
  const button=name=>$('preview-'+name),panel=name=>$('preview-'+name+'-panel');
  function sync(){for(const name of names){const open=active===name;button(name).setAttribute('aria-expanded',String(open));panel(name).hidden=!open;const triangle=button(name).querySelector?.('span');if(triangle)triangle.textContent=open?'▼':'▶';}}
  for(const name of names)button(name).onclick=()=>{active=active===name?null:name;sync();};
  function safeURL(value){try{const url=new URL(value);return ['http:','https:'].includes(url.protocol) && !url.username && !url.password?url.href:null;}catch{return null;}}
  function action(label,handler,cls=''){const node=make('button',label,cls);node.type='button';node.onclick=handler;return node;}
  function notes(){
    const host=panel('notes');host.replaceChildren();organization?.header('notes',host);
    if(editing){
      const key=identity,draft=drafts.get(key) || {id:crypto.randomUUID(),title:'',text:''};drafts.set(key,draft);
      const form=make('form','','preview-note-editor'),titleLabel=make('label',draft.inline?'Bookmark / card title':'Title'),titleInput=make('input');titleInput.value=draft.title || '';titleInput.maxLength=200;titleInput.required=true;titleInput.readOnly=!!draft.inline;titleInput.placeholder='Give your note a title';titleInput.oninput=()=>draft.title=titleInput.value;titleLabel.append(titleInput);
      const label=make('label','Note'),input=make('textarea');input.value=draft.text;input.required=true;input.maxLength=100000;input.placeholder='Write your note…';input.oninput=()=>draft.text=input.value;label.append(input);
      const feedback=make('p','','preview-save-status');feedback.setAttribute('role','status');const controls=make('div','','preview-note-actions'),submit=make('button','Save');submit.type='submit';const cancel=action('Cancel',()=>{editing=false;notes();});controls.append(submit,cancel);form.append(titleLabel,label,controls,feedback);host.append(form);
      form.onsubmit=async event=>{event.preventDefault();if(busy)return;draft.text=input.value;draft.title=titleInput.value;if(!draft.text.trim() || !draft.title.trim())return;busy=true;submit.disabled=cancel.disabled=true;try{await save(key,'note',{...draft,title:draft.title.trim(),text:draft.text});drafts.delete(key);if(identity===key){editing=false;notes();}}catch(error){feedback.textContent=error.message || 'Could not save. Your draft remains.';}finally{busy=false;submit.disabled=cancel.disabled=false;}};return;
    }
    const top=make('div','','preview-note-toolbar'),add=action('+',()=>{if(drafts.get(identity)?.editing)drafts.delete(identity);editing=true;notes();panel('notes').querySelector?.('textarea')?.focus?.();},'preview-add-note');add.setAttribute('aria-label','Add Note');top.append(add);host.append(top);
    const place=organization?.groups('notes',host);const seen=new Set();for(const note of content.notes || []){if(!note.text || seen.has(note.id))continue;seen.add(note.id);const row=action('',()=>{drafts.set(identity,{...note,editing:true,originalTitle:note.title || '',originalText:note.text});editing=true;notes();host.scrollIntoView?.({block:'nearest',behavior:'auto'});host.querySelector?.('textarea')?.focus?.({preventScroll:true});},'preview-note');row.append(make('h3',note.title || 'Note'),make('p',note.text));if(place)place(note,row);else host.append(row);}
    place?.finish?.();
    if(!seen.size)host.append(make('p',content.available===false?'Notes are unavailable right now.':'No notes yet.','preview-section-empty'));
  }
  function bookmarks(){
    const host=panel('bookmarks');host.replaceChildren();organization?.header('bookmarks',host);const entries=(content.bookmarks || []).filter(item=>safeURL(item.url));
    const current=entries.find(item=>item.url===focusedBookmark);
    if(current){
      host.append(action('← All Bookmarks',()=>{focusedBookmark=null;bookmarks();},'preview-bookmark-back'));
      const view=make('article','','preview-bookmark-focus');view.append(make('h3',current.title || current.url));
      const image=current.image || getImage(current);if(image){const preview=action('',()=>onImage(image,current.title),'preview-linked-image'),img=make('img');img.src=image;img.alt=current.title || 'Bookmark image';img.loading='lazy';img.referrerPolicy='no-referrer';preview.setAttribute('aria-label','Show bookmark image above');preview.append(img);view.append(preview);view.append(action('Restore Main Image',()=>onImage(null),'preview-bookmark-back'));}else view.append(make('p','No image saved for this bookmark.','preview-section-empty'));
      const link=make('a','Visit Bookmark ↗','preview-bookmark-visit');link.href=safeURL(current.url);link.target='_blank';link.rel='noopener noreferrer';link.title=current.url;view.append(link);host.append(view);return;
    }
    const place=organization?.groups('bookmarks',host);const seen=new Set();for(const item of entries){if(seen.has(item.url))continue;seen.add(item.url);const row=action('',()=>{focusedBookmark=item.url;bookmarks();},'preview-bookmark');row.append(make('strong',item.title || item.url),make('span',item.url));if(place)place(item,row);else host.append(row);}
    place?.finish?.();
    if(!seen.size)host.append(make('p',content.available===false?'Linked bookmarks are unavailable right now.':'No linked bookmarks yet.','preview-section-empty'));
    const footer=make('div','','preview-bookmark-add'),trigger=action('Add Existing Bookmark ↑',()=>{chooser.hidden=!chooser.hidden;trigger.setAttribute('aria-expanded',String(!chooser.hidden));if(!chooser.hidden){options();search.focus?.();}});trigger.setAttribute('aria-expanded','false');
    const chooser=make('div','','preview-bookmark-dropup');chooser.hidden=true;const search=make('input');search.type='search';search.placeholder='Find a bookmark…';search.setAttribute('aria-label','Find an existing bookmark');const select=make('select');select.size=6;select.setAttribute('aria-label','Choose an existing bookmark');const feedback=make('p','','preview-save-status');feedback.setAttribute('role','status');
    let candidates=null;
    function options(){if(!candidates)candidates=getBookmarks().filter(item=>safeURL(item.url) && item.url!==content.sourceURL && !seen.has(item.url));const query=search.value?.toLowerCase() || '';select.replaceChildren();for(const item of candidates.filter(item=>(item.title+' '+item.url).toLowerCase().includes(query))){const option=make('option',item.title || item.url);option.value=item.id;select.append(option);}select.selectedIndex=-1;}
    search.oninput=options;const attach=action('Add Bookmark',()=>commit());attach.disabled=true;select.onchange=()=>attach.disabled=!select.value;select.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();event.stopPropagation();commit();}};async function commit(){const item=candidates?.find(item=>item.id===select.value);if(!item || busy)return;const key=identity;busy=true;select.disabled=true;try{await save(key,'bookmark',{id:item.id,title:item.title,url:item.url});if(identity===key){chooser.hidden=true;bookmarks();}}catch(error){feedback.textContent=error.message || 'Could not link bookmark.';}finally{busy=false;select.disabled=false;}};
    chooser.onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();chooser.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus?.();}};
    chooser.append(search,select,attach,feedback);footer.append(trigger,chooser);host.append(footer);
  }
  function images(){
    if(!names.includes('images'))return;
    const host=panel('images');host.replaceChildren();organization?.header('images',host);
    const add=action('+ Add Images',()=>onAddImages(),'preview-add-images');
    add.setAttribute('aria-label','Add Images');
    const status=make('p','','preview-save-status');status.setAttribute('role','status');
    add.ondragover=event=>{event.preventDefault();event.dataTransfer.dropEffect='copy';};
    add.ondrop=async event=>{event.preventDefault();event.stopPropagation();const files=[...event.dataTransfer.files];add.disabled=true;try{await onDropImages(files);}catch(error){status.textContent=error.message;}finally{add.disabled=false;}};
    host.append(add,status);
    const place=organization?.groups('images',host,content.imagesContext);
    const fallback=make('div','','preview-images-grid');if(!place)host.append(fallback);
    for(const item of content.images || []){
      const figure=make('figure','','preview-mini-image'),img=make('img');img.src=item.image;img.alt=item.title || 'Card image';img.loading='lazy';img.referrerPolicy='no-referrer';
      img.onerror=()=>{img.hidden=true;caption.textContent='Image unavailable';};
      const caption=make('figcaption',item.title || 'Image'),label=make('label','Notes'),input=make('textarea');const draftKey=JSON.stringify([content.imagesContext,item.id]);input.value=imageDrafts.get(draftKey) ?? item.caption ?? '';input.oninput=()=>imageDrafts.set(draftKey,input.value);input.rows=2;input.maxLength=100000;input.setAttribute('aria-label','Notes for '+(item.title || 'image'));
      label.append(input);const feedback=make('p','','preview-save-status');feedback.setAttribute('role','status');
      let original=item.caption || '';const context=content.imagesContext;
      const save=action('Save Notes',async()=>{save.disabled=true;try{await saveImageNote(context,item.id,input.value,original);original=input.value;imageDrafts.delete(draftKey);feedback.textContent='Saved';}catch(error){feedback.textContent=error.message;}finally{save.disabled=false;}});
      figure.append(img,caption,label,save,feedback);if(place)place(item,figure);else fallback.append(figure);
    }
    place?.finish?.();
    if(!(content.images || []).length)host.append(make('p','No images yet.','preview-section-empty'));
  }
  return {setContent(key,value={},options={}){
    const changed=identity!==key,preserve=changed && options.preserve===true;
    if(preserve && drafts.has(identity)){drafts.set(key,drafts.get(identity));drafts.delete(identity);}
    identity=key;content=value;organization?.setContext(key,()=>{if(identity===key){if(!editing)notes();bookmarks();images();sync();}});
    if(changed && !preserve){active=null;editing=false;focusedBookmark=null;}
    if(!editing || preserve)notes();bookmarks();images();sync();
  }};
}
