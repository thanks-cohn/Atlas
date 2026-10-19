import {installSourceNavigation} from './source-navigation.js';
import {createImageEntries,IMAGE_ENTRIES,IMAGE_RECOVERY,entryKey,localImageOrigin,urlImageOrigin} from './image-entries.js';
import {createCardHold,heldMasonry} from './pinboard-card-hold.js';
import {connectionWriter} from './pinboard-preview-connections.js';
import {installPreviewSections} from './pinboard-preview-sections.js';
import {generationImage,generateModels,imageReference,generatedTags,mergeGeneratedRun,tagKey,checkpointTags} from './pinboard-generation.js';
import {installTagEditor,removeBookmarkTag,TAG_VOCABULARY} from './pinboard-tag-editor.js';
import {installBlankBoard} from './pinboard-blank.js';
import {installCoverFetch} from './fetch-covers.js';
import {PINBOARDS_KEY,PINBOARD_SETTINGS,BATCH,pinItems,boardRecord,cardLimit,tagQuery,createPinboard} from './pinboard-model.js';
import {COVER_BUDGET_KEY,coverBudgetMiB,coverStorageBytes,COVER_KEY,bookmarkCover,createBookmarkCoverReader,setBookmarkCover,directImage} from './bookmark-covers.js';
import {publicImageURL} from './pages-store.js';
import {rasterImage} from './image-file.js';
const $=id=>document.getElementById(id),el=(tag,text='')=>{const node=document.createElement(tag);node.textContent=text;return node;};
let previewingLinkedImage=false,imageTarget=null;
let highlightedTags=new Set(),metadataState='loading';
let roots=[],covers={},items=[],selected=null,associations=new Map();
let boardAssetsReady=false,boardAssetsPromise=Promise.resolve();
const imageGeometry=new Map(),failedImages=new Set();
let positions=[],positionById=new Map();
let blocks=new Map(),frame=0,limit=72;
let windowLayoutDirty=true,windowLayoutCache=null;
let viewportWindowState={visible_cards:0,buffer_cards:0,viewport_top:0,viewport_bottom:0};
let deferredBoardWindow=false,deferredBoardReset=false,boardResumePending=false;
const boardLayoutBlocked=()=>boardResumePending || $('detail').open || $('image-source').open;
const topSpacer=el('div'),bottomSpacer=el('div');topSpacer.className=bottomSpacer.className='pin-spacer';
const boardId=new URL(location.href).searchParams.get('id');
const status=text=>$('status').textContent=text;
installSourceNavigation({chrome,choice:$('source-behavior'),feedback:$('source-behavior-status'),anchor:$('detail-link'),status:message=>setTaggingChoiceStatus(message)});
const itemKey=node=>node?.itemKey || node?.url || '';
const authored=node=>node?.kind==='authored';
const imageEntries=createImageEntries({storage:chrome.storage.local});
const galleryOwner=node=>node?.galleryOwner || itemKey(node);
const parentNode=node=>node?.parentNode || node;
const storedEntry=node=>node?.entryId?imageEntries.entry(node.galleryOwner,node.entryId):null;
function entryNode(parent,entry){return {...parent,kind:'image-entry',id:parent.id+'@'+entry.id,itemKey:entryKey(entry.id),entryId:entry.id,galleryOwner:galleryOwner(parent),parentNode:parent};}
function defaultEntryNode(node){if(node?.entryId)return node;const gallery=imageEntries.gallery(galleryOwner(node));const entry=gallery?.entries.find(e=>e.id===gallery.defaultId);return entry?entryNode(node,entry):node;}
const hostLabel=node=>node.url?new URL(node.url).hostname:'Personal card';
function collectionNodes(query=''){const nodes=$('folder').value==='blank'?blankBoard.nodes():pinItems(roots,$('folder').value);const text=query.trim().toLocaleLowerCase();return text?nodes.filter(node=>(node.title+' '+(node.url || '')).toLocaleLowerCase().includes(text)):nodes;}
function metadata(node){if(node?.entryId){const entry=storedEntry(node);return {tags:entry?.tags || [],notes:entry?.notes || [],bookmarks:entry?.bookmarks || [],image:entry?.image || null,note:''};}const projected=defaultEntryNode(node);if(projected!==node)return metadata(projected);if(imageEntries.gallery(galleryOwner(node)))return {tags:[],notes:[],bookmarks:[],image:null,note:''};if(authored(node))return blankBoard.metadata(node);return associations.get(node.url) || {note:'',tags:[],image:null};}
let coverReaderSnapshot=null,coverReader=null;
function savedCover(node){if(coverReaderSnapshot!==covers){coverReaderSnapshot=covers;coverReader=createBookmarkCoverReader(covers);}return coverReader(node);}
function imageFor(node){const gallery=imageEntries.gallery(galleryOwner(node));if(node?.entryId || gallery){const entry=node?.entryId?storedEntry(node):gallery.entries.find(e=>e.id===gallery.defaultId);const source=entry?.image;return source && !failedImages.has(source)?(source.startsWith('data:')?source:publicImageURL(source)):null;}const value=authored(node)?metadata(node).image:(savedCover(node) || metadata(node).image);if(failedImages.has(value))return null;return value?.startsWith('data:')?value:publicImageURL(value);}
function link(node,label){if(!node.url){const button=el('button',label);button.type='button';button.onclick=()=>openDetail(node);return button;}const a=el('a',label);a.href=node.url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function pickImage(node){imageTarget=parentNode(node);selected=node;$('cover-url').value='';$('image-status').textContent='';document.documentElement.setAttribute('data-pin-open','');$('image-source').showModal();}
function humanTagsFor(node){const tags=new Map();for(const tag of metadata(node).tags){if(typeof tag==='string' && tagKey(tag) && !tags.has(tagKey(tag)))tags.set(tagKey(tag),tag.trim());}return [...tags.values()];}
// Cache only validated image projections; tagsFor stays synchronous during scrolling.
const TAG_REMOVALS='atlas-card-tag-removals-v1';
const removedTags=node=>node?.entryId?(storedEntry(node)?.suppressed || {}):(cardTagRemovals[itemKey(node)] || {});
let cardTagRemovals={},generatedIndex=new Map(),generatedEpoch=0;
let generatedRefresh=null,generatedRefreshQueued=false,generatedRefreshNeedsRead=false;
let generationSnapshot=null,generationSnapshotVersion=0;
async function readGenerationSnapshot(reuse=true){
  if(reuse && generationSnapshot)return generationSnapshot;
  const version=generationSnapshotVersion,end=window.atlasDebug?.performance.begin('storage.tag-index-read');let saved;
  try{saved=await chrome.storage.local.get([TAGGING_RESULTS,JOYTAG_ACTIVATED,TAG_REMOVALS]);}finally{end?.();}
  if(version!==generationSnapshotVersion)return generationSnapshot || readGenerationSnapshot(false);
  generationSnapshot=saved;return saved;
}
function tagsFor(node){
  node=defaultEntryNode(node);
  const result=new Map(humanTagsFor(node).map(tag=>[tag.normalize('NFKC').toLowerCase(),tag]));
  const entry=generatedIndex.get(itemKey(node));
  if(entry?.image===imageFor(node))for(const tag of entry.tags){const key=tag.label.normalize('NFKC').toLowerCase();if(!result.has(key))result.set(key,tag.label);}
  const removed=removedTags(node);
  return [...result.values()].filter(tag=>!Object.hasOwn(removed,tag.normalize('NFKC').toLowerCase()));
}
function refreshGeneratedIndex(reuseState=false){
  generatedRefreshQueued=true;generatedRefreshNeedsRead ||= !reuseState;
  if(!generatedRefresh)generatedRefresh=(async()=>{
    while(generatedRefreshQueued){generatedRefreshQueued=false;const reuse=!generatedRefreshNeedsRead;generatedRefreshNeedsRead=false;const end=window.atlasDebug?.performance.begin('index.generated-tags');try{await loadGeneratedIndex(reuse);}finally{end?.();}}
  })().finally(()=>{generatedRefresh=null;if(generatedRefreshQueued)return refreshGeneratedIndex(!generatedRefreshNeedsRead);});
  return generatedRefresh;
}
async function loadGeneratedIndex(reuseState=false){
  const epoch=++generatedEpoch;
  const saved=await readGenerationSnapshot(reuseState);
  cardTagRemovals=saved[TAG_REMOVALS] || {};
  const runs=saved[TAGGING_RESULTS] || {},next=new Map();
  let sliceStarted=Date.now();
  for(const parent of [...pinItems(roots),...blankBoard.nodes()]){
    if(Date.now()-sliceStarted>8){await new Promise(resolve=>setTimeout(resolve,0));sliceStarted=Date.now();if(epoch!==generatedEpoch || generatedRefreshQueued)return;}
    const node=defaultEntryNode(parent);
    if(!runs[itemKey(node)] || !Object.keys(runs[itemKey(node)]).length)continue;
    const image=imageFor(node);if(!image)continue;
    const prior=generatedIndex.get(itemKey(node)),endHash=window.atlasDebug?.performance.begin('index.image-reference');
    let reference;try{reference=prior?.image===image && prior.reference?prior.reference:await imageReference(image);}finally{endHash?.();}
    if(epoch!==generatedEpoch || generatedRefreshQueued)return;
    next.set(itemKey(node),{image,reference,tags:generatedTags(runs[itemKey(node)],reference,saved[JOYTAG_ACTIVATED]===true)});
  }
  if(epoch!==generatedEpoch || generatedRefreshQueued)return;
  generatedIndex=next;
  // Preserve mounted images and scroll position when labels arrive.
  for(const block of blocks.values())for(const card of block.children)updateTagCard(card.atlasNode);
  items=filteredNodes().filter(node=>!$('images-only').checked || imageFor(node));
  renderTags();scheduleWindow();
}
async function removeCardTag(node,tag){
  node=defaultEntryNode(node);
  const key=tag.normalize('NFKC').toLowerCase();
  if(node.entryId){await imageEntries.mutate(node.galleryOwner,node.entryId,entry=>{entry.tags=entry.tags.filter(value=>selectionKey(value)!==key);entry.suppressed[key]={tag,actor:'human',action:'remove',at:new Date().toISOString()};},'tag-removed');await navigator.locks.request('atlas-pages-v1',async()=>{const saved=await chrome.storage.local.get(TAG_VOCABULARY);await chrome.storage.local.set({[TAG_VOCABULARY]:[...new Set([...(saved[TAG_VOCABULARY] || []),tag])]});});await refreshGeneratedIndex();if(itemKey(selected)===itemKey(node))openDetailContent(node);return;}
  if(humanTagsFor(node).some(value=>value.normalize('NFKC').toLowerCase()===key)){
    if(node.entryId)await imageEntries.mutate(node.galleryOwner,node.entryId,entry=>{entry.tags=entry.tags.filter(value=>selectionKey(value)!==key);},'human-tag-removed');else if(authored(node))await blankBoard.patch(node,{tags:humanTagsFor(node).filter(value=>value.normalize('NFKC').toLowerCase()!==key)});else associations=indexAssociations(await removeBookmarkTag(node,tag));
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
  node=defaultEntryNode(node);
  const pill=el('span');pill.className='pin-tag-pair'+(preview?' preview-tag-pair':'')+(preview && humanTagsFor(node).some(value=>selectionKey(value)===selectionKey(tag))?' human-tag':'');
  if(preview && pill.className.includes('human-tag'))pill.title='Your tag';
  const label=tagButton(tag,preview?'tag':'pin-tag',preview?null:parentNode(node));
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
let taggingChoiceEpoch=0,taggingBusy=false,modelChoiceEpoch=0,joytagEnabled=false,taggingChoiceKey=null;
function updateTaggingAction(){const chosen=['tag-image-choice'].some(id=>$(id).checked) || (!$('tag-anime-wrap').hidden && $('tag-anime-choice').checked);$('run-image-tagging').disabled=taggingBusy || previewingLinkedImage || !chosen;}
function applyJoyTagSetting(enabled){joytagEnabled=enabled;modelChoiceEpoch++;$('joytag-enabled').checked=enabled;$('tag-anime-wrap').hidden=!enabled;if(!enabled)$('tag-anime-choice').checked=false;updateTaggingAction();}
async function loadModelChoiceSetting(){const request=modelChoiceEpoch;try{const saved=await chrome.storage.local.get(JOYTAG_ACTIVATED);if(request===modelChoiceEpoch)applyJoyTagSetting(saved[JOYTAG_ACTIVATED]===true);}catch{if(request===modelChoiceEpoch)$('model-choice-status').textContent='Could not load model preference.';}}
$('joytag-enabled').onchange=async()=>{
  const enabled=$('joytag-enabled').checked;++modelChoiceEpoch;$('joytag-enabled').disabled=true;
  try{await chrome.storage.local.set({[JOYTAG_ACTIVATED]:enabled});applyJoyTagSetting(enabled);await refreshGeneratedIndex();if(selected)await showGeneratedTags(selected);$('model-choice-status').textContent='Saved.';}catch{$('model-choice-status').textContent='Could not save. Please retry.';await loadModelChoiceSetting();}finally{$('joytag-enabled').disabled=false;}
};
chrome.storage.onChanged?.addListener((changes,area)=>{if(area==='local' && (changes[JOYTAG_ACTIVATED] || changes[TAGGING_RESULTS] || changes[TAG_REMOVALS])){generationSnapshotVersion++;if(generationSnapshot){generationSnapshot={...generationSnapshot};for(const key of [JOYTAG_ACTIVATED,TAGGING_RESULTS,TAG_REMOVALS])if(changes[key])generationSnapshot[key]=changes[key].newValue;}if(changes[JOYTAG_ACTIVATED])applyJoyTagSetting(changes[JOYTAG_ACTIVATED].newValue===true);refreshGeneratedIndex(true).catch(()=>status('Saved generated tags could not be loaded.'));}});
loadModelChoiceSetting();
async function loadTaggingChoices(node){
  const key=itemKey(node),request=++taggingChoiceEpoch;
  // Refreshing this card must not hide an enabled model or clear its selections.
  if(taggingChoiceKey!==key){taggingChoiceKey=key;$('tag-anime-choice').checked=false;$('tag-image-choice').checked=false;}
  setTaggingChoiceStatus('');updateTaggingAction();
  try{
    const saved=await chrome.storage.local.get(TAGGING_UI_PREFS);
    if(itemKey(selected)!==key || request!==taggingChoiceEpoch)return;
    const prefs=saved[TAGGING_UI_PREFS]?.[key] || {};
    $('tag-image-choice').checked=prefs.objects===true;
    $('tag-anime-choice').checked=joytagEnabled && prefs.anime===true;
  }catch{if(itemKey(selected)!==key || request!==taggingChoiceEpoch)return;setTaggingChoiceStatus('Could not restore choices.');}
  updateTaggingAction();
}
async function saveTaggingChoices(){
  if(!selected)return;
  ++taggingChoiceEpoch; // A user edit supersedes an unfinished preference read.
  const key=itemKey(selected);
  const choice={objects:$('tag-image-choice').checked,anime:!$('tag-anime-wrap').hidden && $('tag-anime-choice').checked};
  updateTaggingAction();setTaggingChoiceStatus('');
  try{
    const saved=(await chrome.storage.local.get(TAGGING_UI_PREFS))[TAGGING_UI_PREFS] || {};
    await chrome.storage.local.set({[TAGGING_UI_PREFS]:{...saved,[key]:choice}});
  }catch{setTaggingChoiceStatus('Selections could not be saved; please retry.');}
}
for(const id of ['tag-image-choice','tag-anime-choice'])$(id).addEventListener('change',saveTaggingChoices);
const TAGGING_RESULTS='atlas-image-tagging-runs-v1';
const TAGGING_CHECKPOINTS='atlas-image-tagging-checkpoints-v1';
let generatedRenderVersion=0;
async function showGeneratedTags(node){
  const version=++generatedRenderVersion;
  const host=$('detail-generated-tags');
  host.replaceChildren();
  try{
    const stored=await readGenerationSnapshot();
    const runs=stored[TAGGING_RESULTS]?.[itemKey(node)] || {},animeEnabled=stored[JOYTAG_ACTIVATED]===true;
    if(version!==generatedRenderVersion || itemKey(selected)!==itemKey(node) || !Object.keys(runs).length)return;
    const image=imageFor(node),prior=generatedIndex.get(itemKey(node));
    const reference=prior?.image===image && prior.reference?prior.reference:await imageReference(image);
    if(version!==generatedRenderVersion || itemKey(selected)!==itemKey(node))return;
    const human=new Set(humanTagsFor(node).map(tagKey));
    const grouped=new Map(generatedTags(runs,reference,animeEnabled).map(entry=>[entry.label.normalize('NFKC').toLowerCase(),entry]));
    if(!grouped.size)return;
    const tags=[];
    for(const [key,entry] of grouped){
      if(human.has(key) || Object.hasOwn(removedTags(node),key))continue; // Existing human tag is already shown above.
      const chip=removableTag(node,entry.label,true);
      chip.title=entry.sources.map(item=>{
        const confidence=Number.isFinite(item.score)?' ('+Math.round(item.score*100)+'%)':'';
        return ({objects:'Things',face:'Faces',anime:'Anime'}[item.source] || 'People')+confidence;
      }).join(' · ');
      tags.push(chip);
    }
    host.replaceChildren(...tags);
  }catch{if(version===generatedRenderVersion && itemKey(selected)===itemKey(node))host.replaceChildren(el('p','Saved model results could not be loaded.'));}
}

$('run-image-tagging').onclick=async()=>{
  updateTaggingAction();
  if($('run-image-tagging').disabled || !selected)return;
  let node=selected;
  const initialKey=itemKey(node);
  const batchId=crypto.randomUUID(),batchAt=new Date().toISOString();
  const choices={objects:$('tag-image-choice').checked,anime:!$('tag-anime-wrap').hidden && $('tag-anime-choice').checked};
  taggingBusy=true;updateTaggingAction();
  const report=message=>{if(itemKey(selected)===itemKey(node))setTaggingChoiceStatus(message);};
  try{
    report('Preparing image…');
    if(!node.entryId){node=await materializeImageEntry(node);await navigator.locks.request('atlas-pages-v1',async()=>{const saved=(await chrome.storage.local.get(TAGGING_UI_PREFS))[TAGGING_UI_PREFS] || {};await chrome.storage.local.set({[TAGGING_UI_PREFS]:{...saved,[itemKey(node)]:{objects:choices.objects,anime:choices.anime}}});});if($('detail').open && itemKey(selected)===initialKey)openDetailContent(node,{preserveConnections:true});}
    const sourceImage=imageFor(node);
    const image=await generationImage(sourceImage);
    const reference=await imageReference(sourceImage);
    await generateModels({node,image,choices,send:message=>chrome.runtime.sendMessage(message),status:report,
      save:async(source,result)=>{
        result={...result,image_reference:reference,batch_id:batchId,batch_at:batchAt};
        await navigator.locks.request('atlas-pages-v1',async()=>{
          const stored=await chrome.storage.local.get([TAGGING_RESULTS,TAGGING_CHECKPOINTS,JOYTAG_ACTIVATED,TAG_VOCABULARY,IMAGE_ENTRIES]),all=stored[TAGGING_RESULTS] || {};
          if(node.entryId){if(!storedEntry(node))throw Error('The image was removed; results remain in companion evidence.');}
          const combined=mergeGeneratedRun(all[itemKey(node)],source,result);
          const checkpoints=checkpointTags(stored[TAGGING_CHECKPOINTS]?.[itemKey(node)],combined,reference,{source,run_id:result.run_id,batch_id:batchId,batch_at:batchAt,at:new Date().toISOString()},stored[JOYTAG_ACTIVATED]===true,{human:humanTagsFor(node),removed:removedTags(node)});
          const vocabulary=new Map((stored[TAG_VOCABULARY] || []).map(tag=>[tag.normalize('NFKC').toLowerCase(),tag]));
          for(const suggestion of result.suggestions || [])if(typeof suggestion.tag==='string' && suggestion.tag.trim()){const tag=suggestion.tag.trim(),key=tag.normalize('NFKC').toLowerCase();if(!vocabulary.has(key))vocabulary.set(key,tag);}
          const extra={};if(node.entryId){const galleries=structuredClone(stored[IMAGE_ENTRIES] || {}),entry=galleries[node.galleryOwner]?.entries.find(e=>e.id===node.entryId);if(!entry)throw Error('This image was removed.');entry.runs=combined;entry.history.push({id:crypto.randomUUID(),type:'model-run',actor:'model',source,runId:result.run_id || null,at:new Date().toISOString()});extra[IMAGE_ENTRIES]=galleries;}
          await chrome.storage.local.set({[TAGGING_RESULTS]:{...all,[itemKey(node)]:combined},[TAGGING_CHECKPOINTS]:{...(stored[TAGGING_CHECKPOINTS] || {}),[itemKey(node)]:checkpoints},[TAG_VOCABULARY]:[...vocabulary.values()],...extra});
        });
        await refreshGeneratedIndex();
        if(itemKey(selected)===itemKey(node))await showGeneratedTags(node);
      }});
    report('Tags generated.');
  }catch(error){report(error.message || 'Tag generation failed.');}
  finally{taggingBusy=false;updateTaggingAction();}
};
let detailOpenVersion=0,detailImageVersion=0;
function showDetailImage(source,title){
  const version=++detailImageVersion,image=$('detail-image'),placeholder=$('detail-image-placeholder');
  image.onload=null;image.onerror=null;image.hidden=true;placeholder.hidden=false;
  $('detail-image-status').textContent=source?'Loading image…':'No image saved';image.alt=title || 'Card image';
  if(!source){image.removeAttribute('src');return;}
  image.onload=()=>{if(version!==detailImageVersion)return;image.hidden=false;placeholder.hidden=true;};
  image.onerror=()=>{if(version!==detailImageVersion)return;image.hidden=true;placeholder.hidden=false;$('detail-image-status').textContent='Image unavailable. Your connected items are still accessible.';};
  image.src=source;
  if(image.complete && image.naturalWidth>0)image.onload();
}
function openDetailContent(node,{preserveConnections=false}={}){
  if(node?.entryId && !storedEntry(node))return;
  if(!preserveConnections)previewingLinkedImage=false;$('preview-add-tag').disabled=previewingLinkedImage;selected=node;$('detail-title').textContent=node.title || hostLabel(node);const image=imageFor(node);
  if(!preserveConnections || !previewingLinkedImage)showDetailImage(image,node.title);
  const details=metadata(node);previewSections.setContent(itemKey(node),{sourceURL:node.url,available:authored(node) || !['loading','unavailable'].includes(metadataState),notes:details.notes || (details.note?[{id:itemKey(node)+':note',title:node.title || 'Note',text:details.note}]:[]),bookmarks:(details.bookmarks || []).map(bookmark=>({...bookmark,image:imageFor(bookmark)}))},{preserve:preserveConnections});
  $('detail-link').hidden=!node.url;if(node.url)$('detail-link').href=node.url;else $('detail-link').removeAttribute('href');
  $('detail-tags').replaceChildren(...humanTagsFor(node).map(tag=>removableTag(node,tag,true)));
  $('edit-authored-card').hidden=$('delete-authored-card').hidden=!authored(parentNode(node));
  paintImageNavigation(node);
  loadTaggingChoices(node);showGeneratedTags(node);
}
async function openDetail(node){
  const request=++detailOpenVersion,parent=parentNode(node),endOpen=window.atlasDebug?.performance.begin('preview.open-handler');
  try{
    // Open synchronously from cached state: storage/native initialization is not
    // a prerequisite for reading already available connections.
    document.documentElement.setAttribute('data-pin-open','');
    if(!$('detail').open)$('detail').showModal();
    openDetailContent(defaultEntryNode(node));$('detail-scroll').scrollTop=0;endOpen?.();window.atlasDebug?.performance.afterPaint('preview.open');
    // Reading a preview must not write/migrate the shared gallery document.
    // Only wait for read-only hydration if startup assets/metadata are pending.
    if(boardAssetsReady && metadataState!=='loading')return;
    if(!boardAssetsReady)await boardAssetsPromise;
    if(metadataState==='loading')await refreshAssociations();
    if(request!==detailOpenVersion || !$('detail').open || galleryOwner(selected)!==galleryOwner(parent))return;
    openDetailContent(selected?.entryId?selected:defaultEntryNode(parent),{preserveConnections:true});
  }catch(error){if(request===detailOpenVersion && $('detail').open)setTaggingChoiceStatus(error.message || 'Image details could not be loaded. Cached connections remain available.');}finally{endOpen?.();}
}

const editTags=installTagEditor({localAdapter:node=>{
  node=defaultEntryNode(node);
  if(node.entryId)return {read:async()=>{await imageEntries.load();if(!storedEntry(node))throw Error('This image was removed.');return {tags:humanTagsFor(node),data:null};},mutate:async(action,tag)=>{await imageEntries.mutate(node.galleryOwner,node.entryId,entry=>{const key=selectionKey(tag);entry.tags=entry.tags.filter(value=>selectionKey(value)!==key);if(action==='tag')entry.tags.push(tag);delete entry.suppressed[key];},'human-tag-'+action);await navigator.locks.request('atlas-pages-v1',async()=>{const saved=await chrome.storage.local.get(TAG_REMOVALS),all=saved[TAG_REMOVALS] || {};const own={...all[itemKey(node)]};if(action==='tag')delete own[selectionKey(tag)];await chrome.storage.local.set({[TAG_REMOVALS]:{...all,[itemKey(node)]:own}});});return {tags:humanTagsFor(node),data:null};}};
  if(!authored(node))return null;const adapter=blankBoard.tagAdapter(node);
  return {read:adapter.read,mutate:async(action,tag)=>{const result=await adapter.mutate(action,tag);if(action==='tag')await navigator.locks.request('atlas-pages-v1',async()=>{const saved=await chrome.storage.local.get(TAG_REMOVALS),all=saved[TAG_REMOVALS] || {},own={...all[itemKey(node)]};delete own[tag.normalize('NFKC').toLowerCase()];cardTagRemovals={...all,[itemKey(node)]:own};await chrome.storage.local.set({[TAG_REMOVALS]:cardTagRemovals});});return result;}};
},onChanged:async(data,node)=>{
  if(node?.entryId || authored(node)){await refreshGeneratedIndex();if(selected && itemKey(selected)===itemKey(node))openDetailContent(node);return;}

  if(tagsChangedURL){const next=indexAssociations(data).get(tagsChangedURL)?.tags || [],prior=associations.get(tagsChangedURL)?.tags || [];
    const added=next.filter(tag=>!prior.includes(tag));
    if(added.length)await navigator.locks.request('atlas-pages-v1',async()=>{const saved=await chrome.storage.local.get(TAG_REMOVALS),all=saved[TAG_REMOVALS] || {},own={...all[tagsChangedURL]};for(const tag of added)delete own[tag.normalize('NFKC').toLowerCase()];cardTagRemovals={...all,[tagsChangedURL]:own};await chrome.storage.local.set({[TAG_REMOVALS]:cardTagRemovals});});
  }
  associations=indexAssociations(data);metadataState='ready';items=filteredNodes().filter(node=>!$('images-only').checked || imageFor(node));renderTags();for(const node of items)if(tagsChangedURL===itemKey(node))updateTagCard(node);renderWindow();if(selected && itemKey(selected)===itemKey(node))openDetailContent(node);}});
$('preview-add-tag').onclick=()=>{if(!selected)return;tagsChangedURL=itemKey(selected);editTags(selected);};
async function previewCatalog(body){const response=await chrome.runtime.sendMessage({type:'api',path:'/v1/catalog',...(body?{body}:{})});if(response?.ok===false || !response?.data || !Number.isSafeInteger(response.revision))throw Error('Connect your companion and try again.');return response;}
const writePreviewConnection=connectionWriter({catalog:previewCatalog,validateBookmark:async node=>{const [current]=await chrome.bookmarks.get(node.id);if(current?.url!==node.url)throw Error('This bookmark changed. Reopen the preview.');},isAuthored:authored,local:(node,action,value)=>blankBoard.connect(node,action,value),onSnapshot:data=>{associations=indexAssociations(data);metadataState='ready';}});
const previewSections=installPreviewSections({getBookmarks:()=>pinItems(roots),getImage:node=>imageFor(node),save:async(key,action,value)=>{const node=selected;if(!node || itemKey(node)!==key)throw Error('This preview changed. Reopen it.');if(node.entryId){if(action==='bookmark'){const [current]=await chrome.bookmarks.get(value.id);if(current?.url!==value.url)throw Error('This bookmark changed.');}await imageEntries.mutate(node.galleryOwner,node.entryId,entry=>{const field=action==='note'?'notes':'bookmarks',list=entry[field];if(value.editing){const old=list.find(item=>item.id===value.id);if(!old || old.title!==value.originalTitle || old.text!==value.originalText)throw Error('This note changed. Reopen it.');}const next=action==='note'?{id:value.id,title:value.title,text:value.text}:{id:value.id,title:value.title,url:value.url};const index=list.findIndex(item=>action==='note'?item.id===value.id:item.url===value.url);if(index<0)list.push(next);else list[index]=next;},action+'-saved');}else await writePreviewConnection(node,action,value);if(selected && itemKey(selected)===key)openDetailContent(node);},onImage:(image,title)=>{previewingLinkedImage=!!image;updateTaggingAction();paintImageNavigation(selected);$('preview-add-tag').disabled=previewingLinkedImage;const shown=image || imageFor(selected);showDetailImage(shown,title || selected?.title);$('detail-scroll').scrollTo?.({top:0,behavior:'instant'});}});
const cardHolds=createCardHold({onRelease:()=>updatePriorities()});
function holdCard(node){const position=positionById.get(node.id);if(!position)return;const mounted=[...blocks.values()].flatMap(block=>[...block.children]).find(card=>card.atlasNode.id===node.id),rect=mounted?.getBoundingClientRect(),root=$('pins').getBoundingClientRect();const actual=rect && Number.isFinite(rect.left) && Number.isFinite(root.left)?{...position,x:rect.left-root.left,y:rect.top-root.top}:position;cardHolds.hold(node.id,actual);}
let tagsChangedURL=null;
// Compare references directly: serializing a saved base64 image on every scroll
// allocates a second image-sized string for every mounted card.
function cardSignature(node){return [node.title,node.url,imageFor(node),boardAssetsReady];}
function sameCardSignature(a,b){return a?.length===b.length && a.every((value,index)=>value===b[index]);}
function card(node){
  const article=el('article');article.className='pin';article.atlasNode=node;article.atlasSignature=cardSignature(node);for(const event of ['pointermove','pointerdown','keydown','focusin'])article.addEventListener(event,()=>cardHolds.touch(node.id));const image=imageFor(node);
  if(image){
    const button=el('button');button.className='pin-visual';button.setAttribute('aria-label','Preview '+(node.title || node.url));
    const geometry=imageGeometry.get(image);button.style.aspectRatio=geometry || '4 / 3';
    const img=el('img');img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.alt=node.title || '';const loading=el('span');loading.className='pin-loading';loading.append(el('strong','A'),el('span','Loading image…'));button.append(img,loading);img.onload=()=>{let changed=false;if(img.naturalWidth && img.naturalHeight){const ratio=img.naturalWidth+' / '+img.naturalHeight;changed=imageGeometry.get(image)!==ratio;imageGeometry.set(image,ratio);if(button.style.aspectRatio!==ratio)button.style.aspectRatio=ratio;}button.classList.add('is-ready');window.atlasDebug?.performance.measure('image.loaded-pixels',(img.naturalWidth || 0)*(img.naturalHeight || 0));scheduleWindow(!changed,'image-load');};img.src=image;button.onclick=()=>openDetail(node);
    img.onerror=()=>{failedImages.add(image);article.replaceChildren();emptyCard(article,node);scheduleWindow(false,'image-error');};
    const copy=el('div');copy.className='pin-copy';const strip=tagStrip(node),copyHeight=strip?138:78;copy.style.height=copyHeight+'px';button.style.height='calc(100% - '+copyHeight+'px)';const title=link(node,node.title || hostLabel(node));title.className='pin-title';const url=link(node,hostLabel(node));url.className='pin-url';copy.append(title,url);if(strip)copy.append(strip);article.append(button,copy);
    const tagEdit=el('button');tagEdit.className='image-tag-edit';tagEdit.type='button';tagEdit.style.bottom=(copyHeight+16)+'px';tagEdit.setAttribute('aria-label','Edit tags for '+(node.title || node.url));const icon=el('span');icon.className='image-tag-icon';icon.setAttribute('aria-hidden','true');tagEdit.append(icon);
    let idle;article.atlasRelease=()=>clearTimeout(idle);const reveal=()=>{tagEdit.setAttribute('data-visible','');clearTimeout(idle);idle=setTimeout(()=>tagEdit.removeAttribute('data-visible'),1600);};
    button.addEventListener('pointermove',reveal);button.addEventListener('pointerenter',reveal);tagEdit.addEventListener('pointermove',reveal);article.addEventListener('pointerleave',()=>{clearTimeout(idle);tagEdit.removeAttribute('data-visible');});
    tagEdit.onclick=event=>{event?.stopPropagation();tagsChangedURL=itemKey(node);editTags(defaultEntryNode(node));};article.append(tagEdit);
  }else emptyCard(article,node);
  return article;
}
function emptyCard(article,node){if(!boardAssetsReady){const button=el('button');button.className='pin-initial-cover';button.type='button';button.setAttribute('aria-label','Open '+(node.title || node.url || 'card'));button.append(el('strong','A'),el('span',node.title || hostLabel(node)),el('small','Loading saved cover…'));button.onclick=()=>openDetail(node);article.append(button);return;}const row=el('div');row.className='pin-empty';const url=link(node,node.url || node.title || 'Personal card');url.className='pin-url';url.title=node.url;const add=el('button','+');add.setAttribute('aria-label','Add image to '+(node.title || node.url));add.onclick=()=>pickImage(node);row.append(url,add);article.append(row);const fetch=el('button',node.url?'Fetch':'Preview');fetch.className='fetch-one';fetch.setAttribute('aria-label',(node.url?'Fetch cover for ':'Preview ')+(node.title || node.url));fetch.onclick=()=>node.url?coverFetch.request(node):openDetail(node);article.append(fetch);const strip=tagStrip(node);const tagEdit=el('button');tagEdit.className='image-tag-edit empty-tag-edit';tagEdit.type='button';tagEdit.setAttribute('aria-label','Edit tags for '+(node.title || node.url));const icon=el('span');icon.className='image-tag-icon';icon.setAttribute('aria-hidden','true');tagEdit.append(icon);tagEdit.onclick=event=>{event?.stopPropagation();tagsChangedURL=itemKey(node);editTags(defaultEntryNode(node));};article.append(tagEdit);if(strip){tagEdit.style.bottom='68px';article.className+=' pin-with-tags';article.append(strip);}}
function localScroll(){return Math.max(0,-$('pins').getBoundingClientRect().top);}
function columns(){
  const width=$('pins').clientWidth || 1100;
  return window.innerWidth<=540 ? 2 : Math.max(1,Math.min(7,Math.floor((width+20)/230)));
}
function scheduleWindow(reuseLayout=false,reason='data'){window.atlasDebug?.performance.measure('schedule.'+(['data','scroll','resize','image-load','image-error'].includes(reason)?reason:'data'),1);if(reuseLayout!==true)windowLayoutDirty=true;if(!frame)frame=requestAnimationFrame(()=>{frame=0;renderWindow(true,!windowLayoutDirty);});}
function positionCard(element,position){if(!position)return;const style={position:'absolute',left:position.x+'px',top:position.y+'px',width:position.width+'px',height:position.height+'px',margin:'0'};for(const [key,value] of Object.entries(style))if(element.style[key]!==value)element.style[key]=value;}
function renderWindow(preserveAnchor=true,reuseLayout=false){if(boardLayoutBlocked()){deferredBoardWindow=true;return;}const end=window.atlasDebug?.performance.begin('render.window');try{return renderWindowWork(preserveAnchor,reuseLayout);}finally{end?.();}}
function renderWindowWork(preserveAnchor=true,reuseLayout=false){
  const mounted=[...blocks.values()].flatMap(block=>[...block.children]);
  const mountedById=new Map(mounted.map(element=>[element.atlasNode.id,element]));
  const cols=columns(),gap=window.innerWidth<=540?12:20,width=(($('pins').clientWidth || 1100)-(cols-1)*gap)/cols;
  const reservations=cardHolds.active(),holds=JSON.stringify(reservations.map(({id,x,y,width,height})=>[id,x,y,width,height]));
  const cached=windowLayoutCache;
  const canReuse=reuseLayout && !windowLayoutDirty && cached?.items===items && cached.cols===cols && cached.width===width && cached.gap===gap && cached.holds===holds;
  const anchor=(preserveAnchor && !canReuse?mounted:[]).find(element=>{const r=element.getBoundingClientRect();return r.bottom>0 && r.top<(window.innerHeight || 768);});
  const oldAnchor=anchor?.getBoundingClientRect().top;
  const endLayout=window.atlasDebug?.performance.begin('render.layout');
  const layout=canReuse?cached.layout:heldMasonry(items,cols,width,gap,node=>{
    const image=imageFor(node),parts=(imageGeometry.get(image) || '4 / 3').split('/').map(Number),ratio=parts[0]/parts[1];
    const visual=image?Math.max(window.innerWidth<=540?120:160,Math.min(480,width/ratio)):0;
    const extra=tagsFor(node).length?60:0;return image?visual+78+extra:108+extra;
  },reservations);
  endLayout?.();windowLayoutDirty=false;windowLayoutCache=canReuse?cached:{items,cols,width,gap,holds,layout};
  positions=layout.positions;const ends=[...layout.ends];
  if(!canReuse){
    positionById=new Map(positions.map(position=>[position.node.id,position]));
    const byY=[...positions].sort((a,b)=>a.y-b.y || a.index-b.index);let edge=-Infinity;
    windowLayoutCache.byY=byY;windowLayoutCache.bottoms=byY.map(position=>edge=Math.max(edge,position.y+position.height));
    windowLayoutCache.columns=Array.from({length:cols},()=>[]);
    for(const position of byY){const column=Math.max(0,Math.min(cols-1,Math.round(position.x/(width+gap))));windowLayoutCache.columns[column].push(position);}
  }
  window.atlasDebug?.performance.measure('render.layout-reused',Number(canReuse));
  const composerRegion=blankBoard.region?.();
  if($('folder').value==='blank' && blankBoard.composing?.() && composerRegion){
    const column=ends.indexOf(Math.min(...ends));Object.assign(composerRegion.style,{position:'absolute',left:(column*(width+gap))+'px',top:ends[column]+'px',width:width+'px',margin:'0'});
    ends[column]+=Math.max(620,composerRegion.getBoundingClientRect().height || 720)+24;
  }
  $('pins').style.height=Math.max(0,...ends)+'px';
  // Keep the same visible card anchored as intrinsic image ratios become known.
  if(anchor && oldAnchor!==undefined){const next=positionById.get(anchor.atlasNode.id);const prior=parseFloat(anchor.style.top);if(next && Number.isFinite(prior)){const delta=next.y-prior;if(Math.abs(delta)>1)window.scrollBy({top:delta,behavior:'instant'});}}
  const top=localScroll(),bottom=top+(window.innerHeight || 768);
  const endSelect=window.atlasDebug?.performance.begin('render.select');
  const {byY,bottoms}=windowLayoutCache;
  const lowerBound=(array,value,get=value=>value)=>{let lo=0,hi=array.length;while(lo<hi){const mid=(lo+hi)>>>1;if(get(array[mid])<value)lo=mid+1;else hi=mid;}return lo;};
  // A prefix maximum handles held rectangles even when masonry order is irregular.
  const chosen=new Set();let inspected=0;
  for(let index=lowerBound(bottoms,top);index<byY.length && byY[index].y<=bottom;index++){
    const position=byY[index];inspected++;if(position.y+position.height>=top)chosen.add(position.index);
  }
  const visibleCount=chosen.size,neighbors=[];
  // One masonry row means at most one card per column on each side.
  // A legacy count preference may reduce this buffer, never extend it farther.
  for(const column of windowLayoutCache.columns){
    let above=lowerBound(column,top,position=>position.y)-1;
    while(above>=0){const position=column[above--];inspected++;if(position.y+position.height<top){neighbors.push({position,distance:top-position.y-position.height});break;}}
    let below=lowerBound(column,bottom,position=>position.y);
    while(below<column.length && column[below].y<=bottom){below++;inspected++;}
    if(below<column.length){inspected++;neighbors.push({position:column[below],distance:column[below].y-bottom});}
  }
  neighbors.sort((a,b)=>a.distance-b.distance || a.position.index-b.position.index);
  for(const {position} of neighbors){if(chosen.size>=Math.max(visibleCount,limit))break;chosen.add(position.index);}
  window.atlasDebug?.performance.measure('render.visible-cards',visibleCount);
  window.atlasDebug?.performance.measure('render.buffer-cards',chosen.size-visibleCount);
  const selected=[...chosen].sort((a,b)=>a-b).map(index=>positions[index]),grouped=new Map();
  for(const position of selected){const batch=Math.floor(position.index/BATCH);if(!grouped.has(batch))grouped.set(batch,[]);grouped.get(batch).push(position);}
  const wantedBatches=new Set(grouped.keys());viewportWindowState={visible_cards:visibleCount,buffer_cards:chosen.size-visibleCount,viewport_top:top,viewport_bottom:bottom};endSelect?.();
  window.atlasDebug?.performance.measure('render.positions-inspected',inspected);
  const endMount=window.atlasDebug?.performance.begin('render.mount');let created=0,reused=0;
  for(const [index,block] of blocks)if(!wantedBatches.has(index)){if(block.contains(document.activeElement)){$('pins').tabIndex=-1;$('pins').focus({preventScroll:true});}block.remove();blocks.delete(index);}
  for(const index of wantedBatches){let block=blocks.get(index);if(!block){block=el('div');block.className='pin-block';blocks.set(index,block);}
    const existing=new Map([...block.children].map(element=>[element.atlasNode.id,element]));
    const wanted=grouped.get(index);
    const nodes=wanted.map(position=>{const prior=existing.get(position.node.id) || mountedById.get(position.node.id);const keep=prior && (canReuse || sameCardSignature(prior.atlasSignature,cardSignature(position.node)));const element=keep?prior:card(position.node);if(keep)reused++;else created++;element.atlasNode=position.node;positionCard(element,position);return element;});
    if(nodes.length!==block.children.length || nodes.some((node,i)=>node!==block.children[i])){
      if([...block.children].some(element=>element.contains(document.activeElement) && !nodes.includes(element))){$('pins').tabIndex=-1;$('pins').focus({preventScroll:true});}
      block.replaceChildren(...nodes);
    }
  }
  topSpacer.style.height=(selected[0]?.y || 0)+'px';bottomSpacer.style.height='0px';
  const wanted=[topSpacer,...[...blocks].sort((a,b)=>a[0]-b[0]).map(([,block])=>block),...(composerRegion?[composerRegion]:[]),bottomSpacer];
  const current=[...$('pins').children];if(current.length!==wanted.length || current.some((node,i)=>node!==wanted[i]))$('pins').replaceChildren(...wanted);
  // Evicted image elements must not keep requesting work after leaving the window.
  let evicted=0;for(const element of mounted)if(!element.isConnected){evicted++;releaseCardImage(element,canReuse);}
  window.atlasDebug?.performance.measure('render.cards-evicted',evicted);
  endMount?.();window.atlasDebug?.performance.measure('render.cards-created',created);window.atlasDebug?.performance.measure('render.cards-reused',reused);
  coverFetch.discover();
  status(items.length ? `${items.length.toLocaleString()} ${$('folder').value==='blank'?'card':'bookmark'}${items.length===1?'':'s'}` : ($('folder').value!=='blank' && (selectionTags().length || $('tags-only').checked) && metadataState==='unavailable'?'Connect your companion to load saved tags, then Refresh.':'No matches. Try different tags or search words, or turn off a filter.'));
}
function releaseCardImage(element,clearSource=true){element.atlasRelease?.();const image=element.querySelector('img');if(image){image.onload=null;image.onerror=null;if(clearSource)image.removeAttribute('src');}}
function resetBlocks(){if(boardLayoutBlocked()){deferredBoardReset=true;deferredBoardWindow=true;return;}for(const block of blocks.values())for(const element of block.children)releaseCardImage(element);blocks.clear();$('pins').replaceChildren();renderWindow();}
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
  syncSelection();
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
  const replacement=card(node);positionCard(replacement,positionById.get(node.id));releaseCardImage(old);old.replaceWith(replacement);scheduleWindow();
}
async function saveSettings(){try{await chrome.storage.local.set({[PINBOARD_SETTINGS]:{version:1,limit,imagesOnly:$('images-only').checked,tagsOnly:$('tags-only').checked}});}catch{status('PINBOARD_SETTINGS_SAVE_FAILED: Your current view still works; settings were not saved.');}}
function indexAssociations(data){
  const byResource=new Map(),result=new Map();
  for(const resource of Object.values(data?.resources || {}))if(resource.kind==='bookmark')for(const locator of resource.locators || [])if(locator.provider==='web'){
    const entry=result.get(locator.reference) || {note:'',tags:[],image:null,notes:[],bookmarks:[]};entry.note=resource.note || entry.note;if(resource.note && !entry.notes.some(note=>note.id===resource.id))entry.notes.push({id:resource.id,inline:true,title:resource.title || 'Note',text:resource.note});entry.tags=[...new Set([...entry.tags,...(data.tags?.[resource.id] || [])])];result.set(locator.reference,entry);byResource.set(resource.id,entry);
  }
  for(const relation of data?.relations || []){const entry=byResource.get(relation.from),target=data.resources?.[relation.to];if(!entry || !target)continue;if(target.kind==='image' && !entry.image)entry.image=(target.locators || []).map(l=>l.provider==='web'?directImage(l.reference):null).find(Boolean) || null;if(target.kind==='note' && target.note){entry.note+=(entry.note?'\n\n':'')+target.note;if(!entry.notes.some(note=>note.id===target.id))entry.notes.push({id:target.id,title:target.title || 'Note',text:target.note});}if(target.kind==='bookmark'){const url=(target.locators || []).find(locator=>locator.provider==='web')?.reference;if(url && !entry.bookmarks.some(bookmark=>bookmark.id===target.id))entry.bookmarks.push({id:target.id,title:target.title || url,url});}}
  return result;
}
async function refreshAssociations(){
  const end=window.atlasDebug?.performance.begin('load.companion-metadata');
  // Tags belong to exact Atlas bookmark URLs; never infer tags from titles/domains.
  try{const result=await chrome.runtime.sendMessage({type:'api',path:'/v1/catalog'});if(result?.ok===false || !result?.data)throw Error('Unavailable');associations=indexAssociations(result.data);metadataState='ready';}catch{metadataState=associations.size?'cached':'unavailable';}finally{end?.();}
}
let refreshVersion=0,initialBoardCollection=true,firstCardsMeasured=false;
async function refresh(){
  const request=++refreshVersion;
  try{
    let chosen=$('folder').value || 'all';
    const tree=await chrome.bookmarks.getTree();if(request!==refreshVersion)return;roots=tree;
    const savedBoards=(await chrome.storage.local.get(PINBOARDS_KEY))[PINBOARDS_KEY] || {};
    if(request!==refreshVersion)return;
    if(boardId && initialBoardCollection){
      try{chosen=boardRecord(savedBoards[boardId]).folderId;}
      catch{items=[];resetBlocks();status('PINBOARD_NOT_FOUND: This saved pinboard is unavailable.');return;}
      initialBoardCollection=false;
    }
    $('folder').replaceChildren();const blank=el('option','Create Blank');blank.value='blank';$('folder').append(blank);const all=el('option','All Bookmarks');all.value='all';$('folder').append(all);
    function folders(nodes,path=[]){for(const node of nodes)if(!node.url){const trail=[...path,node.title].filter(Boolean);if(node.id && node.parentId!==undefined){const option=el('option',trail.join(' / '));option.value=node.id;$('folder').append(option);}folders(node.children || [],trail);}}
    folders(roots);for(const saved of Object.values(savedBoards)){try{const board=boardRecord(saved);const option=el('option',board.title);option.value='board:'+board.id;$('folder').append(option);}catch{}}
    if(![...$('folder').options].some(option=>option.value===chosen)){
      $('folder').value='all';items=[];resetBlocks();status('PINBOARD_FOLDER_MISSING: Choose another folder to browse.');return;
    }
    $('folder').value=chosen;
    boardAssetsReady=false;
    // Bookmark structure is sufficient for the first usable cards. Do not make
    // companion availability, tag hashing or image storage gate that first paint.
    render();
    if(!firstCardsMeasured){firstCardsMeasured=true;window.atlasDebug?.performance.afterPaint('startup.cards');}
    boardAssetsPromise=Promise.all([
      chrome.storage.local.get(COVER_KEY).then(saved=>{if(request===refreshVersion)covers=saved[COVER_KEY] || {};}),
      blankBoard.load(),imageEntries.load()
    ]);
    await boardAssetsPromise;
    if(request!==refreshVersion)return;
    boardAssetsReady=true;render();window.atlasDebug?.performance.afterPaint('startup.saved-covers');
    await refreshAssociations();if(request!==refreshVersion)return;
    await refreshGeneratedIndex();if(request!==refreshVersion)return;
    renderWindow();
  }catch{if(request===refreshVersion)status('PINBOARD_READ_FAILED: Could not finish loading saved data. Already displayed cards remain available. Reload the extension if bookmark permission is missing.');}
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
let renamingBoard=false;
$('rename-pinboard').onclick=()=>{renamingBoard=true;$('board-menu').open=false;$('new-board-heading').textContent='Rename pinboard';$('save-board-name').textContent='Save Name';$('new-board-title').value=$('title').textContent;$('new-board-status').textContent='';$('new-board-dialog').showModal();$('new-board-title').focus();};
$('new-pinboard').onclick=()=>{renamingBoard=false;$('new-board-heading').textContent='Create a pinboard';$('save-board-name').textContent='Create Pinboard';$('new-board-title').value='';$('new-board-status').textContent='';$('new-board-dialog').showModal();$('new-board-title').focus();};
$('cancel-new-board').onclick=()=>$('new-board-dialog').close();
$('new-board-form').onsubmit=async event=>{event.preventDefault();const title=$('new-board-title').value.trim();if(!title || title.length>200)return;try{if(renamingBoard){await navigator.locks.request('atlas-pages-v1',async()=>{if(boardId){const saved=(await chrome.storage.local.get(PINBOARDS_KEY))[PINBOARDS_KEY] || {};const board=boardRecord(saved[boardId]);await chrome.storage.local.set({[PINBOARDS_KEY]:{...saved,[boardId]:{...board,title}}});for(const option of $('folder').options)if(option.value==='board:'+boardId)option.textContent=title;}else await chrome.storage.local.set({'atlas.pinboard.default-title.v1':title});});$('title').textContent=title;document.title=title+' · Atlas Pinboard';$('new-board-dialog').close();return;}const id=crypto.randomUUID();await navigator.locks.request('atlas-pages-v1',()=>createPinboard(chrome.storage.local,{id:'',url:''},title,id,'blank'));location.href='pinboard.html?id='+encodeURIComponent(id);}catch{$('new-board-status').textContent='Could not create this pinboard. Please try again.';}};
$('images-only').onchange=()=>{render();$('pins').scrollIntoView({block:'start',behavior:'instant'});scheduleWindow();saveSettings();};
$('card-limit').onchange=()=>{limit=cardLimit($('card-limit').value);renderWindow();saveSettings();};
window.addEventListener('scroll',()=>scheduleWindow(true,'scroll'),{passive:true});
window.addEventListener('resize',()=>{cardHolds.clear();scheduleWindow(false,'resize');});
$('edit-authored-card').onclick=()=>{const node=parentNode(selected);$('detail').close();blankBoard.edit(node);};
$('delete-authored-card').onclick=async()=>{if(!authored(parentNode(selected)) || !window.confirm('Remove this card from the board?'))return;try{await blankBoard.remove(parentNode(selected));$('detail').close();}catch(error){setTaggingChoiceStatus(error.message || 'Card could not be removed.');}};
function resumeBoardAfterClose(){
  if(boardResumePending)return;boardResumePending=true;
  // Let closing the top-layer dialog paint before deferred masonry work resumes.
  requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(()=>{
    boardResumePending=false;if(boardLayoutBlocked())return;
    const reset=deferredBoardReset,redraw=deferredBoardWindow;deferredBoardReset=deferredBoardWindow=false;
    if(reset)resetBlocks();else if(redraw)renderWindow();
  },0)));
}
function clearDetailMedia(){detailOpenVersion++;detailImageVersion++;$('detail-image').onload=null;$('detail-image').onerror=null;$('detail-image').removeAttribute('src');if(!$('image-source').open)document.documentElement.removeAttribute('data-pin-open');}
function closeDetail(){const end=window.atlasDebug?.performance.begin('preview.close-handler');try{clearDetailMedia();$('detail').close();resumeBoardAfterClose();}finally{end?.();window.atlasDebug?.performance.afterPaint('preview.close');}}
$('close').onclick=closeDetail;
$('detail').addEventListener('cancel',event=>{event.preventDefault();closeDetail();});
$('detail').addEventListener('close',()=>{if(!$('detail').open){clearDetailMedia();resumeBoardAfterClose();}});
$('replace-image').onclick=()=>pickImage(selected);
$('cancel-image').onclick=()=>$('image-source').close();
$('image-source').addEventListener('close',()=>{if(!$('detail').open){document.documentElement.removeAttribute('data-pin-open');resumeBoardAfterClose();}});
$('upload-image').onclick=()=>{$('image-file').value='';$('image-file').click();};
async function ensureImages(parent){
  if(!boardAssetsReady)await boardAssetsPromise;
  const owner=galleryOwner(parent);await imageEntries.load();if(imageEntries.gallery(owner))return;
  const image=imageFor(parent),details=metadata(parent);
  if(image && !authored(parent) && ['loading','unavailable'].includes(metadataState)){await refreshAssociations();if(['loading','unavailable'].includes(metadataState))throw Error('Connect the companion once to preserve existing image annotations.');}
  const current=metadata(parent),notes=current.notes || (current.note?[{id:owner+':legacy-note',title:parent.title || 'Note',text:current.note}]:[]);
  await imageEntries.ensure(owner,{id:parent.id,url:parent.url || '',title:parent.title,kind:parent.kind || 'bookmark',cardId:parent.cardId || null,scope:boardId || 'default',aliases:pinItems(roots).filter(n=>n.url===parent.url).map(n=>n.id)},image,{tags:current.tags || [],notes,bookmarks:current.bookmarks || []});
}
async function materializeImageEntry(node){
  if(node?.entryId)return node;
  const parent=parentNode(node),image=imageFor(node);
  if(!image)throw Error('This image is unavailable. Reopen the card.');
  await ensureImages(parent);
  const gallery=imageEntries.gallery(galleryOwner(parent));
  const entry=gallery?.entries.find(entry=>entry.image===image);
  if(!entry)throw Error('This image changed. Reopen the card before editing it.');
  return entryNode(parent,entry);
}
async function syncDefaultCover(parent){
 const gallery=imageEntries.gallery(galleryOwner(parent));if(!gallery)return;
 if(authored(parent))await blankBoard.load();
 else covers=(await chrome.storage.local.get(COVER_KEY))[COVER_KEY] || {};
}
function paintImageNavigation(node){
 const gallery=imageEntries.gallery(galleryOwner(node)),entries=gallery?.entries || [],index=entries.findIndex(e=>e.id===node.entryId),legacyImage=!gallery && !!imageFor(node);
 $('image-position').textContent=entries.length?(index+1)+' / '+entries.length:legacyImage?'1 / 1':'No images';
 $('previous-image').disabled=$('next-image').disabled=entries.length<2;
 $('default-image').disabled=previewingLinkedImage || !node.entryId || !imageFor(node);
 const chosen=!previewingLinkedImage && (legacyImage || !!node.entryId && gallery.defaultId===node.entryId);$('default-image').setAttribute('aria-pressed',String(chosen));$('default-image').textContent=chosen?'★':'☆';$('default-image').title=chosen?'Default cover':'Use as default cover';
 $('remove-image').disabled=previewingLinkedImage || (!node.entryId && !legacyImage);
}
function navigateImage(direction){const parent=parentNode(selected),gallery=imageEntries.gallery(galleryOwner(selected));if(!gallery?.entries.length)return;const index=gallery.entries.findIndex(e=>e.id===selected.entryId),entry=gallery.entries[(index+direction+gallery.entries.length)%gallery.entries.length];openDetailContent(entryNode(parent,entry));$('detail-scroll').scrollTop=0;}
$('previous-image').onclick=()=>navigateImage(-1);$('next-image').onclick=()=>navigateImage(1);
$('detail').addEventListener('keydown',event=>{if(event.key==='Escape' && !event.defaultPrevented && !$('image-source').open && !document.querySelector('.pin-tag-editor[open]')){event.preventDefault();closeDetail();return;}if(event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target.closest?.('input,textarea,select,[contenteditable],button,a') || $('image-source').open || document.querySelector('.pin-tag-editor[open]'))return;if(event.key==='ArrowLeft' || event.key==='ArrowRight'){event.preventDefault();navigateImage(event.key==='ArrowLeft'?-1:1);}});
$('default-image').onclick=async()=>{const node=selected;if(!node?.entryId)return;$('default-image').disabled=true;try{await imageEntries.setDefault(node.galleryOwner,node.entryId);await syncDefaultCover(parentNode(node));await refreshGeneratedIndex();render();if(itemKey(selected)===itemKey(node))paintImageNavigation(node);}catch(error){setTaggingChoiceStatus(error.message);}finally{if(selected)paintImageNavigation(selected);}};
$('remove-image').onclick=async()=>{let node=selected;if(!node || (!node.entryId && !imageFor(node)) || !window.confirm('Remove this image and its section? Its references, notes, bookmarks and tag history will be saved in Recovery. Original image files are not backed up.'))return;$('remove-image').disabled=true;try{node=await materializeImageEntry(node);const parent=parentNode(node),record=await imageEntries.remove(node.galleryOwner,node.entryId);await syncDefaultCover(parent);await refreshGeneratedIndex();render();if(galleryOwner(selected)===node.galleryOwner){const gallery=imageEntries.gallery(node.galleryOwner),entry=gallery.entries[Math.min(record.position,gallery.entries.length-1)];openDetailContent(entry?entryNode(parent,entry):parent);setTaggingChoiceStatus('Moved to Recovery.');}}catch(error){setTaggingChoiceStatus(error.message || 'Could not save Recovery. Image kept.');}finally{if(selected)paintImageNavigation(selected);}};

async function saveImage(node,image,origin){
  const parent=parentNode(node);await ensureImages(parent);const entry=await imageEntries.add(galleryOwner(parent),image,origin || {provider:'web',url:image,sha256:null,hashStatus:'pending',observedAt:new Date().toISOString()});
  const gallery=imageEntries.gallery(galleryOwner(parent));if(gallery.defaultId===entry.id)await imageEntries.setDefault(galleryOwner(parent),entry.id);await syncDefaultCover(parent);await refreshGeneratedIndex();render();if($('detail').open && galleryOwner(selected)===galleryOwner(parent))openDetailContent(entryNode(parent,entry));
}
$('save-image-url').onclick=async()=>{
  const image=publicImageURL($('cover-url').value.trim()),node=imageTarget || selected;
  if(!image || image.length>8192){$('image-status').textContent='Enter a public HTTP(S) image URL without credentials or signed access tokens.';return;}
  $('save-image-url').disabled=true;
  try{const origin=await urlImageOrigin(image);await saveImage(node,image,origin);$('image-source').close();}catch(error){$('image-status').textContent=(error.message || 'Could not save the image reference.')+' Existing images are unchanged.';}
  finally{$('save-image-url').disabled=false;}
};
$('image-file').onchange=async()=>{
  const file=$('image-file').files?.[0],node=imageTarget || selected;if(!file || !node)return;
  $('upload-image').disabled=$('save-image-url').disabled=true;
  $('image-status').textContent='Preparing image…';
  try{
    const image=await rasterImage(file,175000),origin=await localImageOrigin(file);
    $('image-status').textContent='Saving image…';
    await saveImage(node,image,origin);
    $('image-source').close();
  }catch(error){$('image-status').textContent=(error.message || 'PINBOARD_IMAGE_FAILED')+': Image not added. Existing images are unchanged.';}
  finally{$('upload-image').disabled=$('save-image-url').disabled=false;}
};
const coverFetch=installCoverFetch({
  getScope:()=>JSON.stringify([boardId,$('folder').value,$('search').value.trim(),selectionTags().map(selectionKey),$('tags-only').checked]),
  getNodes:()=>filteredNodes().filter(node=>!!node.url),
  getMounted:()=>[...blocks.values()].flatMap(block=>[...block.children].map(element=>({element,node:element.atlasNode}))),
  hasCover:node=>!boardAssetsReady || !!imageFor(node),raster:rasterImage,
  saveCover:async(node,image)=>{
    await imageEntries.load();const gallery=imageEntries.gallery(galleryOwner(node));if(gallery){if(imageFor(node))return false;const entry=await imageEntries.add(galleryOwner(node),image,{provider:'fetched-preview',pageURL:node.url || null,sha256:null,hashStatus:'unavailable',hashReason:'Original image bytes are not retained by cover fetch'});await imageEntries.setDefault(galleryOwner(node),entry.id);await syncDefaultCover(node);return true;}
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
async function loadBoardTitle(){
  try{
    const key=boardId?PINBOARDS_KEY:'atlas.pinboard.default-title.v1';
    const saved=await chrome.storage.local.get(key);
    const name=boardId?boardRecord(saved[key]?.[boardId]).title:saved[key];
    const title=typeof name==='string' && name.trim()?name:'Your pinboard.';
    $('title').textContent=title;document.title=title+' · Atlas Pinboard';
  }catch{$('title').textContent='Pinboard';document.title='Pinboard · Atlas';}
  finally{$('title').hidden=false;}
}
async function start(){
  await loadBoardTitle();
  try{const saved=(await chrome.storage.local.get(PINBOARD_SETTINGS))[PINBOARD_SETTINGS];limit=cardLimit(saved?.limit);$('card-limit').value=String(limit);$('images-only').checked=saved?.imagesOnly===true;$('tags-only').checked=saved?.tagsOnly===true;}catch{}
  await refresh();


}
chrome.storage.onChanged?.addListener((changes,area)=>{if(area==='local' && changes[IMAGE_ENTRIES]){imageEntries.load().then(async()=>{await refreshGeneratedIndex(true);if(selected && $('detail').open){const projected=selected.entryId?selected:defaultEntryNode(selected);if(!projected.entryId || storedEntry(projected))openDetailContent(projected,{preserveConnections:true});}scheduleWindow();}).catch(()=>status('Image entries could not be refreshed.'));}});
window.atlasDebug?.performance.registerState('pinboard',()=>({
  renderer_revision:6,preview_read_only:true,tag_index_running:!!generatedRefresh,tag_index_queued:generatedRefreshQueued,overscan_rows:1,image_geometry_entries:imageGeometry.size,failed_image_entries:failedImages.size,...viewportWindowState,total_items:items.length,mounted_cards:[...blocks.values()].reduce((count,block)=>count+block.children.length,0),
  nearby_budget:limit,layout_dirty:windowLayoutDirty,window_update_pending:!!frame,layout_blocked:!!boardLayoutBlocked(),
  assets_ready:boardAssetsReady,held_cards:cardHolds.active().length,layout_positions:positions.length
}));
window.atlasDebug?.performance.register('pinboard.scroll-stress',async(options,probe)=>{
  if((document.querySelectorAll?.('dialog[open]') || []).length)throw Error('CLOSE_EXISTING_DIALOGS_FIRST');
  const steps=Math.max(2,Math.min(60,Math.floor(Number(options.steps) || 24))),start=window.scrollY;
  const distance=Math.max(100,Math.min(6000,Number(options.distance) || window.innerHeight*2 || 1500));
  let completed=0,peak=0;
  try{for(let index=0;index<steps && probe.isActive();index++){
    const direction=Math.floor(index/4)%2?-1:1;
    window.scrollBy({top:direction*distance,behavior:'instant'});
    await probe.afterPaint('scenario.scroll');
    peak=Math.max(peak,[...blocks.values()].reduce((count,block)=>count+block.children.length,0));completed++;
  }}finally{window.scrollTo({top:start,behavior:'instant'});}
  return {completed_steps:completed,peak_mounted_cards:peak,synthetic_scroll:true,trusted_input:false};
});
window.atlasDebug?.performance.register('pinboard.preview-cycle',async(options,probe)=>{
  if((document.querySelectorAll?.('dialog[open]') || []).length)throw Error('CLOSE_EXISTING_DIALOGS_FIRST');
  const cycles=Math.max(1,Math.min(10,Math.floor(Number(options.cycles) || 3)));let completed=0;
  for(let index=0;index<cycles && probe.isActive();index++){
    const card=[...blocks.values()].flatMap(block=>[...block.children]).find(card=>{const rect=card.getBoundingClientRect();return rect.bottom>0 && rect.top<window.innerHeight;});
    if(!card)throw Error('NO_VISIBLE_CARD');
    openDetail(card.atlasNode);await probe.afterPaint('scenario.open');
    if(!$('detail').open)break;
    closeDetail();await probe.afterPaint('scenario.close');completed++;
  }
  return {completed_cycles:completed};
});
start();
