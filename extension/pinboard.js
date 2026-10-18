import {createCardHold,heldMasonry} from './pinboard-card-hold.js';
import {connectionWriter} from './pinboard-preview-connections.js';
import {installPreviewSections} from './pinboard-preview-sections.js';
import {generationImage,generateModels,imageReference,generatedTags,mergeGeneratedRun} from './pinboard-generation.js';
import {installTagEditor,removeBookmarkTag,TAG_VOCABULARY} from './pinboard-tag-editor.js';
import {installBlankBoard} from './pinboard-blank.js';
import {installCoverFetch} from './fetch-covers.js';
import {PINBOARDS_KEY,PINBOARD_SETTINGS,BATCH,pinItems,boardRecord,cardLimit,tagQuery,createPinboard} from './pinboard-model.js';
import {COVER_BUDGET_KEY,coverBudgetMiB,coverStorageBytes,COVER_KEY,bookmarkCover,setBookmarkCover,directImage} from './bookmark-covers.js';
import {publicImageURL} from './pages-store.js';
import {rasterImage} from './image-file.js';
const $=id=>document.getElementById(id),el=(tag,text='')=>{const node=document.createElement(tag);node.textContent=text;return node;};
let previewingLinkedImage=false;
let highlightedTags=new Set(),metadataState='loading';
let roots=[],covers={},items=[],selected=null,associations=new Map();
const imageGeometry=new Map(),failedImages=new Set();
let positions=[],positionById=new Map();
let blocks=new Map(),frame=0,limit=72;
const topSpacer=el('div'),bottomSpacer=el('div');topSpacer.className=bottomSpacer.className='pin-spacer';
const boardId=new URL(location.href).searchParams.get('id');
const status=text=>$('status').textContent=text;
const itemKey=node=>node?.itemKey || node?.url || '';
const authored=node=>node?.kind==='authored';
const hostLabel=node=>node.url?new URL(node.url).hostname:'Personal card';
function collectionNodes(query=''){const nodes=$('folder').value==='blank'?blankBoard.nodes():pinItems(roots,$('folder').value);const text=query.trim().toLocaleLowerCase();return text?nodes.filter(node=>(node.title+' '+(node.url || '')).toLocaleLowerCase().includes(text)):nodes;}
function metadata(node){if(authored(node))return blankBoard.metadata(node);return associations.get(node.url) || {note:'',tags:[],image:null};}
function imageFor(node){const value=authored(node)?metadata(node).image:(bookmarkCover(node,covers) || metadata(node).image);if(failedImages.has(value))return null;return value?.startsWith('data:')?value:publicImageURL(value);}
function link(node,label){if(!node.url){const button=el('button',label);button.type='button';button.onclick=()=>openDetail(node);return button;}const a=el('a',label);a.href=node.url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function pickImage(node){selected=node;$('cover-url').value='';$('image-status').textContent='';document.documentElement.setAttribute('data-pin-open','');$('image-source').showModal();}
function humanTagsFor(node){return [...new Set(metadata(node).tags.filter(tag=>typeof tag==='string').map(tag=>tag.trim()).filter(Boolean))];}
// Cache only validated image projections; tagsFor stays synchronous during scrolling.
const TAG_REMOVALS='atlas-card-tag-removals-v1';
let cardTagRemovals={},generatedIndex=new Map(),generatedEpoch=0;
function tagsFor(node){
  const result=new Map(humanTagsFor(node).map(tag=>[tag.normalize('NFKC').toLowerCase(),tag]));
  const entry=generatedIndex.get(itemKey(node));
  if(entry?.image===imageFor(node))for(const tag of entry.tags){const key=tag.label.normalize('NFKC').toLowerCase();if(!result.has(key))result.set(key,tag.label);}
  const removed=cardTagRemovals[itemKey(node)] || {};
  return [...result.values()].filter(tag=>!Object.hasOwn(removed,tag.normalize('NFKC').toLowerCase()));
}
async function refreshGeneratedIndex(){
  const epoch=++generatedEpoch;
  const saved=await chrome.storage.local.get([TAGGING_RESULTS,JOYTAG_ACTIVATED,TAG_REMOVALS]);
  cardTagRemovals=saved[TAG_REMOVALS] || {};
  const runs=saved[TAGGING_RESULTS] || {},next=new Map();
  for(const node of [...pinItems(roots),...blankBoard.nodes()]){
    if(!runs[itemKey(node)])continue;
    const image=imageFor(node);if(!image)continue;
    const reference=await imageReference(image);
    if(epoch!==generatedEpoch)return;
    next.set(itemKey(node),{image,tags:generatedTags(runs[itemKey(node)],reference,saved[JOYTAG_ACTIVATED]===true)});
  }
  if(epoch!==generatedEpoch)return;
  generatedIndex=next;
  // Preserve mounted images and scroll position when labels arrive.
  for(const block of blocks.values())for(const card of block.children)updateTagCard(card.atlasNode);
  items=filteredNodes().filter(node=>!$('images-only').checked || imageFor(node));
  renderTags();scheduleWindow();
}
async function removeCardTag(node,tag){
  const key=tag.normalize('NFKC').toLowerCase();
  if(humanTagsFor(node).some(value=>value.normalize('NFKC').toLowerCase()===key)){
    if(authored(node))await blankBoard.patch(node,{tags:humanTagsFor(node).filter(value=>value.normalize('NFKC').toLowerCase()!==key)});else associations=indexAssociations(await removeBookmarkTag(node,tag));
  }
  await navigator.locks.request('atlas-pages-v1',async()=>{
    const saved=await chrome.storage.local.get([TAG_REMOVALS,TAG_VOCABULARY]);
    const removals=saved[TAG_REMOVALS] || {};
    cardTagRemovals={...removals,[itemKey(node)]:{...removals[itemKey(node)],[key]:{tag,actor:'human',action:'remove',at:new Date().toISOString()}}};
    await chrome.storage.local.set({[TAG_REMOVALS]:cardTagRemovals,[TAG_VOCABULARY]:[...new Set([...(saved[TAG_VOCABULARY] || []),tag])]});
  });
  await refreshGeneratedIndex();
  if(itemKey(selected)===itemKey(node)){$('detail-tags').replaceChildren(...humanTagsFor(node).map(tag=>removableTag(node,tag,true)));await showGeneratedTags(node);}
}
function removableTag(node,tag,preview=false){
  const pill=el('span');pill.className='pin-tag-pair'+(preview?' preview-tag-pair':'');
  const label=tagButton(tag,preview?'tag':'pin-tag',preview?null:node);
  const remove=el('button','×');remove.type='button';remove.className='pin-tag-remove';remove.setAttribute('aria-label','Remove '+tag+' from this card');
  remove.onclick=async event=>{event?.stopPropagation();remove.disabled=true;try{await removeCardTag(node,tag);}catch(error){status(error.message || 'Tag could not be removed. Retry.');remove.disabled=false;}};
  pill.append(label,remove);return pill;
}
function tagStrip(node){
  const tags=tagsFor(node);if(!tags.length)return null;
  const strip=el('div');strip.className='pin-tags';strip.setAttribute('aria-label','Bookmark tags');
  for(const tag of tags.slice(0,5))strip.append(removableTag(node,tag));
  if(tags.length>5){const more=el('button','+'+(tags.length-5));more.className='pin-tag pin-tag-more';more.setAttribute('aria-label','Show all '+tags.length+' tags');more.onclick=()=>openDetail(node);strip.append(more);}
  return strip;
}
const TAGGING_UI_PREFS='atlas-tagging-studio-layout-v1';
const JOYTAG_ACTIVATED='atlas-joytag-enabled-v1';
function setTaggingChoiceStatus(message){$('tagging-selection-status').textContent=message;}
let taggingChoiceEpoch=0,taggingBusy=false;
function updateTaggingAction(){const chosen=['tag-image-choice','tag-people-choice','tag-face-choice'].some(id=>$(id).checked) || (!$('tag-anime-wrap').hidden && $('tag-anime-choice').checked);$('run-image-tagging').disabled=taggingBusy || previewingLinkedImage || !chosen;}
function applyJoyTagSetting(enabled){$('joytag-enabled').checked=enabled;$('tag-anime-wrap').hidden=!enabled;if(!enabled)$('tag-anime-choice').checked=false;updateTaggingAction();}
async function loadModelChoiceSetting(){try{const saved=await chrome.storage.local.get(JOYTAG_ACTIVATED);applyJoyTagSetting(saved[JOYTAG_ACTIVATED]===true);}catch{$('model-choice-status').textContent='Could not load model preference.';applyJoyTagSetting(false);}}
$('joytag-enabled').onchange=async()=>{
  const enabled=$('joytag-enabled').checked;$('joytag-enabled').disabled=true;
  try{await chrome.storage.local.set({[JOYTAG_ACTIVATED]:enabled});applyJoyTagSetting(enabled);await refreshGeneratedIndex();if(selected)await showGeneratedTags(selected);$('model-choice-status').textContent='Saved.';}catch{$('model-choice-status').textContent='Could not save. Please retry.';await loadModelChoiceSetting();}finally{$('joytag-enabled').disabled=false;}
};
chrome.storage.onChanged?.addListener((changes,area)=>{if(area==='local' && (changes[JOYTAG_ACTIVATED] || changes[TAGGING_RESULTS] || changes[TAG_REMOVALS])){if(changes[JOYTAG_ACTIVATED])applyJoyTagSetting(changes[JOYTAG_ACTIVATED].newValue===true);refreshGeneratedIndex().catch(()=>status('Saved generated tags could not be loaded.'));}});
loadModelChoiceSetting();
async function loadTaggingChoices(node){
  const key=itemKey(node),request=++taggingChoiceEpoch;
  $('tag-anime-wrap').hidden=true;
  $('tag-anime-choice').checked=false;
  $('tag-image-choice').checked=true;
  $('tag-people-choice').checked=true;
  $('tag-face-choice').checked=false;
  setTaggingChoiceStatus('');updateTaggingAction();
  try{
    const saved=await chrome.storage.local.get([TAGGING_UI_PREFS,JOYTAG_ACTIVATED]);
    if(itemKey(selected)!==key || request!==taggingChoiceEpoch)return;
    const prefs=saved[TAGGING_UI_PREFS]?.[key] || {};
    $('tag-image-choice').checked=prefs.objects!==false;
    $('tag-people-choice').checked=prefs.people!==false;
    $('tag-face-choice').checked=prefs.details===true;
    const joytagEnabled=saved[JOYTAG_ACTIVATED]===true;
    applyJoyTagSetting(joytagEnabled);
    $('tag-anime-choice').checked=joytagEnabled && prefs.anime===true;
  }catch{if(itemKey(selected)!==key || request!==taggingChoiceEpoch)return;setTaggingChoiceStatus('Could not restore choices.');}
  updateTaggingAction();
}
async function saveTaggingChoices(){
  if(!selected)return;
  const key=itemKey(selected);
  const choice={objects:$('tag-image-choice').checked,people:$('tag-people-choice').checked,details:$('tag-face-choice').checked,anime:!$('tag-anime-wrap').hidden && $('tag-anime-choice').checked};
  updateTaggingAction();setTaggingChoiceStatus('');
  try{
    const saved=(await chrome.storage.local.get(TAGGING_UI_PREFS))[TAGGING_UI_PREFS] || {};
    await chrome.storage.local.set({[TAGGING_UI_PREFS]:{...saved,[key]:choice}});
  }catch{setTaggingChoiceStatus('Selections could not be saved; please retry.');}
}
for(const id of ['tag-image-choice','tag-people-choice','tag-face-choice','tag-anime-choice'])$(id).addEventListener('change',saveTaggingChoices);
const TAGGING_RESULTS='atlas-image-tagging-runs-v1';
async function showGeneratedTags(node){
  const host=$('detail-generated-tags');
  host.replaceChildren();
  try{
    const [stored,activation,reference]=await Promise.all([chrome.storage.local.get(TAGGING_RESULTS),chrome.storage.local.get(JOYTAG_ACTIVATED),imageReference(imageFor(node))]);
    const runs=stored[TAGGING_RESULTS]?.[itemKey(node)] || {},animeEnabled=activation[JOYTAG_ACTIVATED]===true;
    if(itemKey(selected)!==itemKey(node))return;
    const human=new Set(humanTagsFor(node).map(tag=>tag.normalize('NFKC').toLowerCase()));
    const grouped=new Map(generatedTags(runs,reference,animeEnabled).map(entry=>[entry.label.normalize('NFKC').toLowerCase(),entry]));
    if(!grouped.size)return;
    const section=el('section'),heading=el('strong','Generated tags');
    const tags=el('div');tags.className='generated-tag-chips';
    for(const [key,entry] of grouped){
      if(human.has(key) || Object.hasOwn(cardTagRemovals[itemKey(node)] || {},key))continue; // Existing human tag is already shown above.
      const chip=removableTag(node,entry.label,true);
      chip.title=entry.sources.map(item=>{
        const confidence=Number.isFinite(item.score)?' ('+Math.round(item.score*100)+'%)':'';
        return ({objects:'Things',face:'Faces',anime:'Anime'}[item.source] || 'People')+confidence;
      }).join(' · ');
      tags.append(chip);
    }
    if(!tags.childElementCount)tags.append(el('span','All generated tags are already shown as human tags.'));
    section.append(heading,tags);host.append(section);
  }catch{host.append(el('p','Saved model results could not be loaded.'));}
}

$('run-image-tagging').onclick=async()=>{
  updateTaggingAction();
  if($('run-image-tagging').disabled || !selected)return;
  const node=selected;
  const choices={objects:$('tag-image-choice').checked,people:$('tag-people-choice').checked,face:$('tag-face-choice').checked,anime:!$('tag-anime-wrap').hidden && $('tag-anime-choice').checked};
  taggingBusy=true;updateTaggingAction();
  const report=message=>{if(itemKey(selected)===itemKey(node))setTaggingChoiceStatus(message);};
  try{
    report('Preparing image…');
    const sourceImage=imageFor(node);
    const image=await generationImage(sourceImage);
    const reference=await imageReference(sourceImage);
    await generateModels({node,image,choices,send:message=>chrome.runtime.sendMessage(message),status:report,
      save:async(source,result)=>{
        result={...result,image_reference:reference};
        await navigator.locks.request('atlas-pages-v1',async()=>{
          const stored=await chrome.storage.local.get([TAGGING_RESULTS,TAG_VOCABULARY]),all=stored[TAGGING_RESULTS] || {};
          const combined=mergeGeneratedRun(all[itemKey(node)],source,result);
          const vocabulary=new Map((stored[TAG_VOCABULARY] || []).map(tag=>[tag.normalize('NFKC').toLowerCase(),tag]));
          for(const suggestion of result.suggestions || [])if(typeof suggestion.tag==='string' && suggestion.tag.trim()){const tag=suggestion.tag.trim(),key=tag.normalize('NFKC').toLowerCase();if(!vocabulary.has(key))vocabulary.set(key,tag);}
          await chrome.storage.local.set({[TAGGING_RESULTS]:{...all,[itemKey(node)]:combined},[TAG_VOCABULARY]:[...vocabulary.values()]});
        });
        await refreshGeneratedIndex();
        if(itemKey(selected)===itemKey(node))await showGeneratedTags(node);
      }});
    report('Tags generated.');
  }catch(error){report(error.message || 'Tag generation failed.');}
  finally{taggingBusy=false;updateTaggingAction();}
};
function openDetailContent(node){
  previewingLinkedImage=false;selected=node;$('detail-title').textContent=node.title || hostLabel(node);const image=imageFor(node);
  $('detail-image').hidden=!image;if(image)$('detail-image').src=image;else $('detail-image').removeAttribute('src');
  $('detail-image').alt=node.title || 'Card image';
  const details=metadata(node);previewSections.setContent(itemKey(node),{sourceURL:node.url,available:authored(node) || !['loading','unavailable'].includes(metadataState),notes:details.notes || (details.note?[{id:itemKey(node)+':note',title:node.title || 'Note',text:details.note}]:[]),bookmarks:(details.bookmarks || []).map(bookmark=>({...bookmark,image:imageFor(bookmark)}))});
  $('detail-link').hidden=!node.url;if(node.url)$('detail-link').href=node.url;else $('detail-link').removeAttribute('href');
  $('detail-tags').replaceChildren(...humanTagsFor(node).map(tag=>removableTag(node,tag,true)));
  $('edit-authored-card').hidden=$('delete-authored-card').hidden=!authored(node);
  loadTaggingChoices(node);showGeneratedTags(node);
}
function openDetail(node){openDetailContent(node);document.documentElement.setAttribute('data-pin-open','');$('detail').showModal();$('detail-scroll').scrollTop=0;}

const editTags=installTagEditor({localAdapter:node=>{
  if(!authored(node))return null;const adapter=blankBoard.tagAdapter(node);
  return {read:adapter.read,mutate:async(action,tag)=>{const result=await adapter.mutate(action,tag);if(action==='tag')await navigator.locks.request('atlas-pages-v1',async()=>{const saved=await chrome.storage.local.get(TAG_REMOVALS),all=saved[TAG_REMOVALS] || {},own={...all[itemKey(node)]};delete own[tag.normalize('NFKC').toLowerCase()];cardTagRemovals={...all,[itemKey(node)]:own};await chrome.storage.local.set({[TAG_REMOVALS]:cardTagRemovals});});return result;}};
},onChanged:async(data,node)=>{
  if(authored(node)){await refreshGeneratedIndex();if(selected && itemKey(selected)===itemKey(node))openDetailContent(node);return;}

  if(tagsChangedURL){const next=indexAssociations(data).get(tagsChangedURL)?.tags || [],prior=associations.get(tagsChangedURL)?.tags || [];
    const added=next.filter(tag=>!prior.includes(tag));
    if(added.length)await navigator.locks.request('atlas-pages-v1',async()=>{const saved=await chrome.storage.local.get(TAG_REMOVALS),all=saved[TAG_REMOVALS] || {},own={...all[tagsChangedURL]};for(const tag of added)delete own[tag.normalize('NFKC').toLowerCase()];cardTagRemovals={...all,[tagsChangedURL]:own};await chrome.storage.local.set({[TAG_REMOVALS]:cardTagRemovals});});
  }
  associations=indexAssociations(data);metadataState='ready';items=filteredNodes().filter(node=>!$('images-only').checked || imageFor(node));renderTags();for(const node of items)if(tagsChangedURL===itemKey(node))updateTagCard(node);renderWindow();}});
async function previewCatalog(body){const response=await chrome.runtime.sendMessage({type:'api',path:'/v1/catalog',...(body?{body}:{})});if(response?.ok===false || !response?.data || !Number.isSafeInteger(response.revision))throw Error('Connect your companion and try again.');return response;}
const writePreviewConnection=connectionWriter({catalog:previewCatalog,validateBookmark:async node=>{const [current]=await chrome.bookmarks.get(node.id);if(current?.url!==node.url)throw Error('This bookmark changed. Reopen the preview.');},isAuthored:authored,local:(node,action,value)=>blankBoard.connect(node,action,value),onSnapshot:data=>{associations=indexAssociations(data);metadataState='ready';}});
const previewSections=installPreviewSections({getBookmarks:()=>pinItems(roots),getImage:node=>imageFor(node),save:async(key,action,value)=>{const node=selected;if(!node || itemKey(node)!==key)throw Error('This preview changed. Reopen it.');await writePreviewConnection(node,action,value);if(selected && itemKey(selected)===key)openDetailContent(node);},onImage:(image,title)=>{previewingLinkedImage=!!image;updateTaggingAction();const shown=image || imageFor(selected);if(shown)$('detail-image').src=shown;$('detail-image').hidden=!shown;$('detail-image').alt=title || selected?.title || 'Card image';$('detail-scroll').scrollTo?.({top:0,behavior:'instant'});}});
const cardHolds=createCardHold({onRelease:()=>updatePriorities()});
function holdCard(node){const position=positionById.get(node.id);if(!position)return;const mounted=[...blocks.values()].flatMap(block=>[...block.children]).find(card=>card.atlasNode.id===node.id),rect=mounted?.getBoundingClientRect(),root=$('pins').getBoundingClientRect();const actual=rect && Number.isFinite(rect.left) && Number.isFinite(root.left)?{...position,x:rect.left-root.left,y:rect.top-root.top}:position;cardHolds.hold(node.id,actual);}
let tagsChangedURL=null;
function cardSignature(node){return JSON.stringify([node.title,node.url,imageFor(node)]);}
function card(node){
  const article=el('article');article.className='pin';article.atlasNode=node;article.atlasSignature=cardSignature(node);for(const event of ['pointermove','pointerdown','keydown','focusin'])article.addEventListener(event,()=>cardHolds.touch(node.id));const image=imageFor(node);
  if(image){
    const button=el('button');button.className='pin-visual';button.setAttribute('aria-label','Preview '+(node.title || node.url));
    const geometry=imageGeometry.get(image);button.style.aspectRatio=geometry || '4 / 3';
    const img=el('img');img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.alt=node.title || '';const loading=el('span');loading.className='pin-loading';loading.append(el('strong','A'),el('span','Loading image…'));button.append(img,loading);img.onload=()=>{if(img.naturalWidth && img.naturalHeight){const ratio=img.naturalWidth+' / '+img.naturalHeight;imageGeometry.set(image,ratio);button.style.aspectRatio=ratio;}button.classList.add('is-ready');scheduleWindow();};img.src=image;button.onclick=()=>openDetail(node);
    img.onerror=()=>{failedImages.add(image);article.replaceChildren();emptyCard(article,node);scheduleWindow();};
    const copy=el('div');copy.className='pin-copy';const strip=tagStrip(node),copyHeight=strip?138:78;copy.style.height=copyHeight+'px';button.style.height='calc(100% - '+copyHeight+'px)';const title=link(node,node.title || hostLabel(node));title.className='pin-title';const url=link(node,hostLabel(node));url.className='pin-url';copy.append(title,url);if(strip)copy.append(strip);article.append(button,copy);
    const tagEdit=el('button');tagEdit.className='image-tag-edit';tagEdit.type='button';tagEdit.style.bottom=(copyHeight+16)+'px';tagEdit.setAttribute('aria-label','Edit tags for '+(node.title || node.url));const icon=el('span');icon.className='image-tag-icon';icon.setAttribute('aria-hidden','true');tagEdit.append(icon);
    let idle;const reveal=()=>{tagEdit.setAttribute('data-visible','');clearTimeout(idle);idle=setTimeout(()=>tagEdit.removeAttribute('data-visible'),1600);};
    button.addEventListener('pointermove',reveal);button.addEventListener('pointerenter',reveal);tagEdit.addEventListener('pointermove',reveal);article.addEventListener('pointerleave',()=>{clearTimeout(idle);tagEdit.removeAttribute('data-visible');});
    tagEdit.onclick=event=>{event?.stopPropagation();tagsChangedURL=itemKey(node);editTags(node);};article.append(tagEdit);
  }else emptyCard(article,node);
  return article;
}
function emptyCard(article,node){const row=el('div');row.className='pin-empty';const url=link(node,node.url || node.title || 'Personal card');url.className='pin-url';url.title=node.url;const add=el('button','+');add.setAttribute('aria-label','Add image to '+(node.title || node.url));add.onclick=()=>pickImage(node);row.append(url,add);article.append(row);const fetch=el('button',node.url?'Fetch':'Preview');fetch.className='fetch-one';fetch.setAttribute('aria-label',(node.url?'Fetch cover for ':'Preview ')+(node.title || node.url));fetch.onclick=()=>node.url?coverFetch.request(node):openDetail(node);article.append(fetch);const strip=tagStrip(node);const tagEdit=el('button');tagEdit.className='image-tag-edit empty-tag-edit';tagEdit.type='button';tagEdit.setAttribute('aria-label','Edit tags for '+(node.title || node.url));const icon=el('span');icon.className='image-tag-icon';icon.setAttribute('aria-hidden','true');tagEdit.append(icon);tagEdit.onclick=event=>{event?.stopPropagation();tagsChangedURL=itemKey(node);editTags(node);};article.append(tagEdit);if(strip){tagEdit.style.bottom='68px';article.className+=' pin-with-tags';article.append(strip);}}
function localScroll(){return Math.max(0,-$('pins').getBoundingClientRect().top);}
function columns(){
  const width=$('pins').clientWidth || 1100;
  return window.innerWidth<=540 ? 2 : Math.max(1,Math.min(7,Math.floor((width+20)/230)));
}
function scheduleWindow(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;renderWindow();});}
function positionCard(element,position){if(!position)return;Object.assign(element.style,{position:'absolute',left:position.x+'px',top:position.y+'px',width:position.width+'px',height:position.height+'px',margin:'0'});}
function renderWindow(preserveAnchor=true){
  const mounted=[...blocks.values()].flatMap(block=>[...block.children]);
  const mountedById=new Map(mounted.map(element=>[element.atlasNode.id,element]));
  const anchor=(preserveAnchor?mounted:[]).find(element=>{const r=element.getBoundingClientRect();return r.bottom>0 && r.top<(window.innerHeight || 768);});
  const oldAnchor=anchor?.getBoundingClientRect().top;
  const cols=columns(),gap=window.innerWidth<=540?12:20,width=(($('pins').clientWidth || 1100)-(cols-1)*gap)/cols;
  const layout=heldMasonry(items,cols,width,gap,node=>{
    const image=imageFor(node),parts=(imageGeometry.get(image) || '4 / 3').split('/').map(Number),ratio=parts[0]/parts[1];
    const visual=image?Math.max(window.innerWidth<=540?120:160,Math.min(480,width/ratio)):0;
    const extra=tagsFor(node).length?60:0;return image?visual+78+extra:108+extra;
  },cardHolds.active());positions=layout.positions;const ends=layout.ends;
  positionById=new Map(positions.map(position=>[position.node.id,position]));
  const composerRegion=blankBoard.region?.();
  if($('folder').value==='blank' && blankBoard.composing?.() && composerRegion){
    const column=ends.indexOf(Math.min(...ends));Object.assign(composerRegion.style,{position:'absolute',left:(column*(width+gap))+'px',top:ends[column]+'px',width:width+'px',margin:'0'});
    ends[column]+=Math.max(620,composerRegion.getBoundingClientRect().height || 720)+24;
  }
  $('pins').style.height=Math.max(0,...ends)+'px';
  // Keep the same visible card anchored as intrinsic image ratios become known.
  if(anchor && oldAnchor!==undefined){const next=positionById.get(anchor.atlasNode.id);const prior=parseFloat(anchor.style.top);if(next && Number.isFinite(prior)){const delta=next.y-prior;if(Math.abs(delta)>1)window.scrollBy({top:delta,behavior:'instant'});}}
  const top=localScroll(),bottom=top+(window.innerHeight || 768);
  const visible=positions.filter(position=>position.y+position.height>=top && position.y<=bottom);
  const chosen=new Set(visible.map(position=>position.index));
  // Fill the remaining budget with nearest neighbors, never whole remote batches.
  for(const position of [...positions].sort((a,b)=>Math.abs(a.y-top)-Math.abs(b.y-top))){if(chosen.size>=limit)break;chosen.add(position.index);}
  const selected=positions.filter(position=>chosen.has(position.index)),wantedBatches=new Set(selected.map(position=>Math.floor(position.index/BATCH)));
  for(const [index,block] of blocks)if(!wantedBatches.has(index)){if(block.contains(document.activeElement)){$('pins').tabIndex=-1;$('pins').focus({preventScroll:true});}block.remove();blocks.delete(index);}
  for(const index of wantedBatches){let block=blocks.get(index);if(!block){block=el('div');block.className='pin-block';blocks.set(index,block);}
    const existing=new Map([...block.children].map(element=>[element.atlasNode.id,element]));
    const wanted=selected.filter(position=>Math.floor(position.index/BATCH)===index);
    const nodes=wanted.map(position=>{const prior=existing.get(position.node.id) || mountedById.get(position.node.id);const element=prior?.atlasSignature===cardSignature(position.node)?prior:card(position.node);element.atlasNode=position.node;positionCard(element,position);return element;});
    if(nodes.length!==block.children.length || nodes.some((node,i)=>node!==block.children[i])){
      if([...block.children].some(element=>element.contains(document.activeElement) && !nodes.includes(element))){$('pins').tabIndex=-1;$('pins').focus({preventScroll:true});}
      block.replaceChildren(...nodes);
    }
  }
  topSpacer.style.height=(selected[0]?.y || 0)+'px';bottomSpacer.style.height='0px';
  const wanted=[topSpacer,...[...blocks].sort((a,b)=>a[0]-b[0]).map(([,block])=>block),...(composerRegion?[composerRegion]:[]),bottomSpacer];
  const current=[...$('pins').children];if(current.length!==wanted.length || current.some((node,i)=>node!==wanted[i]))$('pins').replaceChildren(...wanted);
  coverFetch.discover();
  status(items.length ? `${items.length.toLocaleString()} ${$('folder').value==='blank'?'card':'bookmark'}${items.length===1?'':'s'}` : ($('folder').value!=='blank' && (selectionTags().length || $('tags-only').checked) && metadataState==='unavailable'?'Connect your companion to load saved tags, then Refresh.':'No matches. Try different tags or search words, or turn off a filter.'));
}
function resetBlocks(){blocks.clear();$('pins').replaceChildren();renderWindow();}
const selectionKey=tag=>tag.normalize('NFKC').trim().toLowerCase();
function selectionTags(){return [...new Map([...highlightedTags,...tagQuery($('search').value).tags].map(tag=>[selectionKey(tag),tag])).values()];}
function isSelectedTag(tag){return selectionTags().some(value=>selectionKey(value)===selectionKey(tag));}
function removeTag(tag){
  const key=selectionKey(tag);for(const value of highlightedTags)if(selectionKey(value)===key)highlightedTags.delete(value);
  const q=tagQuery($('search').value),rest=q.tags.filter(value=>selectionKey(value)!==key);
  $('search').value=q.text+(rest.length?' tag:'+rest.join(','):'');
}
function tagButton(tag,className,node=null){
  const button=el('button',tag);button.type='button';button.className=className;button.title=tag;button.dataset && (button.dataset.tag=tag);button.setAttribute('aria-pressed',String(isSelectedTag(tag)));
  button.onclick=()=>{if(node)holdCard(node);if(isSelectedTag(tag))removeTag(tag);else highlightedTags.add(tag);coverFetch.stop();updatePriorities();};return button;
}
function syncSelection(){for(const button of document.querySelectorAll?.('[data-tag]') || [])button.setAttribute('aria-pressed',String(isSelectedTag(button.dataset.tag)));}

