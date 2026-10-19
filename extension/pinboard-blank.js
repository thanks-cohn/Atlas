// Authored-card storage and composer only. All saved cards use pinboard.js's
// shared renderer, virtual layout, preview, tag controls and motion.
export const BLANK_KEY='atlas.pinboard.cards.v1';
export function cleanCard(value){
  const title=String(value.title || '').trim(),text=String(value.text || '').trim();
  const values=Array.isArray(value.tags)?value.tags:String(value.tags || '').split(',');
  const tags=[...new Map(values.map(tag=>String(tag).trim()).filter(Boolean).map(tag=>[tag.normalize('NFKC').toLowerCase(),tag])).values()];
  if(!title || title.length>200 || text.length>20000 || tags.length>100 || tags.some(tag=>tag.length>80))throw Error('Use a title, up to 100 tags, and shorter text.');
  return {...value,title,text,tags,image:value.image || null,url:value.url || null};
}
export function installBlankBoard({scope,storage,publicImageURL,rasterImage,getBookmarks=()=>[],describeBookmark=()=>({}),onChanged=()=>{},onLayout=()=>{}}){
  const $=id=>document.getElementById(id),make=(tag,text='',cls='')=>{const node=document.createElement(tag);node.textContent=text;node.className=cls;return node;};
  const region=$('blank-board'),message=$('blank-status');region.replaceChildren();
  let cards=[],loaded=false,preview=false,active=false,busy=false,image=null,editing=null;
  const key=id=>'atlas-card:'+encodeURIComponent(scope)+':'+encodeURIComponent(id);
  const current=node=>cards.find(card=>card.id===node.cardId && !card.deleted);
  async function load(){const saved=await storage.get(BLANK_KEY);cards=saved[BLANK_KEY]?.[scope] || [];loaded=true;return cards;}
  async function write(change){
    await navigator.locks.request('atlas-pages-v1',async()=>{const saved=await storage.get(BLANK_KEY),all=saved[BLANK_KEY] || {},next=change(all[scope] || []);await storage.set({[BLANK_KEY]:{...all,[scope]:next}});cards=next;});
    await onChanged();
  }
  async function patch(node,changes){
    await write(list=>{if(!list.some(card=>card.id===node.cardId && !card.deleted))throw Error('This card no longer exists. Refresh the board.');return list.map(card=>card.id===node.cardId?cleanCard({...card,...changes,id:card.id}):card);});
  }
  function nodes(){return cards.filter(card=>!card.deleted).map(card=>({id:key(card.id),itemKey:key(card.id),kind:'authored',cardId:card.id,title:card.title,url:card.url || null}));}
  function setPreview(value){preview=value;region.hidden=!active || preview;$('preview-board').textContent=preview?'Exit Preview':'Preview';onLayout();}
  $('preview-board').hidden=true;$('preview-board').onclick=()=>setPreview(!preview);
  document.addEventListener('keydown',event=>{if(active && preview && event.key==='Escape' && !(document.querySelectorAll?.('dialog[open]') || []).length){event.preventDefault();setPreview(false);}});
  function composer(){
    region.replaceChildren();const form=make('form','','pin-composer');let bookmark=null;
    const imageButton=make('button','','composer-image');imageButton.type='button';imageButton.setAttribute('aria-label','Choose card image');
    const paintImage=()=>{imageButton.replaceChildren();if(image){const img=make('img');img.src=image;img.alt='Selected cover';imageButton.append(img);}else imageButton.append(make('span','+'),make('small','Add an image'));};paintImage();
    const file=make('input');file.type='file';file.accept='image/png,image/jpeg,image/webp,image/gif';file.hidden=true;imageButton.onclick=()=>file.click();
    file.onchange=async()=>{if(!file.files?.[0])return;imageButton.disabled=true;try{image=await rasterImage(file.files[0],175000);paintImage();message.textContent='';}catch(error){message.textContent=error.message || 'Could not prepare that image.';}finally{imageButton.disabled=false;}};
    function field(label,tag,max,placeholder){const wrap=make('label',label),input=make(tag);input.maxLength=max;input.placeholder=placeholder;wrap.append(input);form.append(wrap);return input;}
    form.append(imageButton,file);
    const imageURL=field('Image URL · optional','input',8192,'https://…');imageURL.type='url';
    const title=field('Title','input',200,'Give your card a title');title.required=true;
    const text=field('Text','textarea',20000,'A thought, a story, a little context…');text.rows=3;
    const tags=field('Tags','input',8000,'Design, inspiration, ideas');
    const link=field('Link · optional','input',8192,'https://…');link.type='url';
    const bookmarkLabel=make('label','Existing Bookmark'),picker=make('select'),none=make('option','Choose a bookmark · optional');none.value='';picker.append(none);
    const bookmarks=getBookmarks();for(const node of bookmarks){const option=make('option',(node.title || node.url)+' — '+node.url);option.value=node.id;picker.append(option);}bookmarkLabel.append(picker);form.insertBefore(bookmarkLabel,imageButton);
    picker.onchange=()=>{bookmark=bookmarks.find(node=>node.id===picker.value) || null;if(!bookmark)return;const details=describeBookmark(bookmark);title.value=bookmark.title || bookmark.url;text.value=details.note || '';tags.value=(details.tags || []).join(', ');image=details.image || null;imageURL.value='';link.value=bookmark.url;paintImage();};
    if(editing){title.value=editing.title;text.value=editing.text;tags.value=(editing.tags || []).join(', ');link.value=editing.url || '';image=editing.image;paintImage();}
    const add=make('button',editing?'Save Card':'Add Card +','composer-save');add.type='submit';form.append(add);
    if(editing){const cancel=make('button','Cancel');cancel.type='button';cancel.onclick=()=>{editing=null;image=null;composer();};form.append(cancel);}
    form.onsubmit=async event=>{
      event.preventDefault();if(busy)return;busy=true;add.disabled=true;
      try{
        const remote=imageURL.value.trim(),target=link.value.trim();
        if(remote && !publicImageURL(remote))throw Error('Use a public image URL without credentials or signed tokens.');
        if(target){let valid=false;try{const parsed=new URL(target);valid=target.length<=8192 && ['http:','https:'].includes(parsed.protocol) && !parsed.username && !parsed.password;}catch{}if(!valid)throw Error('Use an HTTP(S) link without embedded credentials.');}
        const card=cleanCard({id:editing?.id || crypto.randomUUID(),url:target || null,title:title.value,text:text.value,tags:tags.value,image:remote?publicImageURL(remote):image});
        if(editing)await patch({cardId:editing.id},card);else await write(list=>[...list,card]);
        editing=null;image=null;message.textContent='';composer();
      }catch(error){message.textContent=error.message || 'Could not save. Your draft remains here.';}
      finally{busy=false;add.disabled=false;}
    };region.append(form);onLayout();
  }
  return {load,nodes,region:()=>region,composing:()=>active && !preview,metadata:node=>{const card=current(node);return {note:card?.text || '',tags:card?.tags || [],image:card?.image || null,notes:[...(card?.text?[{id:card.id+':text',inline:true,title:card.title,text:card.text}]:[]),...(card?.notes || [])],bookmarks:card?.bookmarks || []};},patch,
    tagAdapter:node=>({read:async()=>{await load();const card=current(node);if(!card)throw Error('This card no longer exists.');return {tags:card.tags || [],data:null};},mutate:async(action,tag)=>{await write(list=>{if(!list.some(card=>card.id===node.cardId && !card.deleted))throw Error('This card no longer exists.');return list.map(card=>{if(card.id!==node.cardId || card.deleted)return card;const tags=card.tags || [],identity=tag.normalize('NFKC').toLowerCase();return cleanCard({...card,tags:action==='untag'?tags.filter(value=>value.normalize('NFKC').toLowerCase()!==identity):[...tags,tag]});});});return {tags:current(node)?.tags || [],data:null};}}),
    async connect(node,action,value){await write(list=>{if(!list.some(card=>card.id===node.cardId && !card.deleted))throw Error('This card no longer exists.');return list.map(card=>{if(card.id!==node.cardId || card.deleted)return card;if(action==='note' && value.editing){const prior=value.inline?{text:card.text,title:card.title}:(card.notes || []).find(note=>note.id===value.id);if(!prior || prior.text!==value.originalText || prior.title!==value.originalTitle)throw Error('This note changed. Reopen it before saving.');if(value.inline)return {...card,text:value.text};}
      const field=action==='note'?'notes':'bookmarks',values=card[field] || [];if(action==='note')value={id:value.id,title:value.title,text:value.text};if(values.some(item=>action==='note'?item.id===value.id:item.url===value.url))return action==='note'?{...card,[field]:values.map(item=>item.id===value.id?{...item,...value}:item)}:card;return {...card,[field]:[...values,value]};});});},
    edit(node){editing=current(node);if(!editing)return;setPreview(false);image=editing.image;composer();region.scrollIntoView?.({block:'start',behavior:'smooth'});},
    async remove(node){await patch(node,{deleted:true});},
    show(blank){const changed=active!==blank;active=blank;message.hidden=!blank;$('preview-board').hidden=!blank;if(changed)setPreview(false);else region.hidden=!blank || preview;if(blank && !region.children.length && loaded)composer();}
  };
}
