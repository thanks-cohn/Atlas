// Independent authoring surface; bookmark collections and cover fetching stay unchanged.
export const BLANK_KEY='atlas.pinboard.cards.v1';
export function cleanCard(value){
  const title=String(value.title || '').trim(),text=String(value.text || '').trim();
  const tags=[...new Set(String(value.tags || '').split(',').map(t=>t.trim()).filter(Boolean))];
  if(!title || title.length>200 || text.length>20000 || tags.length>100 || tags.some(t=>t.length>80))throw Error('Use a title, up to 100 tags, and shorter text.');
  return {id:value.id,title,text,tags,image:value.image || null};
}
export function installBlankBoard({scope,storage,publicImageURL,rasterImage}){
  const $=id=>document.getElementById(id),make=(tag,text='',cls='')=>{const e=document.createElement(tag);e.textContent=text;e.className=cls;return e;};
  let cards=[],loaded=false,preview=false,image=null,active=false,busy=false;
  const region=$('blank-board'),message=$('blank-status');
  function setPreview(value){preview=value;region.classList.toggle('is-preview',value);$('preview-board').textContent=value?'Exit Preview':'Preview';}
  $('preview-board').hidden=true;
  $('preview-board').onclick=()=>setPreview(!preview);
  document.addEventListener('keydown',event=>{if(active && preview && event.key==='Escape'){event.preventDefault();setPreview(false);}});
  function render(){
    region.replaceChildren();
    for(const card of cards){
      const article=make('article','','authored-pin');
      if(card.image){const img=make('img');img.src=card.image;img.alt=card.title;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';article.append(img);}
      const copy=make('div','','authored-copy');copy.append(make('h2',card.title),make('p',card.text));
      const tags=make('div','','authored-tags');for(const tag of card.tags)tags.append(make('span',tag));copy.append(tags);article.append(copy);region.append(article);
    }
    if(preview){if(!cards.length)region.append(make('p','Your board is ready for its first card.','blank-empty'));return;}
    const form=make('form','','pin-composer');
    const imageButton=make('button','','composer-image');imageButton.type='button';imageButton.setAttribute('aria-label','Choose card image');
    imageButton.append(make('span','+'),make('small','Add an image'));
    const file=make('input');file.type='file';file.accept='image/png,image/jpeg,image/webp,image/gif';file.hidden=true;imageButton.onclick=()=>file.click();
    file.onchange=async()=>{if(!file.files?.[0])return;imageButton.disabled=true;try{image=await rasterImage(file.files[0],60000);imageButton.replaceChildren();const img=make('img');img.src=image;img.alt='Selected cover';imageButton.append(img);message.textContent='';}catch{message.textContent='Could not prepare that image. Try a smaller PNG, JPEG, WebP or GIF.';}finally{imageButton.disabled=false;}};
    function field(label,tag,max,placeholder){const wrap=make('label',label),input=make(tag);input.maxLength=max;input.placeholder=placeholder;wrap.append(input);form.append(wrap);return input;}
    form.append(imageButton,file);
    const url=field('Image URL · optional','input',8192,'https://…');url.type='url';
    const title=field('Title','input',200,'Give your card a title');title.required=true;
    const text=field('Text','textarea',20000,'A thought, a story, a little context…');text.rows=3;
    const tags=field('Tags','input',8000,'Design, inspiration, ideas');
    const add=make('button','Add Card +','composer-save');add.type='submit';form.append(add);
    form.onsubmit=async event=>{
      event.preventDefault();if(busy)return;busy=true;add.disabled=true;
      try{
        const remote=url.value.trim();if(remote && !publicImageURL(remote))throw Error('Use a public image URL without credentials or signed tokens.');
        const card=cleanCard({id:crypto.randomUUID(),title:title.value,text:text.value,tags:tags.value,image:image || (remote?publicImageURL(remote):null)});
        await navigator.locks.request('atlas-pages-v1',async()=>{
          const all=(await storage.get(BLANK_KEY))[BLANK_KEY] || {},current=all[scope] || [];
          if(current.length>=100)throw Error('This board has reached its 100-card authoring limit.');
          const next=[...current,card];await storage.set({[BLANK_KEY]:{...all,[scope]:next}});cards=next;
        });
        image=null;message.textContent='';render();region.lastElementChild?.querySelector('input:not([type=file])')?.focus({preventScroll:true});
      }catch(error){message.textContent=error.message || 'Could not save. Your draft remains here.';}
      finally{busy=false;add.disabled=false;}
    };
    region.append(form);
  }
  return {show(blank){active=blank;region.hidden=message.hidden=!blank;$('preview-board').hidden=!blank;if(!blank){preview=false;return;}if(!loaded){loaded=true;storage.get(BLANK_KEY).then(result=>{cards=result[BLANK_KEY]?.[scope] || [];render();}).catch(()=>{loaded=false;message.textContent='Could not load this board. Refresh to retry.';});}else if(!region.children.length)render();}};
}