function filteredNodes(){
  const query=tagQuery($('search').value),selected=selectionTags();
  // Clicked tags and typed tag: clauses rank identically. Only ordinary search
  // words (and explicit image/tag-only settings) narrow the collection.
  const nodes=collectionNodes(query.text).filter(node=>!$('tags-only').checked || tagsFor(node).length);
  if(!selected.length)return nodes;
  // More matching tags means higher priority; duplicate labels never add weight.
  const keys=new Set(selected.map(tag=>tag.normalize('NFKC').toLowerCase()));
  return nodes.map((node,index)=>{
    const available=new Set(tagsFor(node).map(tag=>tag.normalize('NFKC').toLowerCase()));
    const score=[...keys].reduce((count,key)=>count+Number(available.has(key)),0);
    return {node,index,score};
  }).sort((a,b)=>b.score-a.score || a.index-b.index).map(entry=>entry.node);
}
const priorityAnimations=new WeakMap(),retiringCards=new Map();
function updatePriorities(){
  // Finish previous exits first; rapid input must never accumulate spare cards.
  for(const [card,animation] of retiringCards){animation.cancel();card.remove();}retiringCards.clear();
  const mounted=[...blocks.values()].flatMap(block=>[...block.children]);
  const before=new Map(mounted.map(card=>[card,card.getBoundingClientRect()]));
  for(const card of mounted)priorityAnimations.get(card)?.cancel();
  items=filteredNodes().filter(node=>!$('images-only').checked || imageFor(node));renderTags();renderWindow(false);
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  const height=window.innerHeight || 768,visible=rect=>rect.bottom>0 && rect.top<height;
  let moving=0,leaving=0;
  // Compositor-only, bounded motion. Reuse the actual card/image; never clone
  // an image or run transitions during ordinary scroll-window maintenance.
  for(const [card,old] of before){
    if(!card.animate)continue;
    if(!card.isConnected){
      if(!visible(old) || leaving>=8 || !document.body?.append)continue;
      leaving++;
      Object.assign(card.style,{position:'fixed',left:(old.left || 0)+'px',top:old.top+'px',width:(old.width || parseFloat(card.style.width))+'px',height:(old.height || parseFloat(card.style.height))+'px',pointerEvents:'none',zIndex:'1'});
      card.setAttribute('aria-hidden','true');card.inert=true;document.body.append(card);
      const animation=card.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(6px)'}],{duration:100,easing:'ease-out'});
      retiringCards.set(card,animation);
      const cleanup=()=>{if(retiringCards.get(card)===animation){retiringCards.delete(card);card.remove();}};
      animation.finished.then(cleanup,cleanup);
      continue;
    }
    const next=card.getBoundingClientRect(),dx=(old.left || 0)-(next.left || 0),dy=old.top-next.top;
    if(moving>=24 || Math.abs(dx)+Math.abs(dy)<1 || Math.abs(dy)>height*1.5 || (!visible(old) && !visible(next)))continue;
    moving++;
    priorityAnimations.set(card,card.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'translate(0,0)'}],{duration:260,easing:'cubic-bezier(.2,.7,.2,1)'}));
  }
  for(const block of blocks.values())for(const card of block.children){
    if(moving>=24 || before.has(card) || !card.animate || !visible(card.getBoundingClientRect()))continue;
    moving++;
    priorityAnimations.set(card,card.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'cubic-bezier(.2,.7,.2,1)'}));
  }
}

function renderTags(){
  $('tag-browser').hidden=false;
  const tags=[...new Set(collectionNodes().flatMap(tagsFor))].sort((a,b)=>Number(isSelectedTag(b))-Number(isSelectedTag(a)) || a.localeCompare(b,undefined,{sensitivity:'base',numeric:true}));
  $('tag-browser').hidden=false;
  $('tag-field').replaceChildren(...tags.map(tag=>tagButton(tag,'browse-tag')));if(!tags.length)$('tag-field').append(el('p',metadataState==='loading'?'Loading tags…':metadataState==='unavailable' && $('folder').value!=='blank'?'Tags could not load. Connect your companion and Refresh.':'No saved tags in this collection.'));
  const required=selectionTags();$('active-tags').hidden=!required.length;
  const label=el('span','Prioritizing');$('active-tags').replaceChildren(label,...required.map(tag=>{const b=el('button',tag+' ×');b.setAttribute('aria-label','Unselect '+tag);b.onclick=()=>{removeTag(tag);coverFetch.stop();updatePriorities();};return b;}));syncSelection();
}
function render(){cardHolds.clear();const blank=$('folder').value==='blank';blankBoard.show(blank);$('pins').hidden=false;$('fetch-dock').hidden=blank;$('status').hidden=false;document.querySelector('.board-options').hidden=false;renderTags();items=filteredNodes().filter(node=>!$('images-only').checked || imageFor(node));resetBlocks();}


function updateTagCard(node){
  const article=[...blocks.values()].flatMap(block=>[...block.children]).find(element=>element.atlasNode.id===node.id);if(!article)return;
  const copy=[...article.children].find(child=>child.className==='pin-copy'),host=copy || article;
  const old=[...host.children].find(child=>child.className==='pin-tags');old?.remove();const strip=tagStrip(node);if(strip)host.append(strip);
  const overlay=[...article.children].find(child=>child.className.includes('image-tag-edit'));
  if(copy){const height=strip?138:78;copy.style.height=height+'px';article.children[0].style.height='calc(100% - '+height+'px)';if(overlay)overlay.style.bottom=(height+16)+'px';}
  else{article.className=strip?'pin pin-with-tags':'pin';if(overlay)overlay.style.bottom=strip?'68px':'8px';}
}
function updateCoverCard(node){
  const block=[...blocks.values()].find(block=>[...block.children].some(element=>element.atlasNode?.id===node.id));if(!block)return;
  const old=[...block.children].find(element=>element.atlasNode.id===node.id);if(old.atlasNode.url!==node.url)return;
  const replacement=card(node);positionCard(replacement,positionById.get(node.id));old.replaceWith(replacement);scheduleWindow();
}
async function saveSettings(){try{await chrome.storage.local.set({[PINBOARD_SETTINGS]:{version:1,limit,imagesOnly:$('images-only').checked,tagsOnly:$('tags-only').checked}});}catch{status('PINBOARD_SETTINGS_SAVE_FAILED: Your current view still works; settings were not saved.');}}
function indexAssociations(data){
  const byResource=new Map(),result=new Map();
  for(const resource of Object.values(data?.resources || {}))if(resource.kind==='bookmark')for(const locator of resource.locators || [])if(locator.provider==='web'){
    const entry=result.get(locator.reference) || {note:'',tags:[],image:null,notes:[],bookmarks:[]};entry.note=resource.note || entry.note;if(resource.note && !entry.notes.some(note=>note.id===resource.id))entry.notes.push({id:resource.id,title:resource.title || 'Note',text:resource.note});entry.tags=[...new Set([...entry.tags,...(data.tags?.[resource.id] || [])])];result.set(locator.reference,entry);byResource.set(resource.id,entry);
  }
  for(const relation of data?.relations || []){const entry=byResource.get(relation.from),target=data.resources?.[relation.to];if(!entry || !target)continue;if(target.kind==='image' && !entry.image)entry.image=(target.locators || []).map(l=>l.provider==='web'?directImage(l.reference):null).find(Boolean) || null;if(target.kind==='note' && target.note){entry.note+=(entry.note?'\n\n':'')+target.note;if(!entry.notes.some(note=>note.id===target.id))entry.notes.push({id:target.id,title:target.title || 'Note',text:target.note});}if(target.kind==='bookmark'){const url=(target.locators || []).find(locator=>locator.provider==='web')?.reference;if(url && !entry.bookmarks.some(bookmark=>bookmark.id===target.id))entry.bookmarks.push({id:target.id,title:target.title || url,url});}}
  return result;
}
async function refreshAssociations(){
  // Tags belong to exact Atlas bookmark URLs; never infer tags from titles/domains.
  try{const result=await chrome.runtime.sendMessage({type:'api',path:'/v1/catalog'});if(result?.ok===false || !result?.data)throw Error('Unavailable');associations=indexAssociations(result.data);metadataState='ready';}catch{metadataState=associations.size?'cached':'unavailable';}
}
async function refresh(){
  try{
    const chosen=$('folder').value || 'all';roots=await chrome.bookmarks.getTree();covers=(await chrome.storage.local.get(COVER_KEY))[COVER_KEY] || {};
    $('folder').replaceChildren();const blank=el('option','Create Blank');blank.value='blank';$('folder').append(blank);const all=el('option','All Bookmarks');all.value='all';$('folder').append(all);
    function folders(nodes,path=[]){for(const node of nodes)if(!node.url){const trail=[...path,node.title].filter(Boolean);if(node.id && node.parentId!==undefined){const option=el('option',trail.join(' / '));option.value=node.id;$('folder').append(option);}folders(node.children || [],trail);}}
    folders(roots);const savedBoards=(await chrome.storage.local.get(PINBOARDS_KEY))[PINBOARDS_KEY] || {};for(const saved of Object.values(savedBoards)){try{const board=boardRecord(saved);const option=el('option',board.title);option.value='board:'+board.id;$('folder').append(option);}catch{}}$('folder').value=chosen;if(!$('folder').value)$('folder').value='all';
    await blankBoard.load();await refreshAssociations();await refreshGeneratedIndex();render();
  }catch{status('PINBOARD_READ_FAILED: Could not read bookmarks. Reload the extension and check bookmark permission.');}
}
const blankBoard=installBlankBoard({scope:boardId || 'default',storage:chrome.storage.local,publicImageURL,rasterImage,getBookmarks:()=>pinItems(roots),describeBookmark:node=>({image:imageFor(node),note:metadata(node).note,tags:humanTagsFor(node)}),onChanged:async()=>{await refreshGeneratedIndex();updatePriorities();},onLayout:scheduleWindow});
// Alt+Q clears browsing selection only. Escape remains exclusively available
// to previews/dialogs. Ordinary search words and attached tags are preserved.
window.addEventListener('keydown',event=>{
  // Hover gives the tag viewport arrow scrolling without stealing keys from editors/dialogs.
  if(['ArrowUp','ArrowDown'].includes(event.key) && !event.defaultPrevented && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && !(document.querySelectorAll?.('dialog[open]') || []).length && !event.target?.matches?.('input,textarea,select,[contenteditable]')){
    const browser=$('tag-browser'),field=$('tag-field');
    if(!browser.hidden && (browser.matches?.(':hover') || browser.contains?.(document.activeElement)) && field.scrollHeight>field.clientHeight){
      event.preventDefault();field.scrollTop=Math.max(0,Math.min(field.scrollHeight-field.clientHeight,field.scrollTop+(event.key==='ArrowDown'?48:-48)));return;
    }
  }
  if(event.key?.toLowerCase()!=='q' || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat || event.defaultPrevented || $('detail').open || $('image-source').open || (document.querySelectorAll?.('dialog[open]') || []).length)return;
  if(event.target!==$('search') && event.target?.matches?.('input,textarea,select,[contenteditable]'))return;
  const query=tagQuery($('search').value);
  if(!highlightedTags.size && !query.tags.length)return;
  event.preventDefault();cardHolds.clear();highlightedTags.clear();$('search').value=query.text;clearTimeout(searchTimer);coverFetch.stop();updatePriorities();
});
$('tags-only').onchange=()=>{coverFetch.stop();render();saveSettings();};
async function refreshCoverUsage(){
  try{const saved=(await chrome.storage.local.get(COVER_BUDGET_KEY))[COVER_BUDGET_KEY];$('cover-budget').value=String(coverBudgetMiB(saved));const bytes=coverStorageBytes((await chrome.storage.local.get(COVER_KEY))[COVER_KEY] || {});$('cover-usage').textContent=(bytes/1048576).toFixed(1)+' MiB saved · '+coverBudgetMiB(saved)+' MiB limit';}catch{$('cover-usage').textContent='Usage unavailable';}
}
$('save-cover-budget').onclick=async()=>{
  const value=Number($('cover-budget').value);if(!Number.isInteger(value) || value<8 || value>512){$('cover-budget-status').textContent='Enter a whole number from 8 to 512 MiB.';return;}
  $('save-cover-budget').disabled=true;
  try{await navigator.locks.request('atlas-pages-v1',()=>chrome.storage.local.set({[COVER_BUDGET_KEY]:value}));await refreshCoverUsage();$('cover-budget-status').textContent='Saved. Existing images are kept.';}catch{$('cover-budget-status').textContent='Could not save. Your previous limit remains.';}finally{$('save-cover-budget').disabled=false;}
};
refreshCoverUsage();
const fetchDock=$('fetch-dock');let hoverOpened=false;
fetchDock.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse' && !fetchDock.open){hoverOpened=true;fetchDock.open=true;}});
fetchDock.addEventListener('pointerleave',()=>{if(hoverOpened && !fetchDock.contains(document.activeElement)){fetchDock.open=false;hoverOpened=false;}});
fetchDock.addEventListener('focusout',()=>{setTimeout(()=>{if(hoverOpened && !fetchDock.contains(document.activeElement) && !fetchDock.matches(':hover')){fetchDock.open=false;hoverOpened=false;}},0);});
fetchDock.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();event.preventDefault();fetchDock.open=false;hoverOpened=false;fetchDock.querySelector('summary').focus();}});
$('folder').onchange=()=>{if($('folder').value.startsWith('board:')){location.href='pinboard.html?id='+encodeURIComponent($('folder').value.slice(6));return;}coverFetch.stop();render();$('pins').scrollIntoView({block:'start',behavior:'instant'});scheduleWindow();};let searchTimer;$('search').oninput=()=>{coverFetch.stop();clearTimeout(searchTimer);searchTimer=setTimeout(()=>updatePriorities(),160);};
$('refresh').onclick=refresh;
$('new-pinboard').onclick=()=>{$('new-board-title').value='';$('new-board-status').textContent='';$('new-board-dialog').showModal();$('new-board-title').focus();};
$('cancel-new-board').onclick=()=>$('new-board-dialog').close();
$('new-board-form').onsubmit=async event=>{event.preventDefault();const title=$('new-board-title').value.trim();if(!title)return;try{const id=crypto.randomUUID();await navigator.locks.request('atlas-pages-v1',()=>createPinboard(chrome.storage.local,{id:'',url:''},title,id,'blank'));location.href='pinboard.html?id='+encodeURIComponent(id);}catch{$('new-board-status').textContent='Could not create this pinboard. Please try again.';}};
$('images-only').onchange=()=>{render();$('pins').scrollIntoView({block:'start',behavior:'instant'});scheduleWindow();saveSettings();};
$('card-limit').onchange=()=>{limit=cardLimit($('card-limit').value);renderWindow();saveSettings();};
window.addEventListener('scroll',scheduleWindow,{passive:true});
window.addEventListener('resize',()=>{cardHolds.clear();scheduleWindow();});
$('edit-authored-card').onclick=()=>{const node=selected;$('detail').close();blankBoard.edit(node);};
$('delete-authored-card').onclick=async()=>{if(!authored(selected) || !window.confirm('Remove this card from the board?'))return;try{await blankBoard.remove(selected);$('detail').close();}catch(error){setTaggingChoiceStatus(error.message || 'Card could not be removed.');}};
$('close').onclick=()=>$('detail').close();$('detail').addEventListener('close',()=>{$('detail-image').removeAttribute('src');if(!$('image-source').open)document.documentElement.removeAttribute('data-pin-open');});
$('replace-image').onclick=()=>pickImage(selected);
$('cancel-image').onclick=()=>$('image-source').close();
$('image-source').addEventListener('close',()=>{if(!$('detail').open)document.documentElement.removeAttribute('data-pin-open');});
$('upload-image').onclick=()=>{$('image-source').close();$('image-file').value='';$('image-file').click();};
async function saveImage(node,image){
  if(authored(node)){await blankBoard.patch(node,{image});if($('detail').open && selected?.id===node.id)openDetailContent(node);updateCoverCard(node);scheduleWindow();return;}
  await navigator.locks.request('atlas-pages-v1',async()=>{const latest=(await chrome.storage.local.get(COVER_KEY))[COVER_KEY] || {};covers=setBookmarkCover(latest,node,image,(await chrome.storage.local.get(COVER_BUDGET_KEY))[COVER_BUDGET_KEY]);await chrome.storage.local.set({[COVER_KEY]:covers});});refreshCoverUsage();
  if($('detail').open && selected?.id===node.id)$('detail-image').src=image;
  render();status('Bookmark image saved. The shelf and this pinboard use the same cover.');
}
$('save-image-url').onclick=async()=>{
  const image=publicImageURL($('cover-url').value.trim()),node=selected;
  if(!image || image.length>8192){$('image-status').textContent='Enter a public HTTP(S) image URL without credentials or signed access tokens.';return;}
  $('save-image-url').disabled=true;
  try{await saveImage(node,image);$('image-source').close();}catch{$('image-status').textContent='Could not save the image reference. Existing covers are unchanged.';}
  finally{$('save-image-url').disabled=false;}
};
$('image-file').onchange=async()=>{
  const file=$('image-file').files?.[0],node=selected;if(!file || !node)return;
  try{
    status('Preparing bookmark image…');
    const image=await rasterImage(file,60000);
    await saveImage(node,image);
  }catch(error){status((error.message || 'PINBOARD_IMAGE_FAILED')+': Image not added. Try a smaller image; existing bookmarks are unchanged.');}
};
const coverFetch=installCoverFetch({
  getScope:()=>JSON.stringify([boardId,$('folder').value,$('search').value.trim(),selectionTags().map(selectionKey),$('tags-only').checked]),
  getNodes:()=>filteredNodes().filter(node=>!!node.url),
  getMounted:()=>[...blocks.values()].flatMap(block=>[...block.children].map(element=>({element,node:element.atlasNode}))),
  hasCover:node=>!!imageFor(node),raster:rasterImage,
  saveCover:async(node,image)=>{
    if(authored(node)){await blankBoard.patch(node,{image});return true;}
    return navigator.locks.request('atlas-pages-v1',async()=>{
    const current=await chrome.bookmarks.get(node.id);if(current[0]?.url!==node.url)return false;
    const latest=(await chrome.storage.local.get(COVER_KEY))[COVER_KEY] || {};
    if(bookmarkCover(node,latest)){covers=latest;return false;}
    const next=setBookmarkCover(latest,node,image,(await chrome.storage.local.get(COVER_BUDGET_KEY))[COVER_BUDGET_KEY]);await chrome.storage.local.set({[COVER_KEY]:next});covers=next;return true;
    });
  },
  onSaved:node=>{updateCoverCard(node);refreshCoverUsage();}
});
async function start(){
  try{const saved=(await chrome.storage.local.get(PINBOARD_SETTINGS))[PINBOARD_SETTINGS];limit=cardLimit(saved?.limit);$('card-limit').value=String(limit);$('images-only').checked=saved?.imagesOnly===true;$('tags-only').checked=saved?.tagsOnly===true;}catch{}
  await refresh();
  if(boardId){try{const board=boardRecord((await chrome.storage.local.get(PINBOARDS_KEY))[PINBOARDS_KEY]?.[boardId]);$('title').textContent=board.title;document.title=board.title+' · Atlas Pinboard';const exists=[...$('folder').options].some(o=>o.value===board.folderId);$('folder').value=exists?board.folderId:'all';if(!exists){items=[];resetBlocks();status('PINBOARD_FOLDER_MISSING: Choose another folder to browse.');}else render();}catch{items=[];resetBlocks();status('PINBOARD_NOT_FOUND: This saved pinboard is unavailable.');}}

}
start();
