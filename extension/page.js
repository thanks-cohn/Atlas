import {DEMO_COLLECTION} from './gallery-demo.js';
import {readPage, validatePage, updatePage, withPageLock, publicImageURL, publicationReadiness, displayGalleryStyle} from './pages-store.js';
import {rasterImage, imageType} from './image-file.js';
import {library, saveLibraryPage, readLibraryPage, importOriginal} from './library-client.js';
const $ = id => document.getElementById(id);
const requestedId = new URL(location.href).searchParams.get('id');
const id = requestedId || '00000000-0000-4000-8000-000000000024';
let page = null, editing = false, draftImages = [], viewerIndex = 0, loadingImages = false;
const originalFiles = new Map();
const element = (tag, text = '') => { const el = document.createElement(tag); el.textContent = text; return el; };
let galleryScrollY = 0;
let openingMotion = [];
let openingGeneration = 0;
function cancelOpeningMotion() {
  openingGeneration++;
  for (const animation of openingMotion) animation.cancel();
  openingMotion = [];
  $('viewer').removeAttribute('data-opening');
}
function openStory(index, sourceImage) {
  const origin = sourceImage?.getBoundingClientRect?.();
  galleryScrollY = window.scrollY || 0;
  document.documentElement.setAttribute('data-reader-open','');
  showImage(index);
  const viewer = $('viewer'), hero = $('viewer-image');
  if (sourceImage?.naturalWidth && sourceImage?.naturalHeight) {
    hero.width = sourceImage.naturalWidth; hero.height = sourceImage.naturalHeight;
  }
  const nocturne = document.body.classList?.contains('nocturne');
  const solstice = document.body.classList?.contains('solstice');
  const enabled = hero.animate && (nocturne || (solstice && origin?.width && origin?.height)) && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (enabled) viewer.setAttribute('data-opening','waiting');
  viewer.showModal();
  if (!enabled) return;
  const generation = openingGeneration;
  const current = () => generation === openingGeneration && viewer.open && viewerIndex === index;
  const finish = () => { if (current()) viewer.removeAttribute('data-opening'); };
  const reveal = async () => {
    if (!current()) return;
    viewer.setAttribute('data-opening','image');
    let imageAnimation;
    if (nocturne) {
      imageAnimation = hero.animate([{opacity:0},{opacity:1}],{duration:520,easing:'cubic-bezier(.25,.1,.25,1)'});
    } else {
      const target = hero.getBoundingClientRect();
      const fit = (rect, image) => {
        const ratio = image.naturalWidth / image.naturalHeight;
        return {width:Math.min(rect.width,rect.height*ratio),x:rect.left+rect.width/2,y:rect.top+rect.height/2};
      };
      const from = fit(origin, sourceImage), to = fit(target, hero);
      if (!Number.isFinite(from.width/to.width) || !to.width) { finish(); return; }
      imageAnimation = hero.animate([
        {transform:`translate(${from.x-to.x}px,${from.y-to.y}px) scale(${from.width/to.width})`,transformOrigin:'50% 50%'},
        {transform:'translate(0,0) scale(1)',transformOrigin:'50% 50%'}
      ],{duration:440,easing:'cubic-bezier(.22,1,.36,1)'});
      openingMotion.push(viewer.animate([{backgroundColor:'#f4f3ef'},{backgroundColor:'#eeefed'}],{duration:440,easing:'ease-out'}));
    }
    openingMotion.push(imageAnimation);
    try {
      await imageAnimation.finished;
      if (!current()) return;
      viewer.setAttribute('data-opening','text');
      const heading = $('viewer-reading').querySelector('.reader-heading');
      const fades = [heading,$('viewer-article')].map(element => element.animate([{opacity:0},{opacity:1}],{duration:nocturne ? 380 : 220,easing:'ease-out'}));
      openingMotion.push(...fades);
      await Promise.all(fades.map(animation=>animation.finished));
      finish();
    } catch { finish(); } // Cancellation never leaves invisible content behind.
  };
  if (hero.complete && hero.naturalWidth) reveal();
  else {
    hero.addEventListener('load',reveal,{once:true});
    hero.addEventListener('error',finish,{once:true});
  }
}
function showImage(index) {
  cancelOpeningMotion();
  if (!page.images.length) return;
  viewerIndex = (index + page.images.length) % page.images.length;
  const image = page.images[viewerIndex];
  $('viewer-image').removeAttribute('width'); $('viewer-image').removeAttribute('height');
  $('viewer-image').referrerPolicy = 'no-referrer'; $('viewer-image').src = image.source; $('viewer-image').alt = image.title || image.caption || page.title;
  $('viewer-title').textContent = image.title || ''; $('viewer-title').hidden = !image.title; $('viewer-caption').textContent = image.caption; $('viewer-count').textContent = `${viewerIndex + 1} / ${page.images.length}`;
  renderArticle($('viewer-article'), image.article); $('viewer-caption').hidden = !image.caption; $('viewer').scrollTop = 0;
  $('reader-collection').textContent = page.title;
  const words = (image.article || image.caption || '').trim().split(/\s+/).filter(Boolean).length;
  $('reader-meta').textContent = 'STORY '+String(viewerIndex+1).padStart(2,'0')+' / '+String(page.images.length).padStart(2,'0')+(words ? '  ·  '+Math.max(1,Math.ceil(words/220))+' MIN READ' : '');
  $('story-previous').disabled = $('story-next').disabled = page.images.length < 2;
  $('previous').disabled = $('next').disabled = page.images.length < 2;
}
function displayCollectionTitle() {
  if (!/^title$/i.test(page.title.trim())) return page.title;
  return page.images.length && page.images.every(image => DEMO_COLLECTION.images.some(sample => sample.source === image.source)) ? DEMO_COLLECTION.title : 'Collected Stories';
}
function render() {
  $('page').hidden = !page || editing; $('editor').hidden = !page || !editing; $('edit').hidden = $('publishing-check').hidden = !page || editing;
  $('backup-library').hidden = !page || editing || Boolean(page.libraryRevision);
  $('presentation-preview').hidden = !page || editing;
  if (!page) return;
  const collectionTitle = displayCollectionTitle(); document.title = collectionTitle + ' · Atlas'; $('title').textContent = collectionTitle; $('collection-label').textContent = 'CURATED IN ATLAS'; renderDescription($('text'), page.text);
  $('image-count').textContent = `${page.images.length} ${page.images.length === 1 ? 'Story' : 'Stories'}`;
  document.body.className = editing ? 'studio-mode' : displayGalleryStyle(page.galleryStyle);
  renderCollection($('gallery'), page.images, displayGalleryStyle(page.galleryStyle));
}
function renderCollection(container, images, style, preview = false) {
  container.replaceChildren(); container.onkeydown = null; container.removeAttribute('tabindex'); container.className = 'collection-layout ' + style;
  if (!images.length) {
    const empty = element('div'); empty.className = 'gallery-empty'; empty.append(element('h2', 'A place for your collection'), element('p', 'Choose Edit Gallery to add images and tell their story.')); container.append(empty); return;
  }
  if (style === 'nocturne') {
    let active = 0;
    const stage = element('div'); stage.className = 'nocturne-stage';
    const imageButton = element('button'); imageButton.type = 'button'; imageButton.className = 'cinema-image';
    const img = element('img'); img.referrerPolicy = 'no-referrer'; const expandLabel = element('span', 'EXPAND ↗'); expandLabel.className = 'expand-label'; imageButton.append(img,expandLabel);
    stage.append(imageButton);
    const controls = element('div'); controls.className = 'cinema-controls';
    const previous = element('button', '←'), next = element('button', '→'); previous.type = next.type = 'button'; previous.setAttribute('aria-label', 'Previous work'); next.setAttribute('aria-label', 'Next work');
    const strip = element('div'); strip.className = 'cinema-strip';
    const update = () => { const image = images[active]; if (!preview) { const storyTitle = image.title?.trim() || page.title; $('title').textContent = storyTitle; $('collection-label').textContent = displayCollectionTitle(); document.title = storyTitle + ' · Atlas'; } img.src = image.source; img.alt = image.title || image.caption || 'Gallery image'; strip.replaceChildren(); images.forEach((image, index) => { const thumb = element('button'); thumb.type = 'button'; thumb.setAttribute('aria-label', 'Show '+(image.title || 'work '+(index+1))); thumb.setAttribute('aria-pressed', String(index===active)); const tiny = element('img'); tiny.referrerPolicy = 'no-referrer'; tiny.src = image.source; tiny.alt = ''; thumb.append(tiny); thumb.onclick = () => {active=index;update();}; strip.append(thumb); }); };
    previous.onclick = () => { active=(active-1+images.length)%images.length; update(); }; next.onclick = () => {active=(active+1)%images.length;update();}; previous.disabled = next.disabled = images.length<2;
    imageButton.setAttribute('aria-label', preview ? 'Draft image preview' : 'Expand current work'); imageButton.onclick = () => { if (!preview) { openStory(active, img); } };
    container.tabIndex = 0; container.onkeydown = event => { if (['ArrowLeft','ArrowRight'].includes(event.key)) {event.preventDefault(); event.stopPropagation(); active=(active+(event.key==='ArrowLeft'?-1:1)+images.length)%images.length;update();} };
    const sequenceLabel = element('span', 'THE COLLECTION'); sequenceLabel.className = 'sequence-label'; controls.append(previous,next,sequenceLabel); container.append(stage,controls,strip); update(); return;
  }
  images.forEach((image, index) => {
    const figure = element('figure'), button = element('button'); button.className = 'gallery-image'; button.type = 'button'; button.setAttribute('aria-label', `Expand ${image.title || image.caption || 'image ' + (index + 1)}`);
    const img = element('img'); img.referrerPolicy = 'no-referrer'; img.src = image.source; img.alt = image.title || image.caption || page.title; img.loading = 'lazy'; img.decoding = 'async';
    img.onerror = () => { img.hidden = true; button.append(element('span', 'Image unavailable · Edit Gallery to replace its source')); }; button.append(img);
    button.onclick = () => { if (!preview) {openStory(index, img);} };
    const figcaption = element('figcaption'); const number = element('span', String(index+1).padStart(2,'0')); number.className = 'work-number'; figcaption.append(number);
    const copy = element('div'); if (image.title) { const heading = element('span', image.title); heading.className = 'image-title'; copy.append(heading); } if (image.caption || image.article) { const description = element('span', image.article ? firstSentence(image.article) : image.caption); description.className = 'image-caption'; copy.append(description); } figcaption.append(copy); figure.append(button,figcaption); container.append(figure);
  });
}
function firstSentence(text) { return text.trim().match(/^[\s\S]*?[.!?](?=\s|$)/)?.[0] || text.split('\n')[0]; }
function renderArticle(container, text) {
  container.replaceChildren(); container.hidden = !text;
  if (!text) return;
  for (const paragraph of text.split(/\n\s*\n/).filter(part=>part.trim())) container.append(element('p',paragraph.trim()));
}
function renderDescription(container, text) {
  container.replaceChildren();
  for (const paragraph of text.split(/\n\s*\n/).filter(part=>part.trim())) container.append(element('p',paragraph.trim()));
}
function renderPreview() {
  $('preview-title').textContent = $('title-input').value;
  renderDescription($('preview-text'), $('text-input').value);
  $('preview').className = $('style-input').value;
  renderCollection($('preview-gallery'), draftImages, $('style-input').value, true);
  const descriptions = {solstice:'A bright contact sheet: clean architectural frames, bold typography, and the whole collection in view.',nocturne:'A focused screening room with a single work, a filmstrip, and arrow navigation.'};
  $('style-description').textContent = descriptions[$('style-input').value];
}

function renderImageEditor() {
  $('image-editor').replaceChildren();
  draftImages.forEach((image, index) => {
    const row = element('div'); row.className = 'image-editor-row';
    const thumbnail = element('img'); thumbnail.referrerPolicy = 'no-referrer'; thumbnail.src = image.source; thumbnail.alt = 'Selected image ' + (index + 1);
    const fields = element('div'); fields.className = 'image-editor-fields'; const titleLabel = element('label', 'Image title (optional)'), titleInput = element('input'); titleInput.maxLength = 200; titleInput.disabled = loadingImages; titleInput.value = image.title || ''; titleInput.oninput = () => { image.title = titleInput.value; }; titleLabel.append(titleInput); const label = element('label', 'Caption (optional)'), caption = element('input'); caption.maxLength = 300; caption.disabled = loadingImages; caption.value = image.caption; caption.oninput = () => { image.caption = caption.value; }; label.append(caption); const articleLabel = element('label', 'Article (optional)'), article = element('textarea'); article.maxLength = 20000; article.rows = 6; article.disabled = loadingImages; article.value = image.article || ''; article.oninput = () => {image.article=article.value;}; articleLabel.append(article); fields.append(titleLabel, label, articleLabel);
    const up = element('button', '↑'); up.type = 'button'; up.disabled = loadingImages || index === 0; up.setAttribute('aria-label', 'Move image earlier'); up.onclick = () => { [draftImages[index - 1], draftImages[index]] = [draftImages[index], draftImages[index - 1]]; renderImageEditor(); };
    const remove = element('button', 'Remove from page'); remove.type = 'button'; remove.disabled = loadingImages; remove.onclick = () => { draftImages.splice(index, 1); renderImageEditor(); };
    const down = element('button', '↓'); down.type = 'button'; down.disabled = loadingImages || index === draftImages.length - 1; down.setAttribute('aria-label', 'Move image later'); down.onclick = () => { [draftImages[index], draftImages[index + 1]] = [draftImages[index + 1], draftImages[index]]; renderImageEditor(); };
    const actions = element('div'); actions.className = 'image-row-actions'; actions.append(up, down, remove); row.append(thumbnail, fields, actions); $('image-editor').append(row);
  });
  renderPreview();
}
async function load() {
  try {
    if (!requestedId) await withPageLock(async () => {
      if (await readPage(chrome.storage.local, id)) return;
      const showcase = validatePage({version:1,id,kind:'page',template:'gallery',galleryStyle:'nocturne',title:DEMO_COLLECTION.title,text:DEMO_COLLECTION.text,revision:1,images:DEMO_COLLECTION.images.map((image,index)=>({...image,id:'showcase-'+index}))});
      await chrome.storage.local.set({['atlas.page.v1.'+id]:showcase});
    });
    page = await readPage(chrome.storage.local, id);
    try { const disk = await readLibraryPage(id); if (!page || (disk.libraryRevision || 0) > (page.libraryRevision || 0)) { page = disk; await chrome.storage.local.set({['atlas.page.v1.'+id]: page}); } } catch { /* Existing browser copy remains accessible; never label it disk-backed. */ }
    if (page?.deleted) page = null;
    $('library-location').textContent = page?.libraryRevision ? 'Atlas Library copy: ' + (page.libraryLocation || 'companion storage') : 'This page is currently saved only in Chrome. Save it to Atlas Library to protect it from extension removal.';
    $('backup-library').hidden = !page || Boolean(page.libraryRevision); $('status').textContent = page ? '' : 'PAGE_NOT_FOUND: This page is unavailable in this installation.'; render(); }
  catch { $('status').textContent = 'PAGE_READ_FAILED: This page could not be loaded.'; }
}
$('edit').onclick = () => { editing = true; draftImages = page.images.map(image => ({...image})); originalFiles.clear(); $('title-input').value = page.title; $('text-input').value = page.text; $('style-input').value = displayGalleryStyle(page.galleryStyle); $('preview').hidden = true; $('image-editor').hidden = false; $('sequence-tab').setAttribute('aria-pressed','true'); $('preview-tab').setAttribute('aria-pressed','false'); render(); renderImageEditor(); $('title-input').focus(); };
$('load-demo').onclick = () => {
  if (loadingImages || !editing) return;
  if (draftImages.length && !window.confirm('Replace this editor draft with the 24-image sample collection? Your saved gallery and library originals stay unchanged until you explicitly save.')) return;
  draftImages = DEMO_COLLECTION.images.map(image => ({...image, id: crypto.randomUUID()}));
  originalFiles.clear();
  $('preview').hidden = false; $('image-editor').hidden = true;
  $('preview-tab').setAttribute('aria-pressed','true'); $('sequence-tab').setAttribute('aria-pressed','false');
  renderImageEditor();
  $('import-status').textContent = '24 URL images loaded into this draft. Switch gallery style to compare Nocturne and Solstice.';
  $('status').textContent = 'Sample draft only. Cancel keeps your saved gallery; Save explicitly replaces its content.';
};
$('style-input').onchange = renderPreview;
$('title-input').oninput = $('text-input').oninput = renderPreview;
$('preview-tab').onclick = () => {renderPreview(); $('preview').hidden = false; $('image-editor').hidden = true; $('preview-tab').setAttribute('aria-pressed','true'); $('sequence-tab').setAttribute('aria-pressed','false');};
$('sequence-tab').onclick = () => {$('preview').hidden = true; $('image-editor').hidden = false; $('preview-tab').setAttribute('aria-pressed','false'); $('sequence-tab').setAttribute('aria-pressed','true');};
$('editor').addEventListener('input', renderPreview);
$('cancel').onclick = () => { if (!loadingImages) { editing = false; render(); } };
$('choose-images').onclick = () => $('images-input').click();
$('images-input').onchange = async () => {
  const files = [...$('images-input').files];
  if (!files.length) return;
  $('import-status').textContent = `Preparing ${files.length} image(s)…`;
  if (draftImages.length + files.length > 24) { $('status').textContent = 'IMAGE_LIMIT: Use up to 24 images in this gallery.'; $('images-input').value = ''; return; }
  loadingImages = true; $('save').disabled = $('cancel').disabled = $('images-input').disabled = $('choose-images').disabled = true; renderImageEditor();
  try {
    // Share the preview budget across the complete collection, not each image.
    // Keep originals separate; changing a preview never replaces original bytes.
    const count = draftImages.filter(image => image.sourceKind === 'local').length + files.length;
    const maxChars = Math.min(700000, Math.floor(3500000 / count));
    const prepared = [];
    for (const existing of draftImages) {
      const image = {...existing};
      if (image.sourceKind === 'local' && image.source.length > maxChars) {
        const encoded = image.source.split(',')[1], binary = atob(encoded);
        const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
        image.source = await rasterImage(new Blob([bytes]), maxChars);
      }
      prepared.push(image);
    }
    const additions = [];
    for (const file of files) { const image = {id: crypto.randomUUID(), source: await rasterImage(file, maxChars), sourceKind: 'local', title: '', caption: ''}; additions.push(image); originalFiles.set(image.id,file); }
    if (JSON.stringify([...prepared, ...additions]).length > 3900000) throw Object.assign(new Error('These previews could not fit in the gallery. Your selected originals have not been changed.'),{code:'GALLERY_PREVIEW_BUDGET'});
    draftImages = [...prepared, ...additions]; $('import-status').textContent = `${files.length} image(s) added to this draft: ${files.map(file=>file.name || 'Selected image').join(', ')}. Save to Atlas Library to keep originals outside Chrome.`; $('status').textContent = 'Images are staged, not yet saved to disk.';
  } catch (error) { const message = `${error.code || error.message || 'IMAGE_ADD_FAILED'}: ${error.code ? error.message : 'The selected batch could not be prepared.'} Your previous images remain.`; $('status').textContent = message; $('import-status').textContent = message; }
  finally { loadingImages = false; $('save').disabled = $('cancel').disabled = $('images-input').disabled = $('choose-images').disabled = false; $('images-input').value = ''; renderImageEditor(); }
};
$('add-url').onclick = () => {
  if (loadingImages) return;
  const source = publicImageURL($('image-url').value);
  if (!source || source.length > 8192 || draftImages.length >= 24) { $('status').textContent = 'IMAGE_URL_INVALID: Use a public HTTP(S) image URL without embedded credentials (up to 24 images).'; return; }
  draftImages.push({id: crypto.randomUUID(), source, sourceKind: 'url', title: '', caption: ''}); $('image-url').value = ''; renderImageEditor(); $('status').textContent = 'Image URL added. Save to keep your changes.';
};
$('editor').onsubmit = async event => {
  event.preventDefault(); if (loadingImages) return; loadingImages = true; $('save').disabled = $('cancel').disabled = $('images-input').disabled = $('choose-images').disabled = true; renderImageEditor(); $('status').textContent = 'Saving originals and gallery to Atlas Library…';
  try {
    for (const image of draftImages) { const file = originalFiles.get(image.id); if (file && !image.originalAssetId) image.originalAssetId = (await importOriginal(file, await imageType(file))).id; }
    page = await withPageLock(() => updatePage(chrome.storage.local, id, {title: $('title-input').value, text: $('text-input').value, images: draftImages, galleryStyle: $('style-input').value}, page.revision, saveLibraryPage));
    editing = false; originalFiles.clear(); render(); $('status').textContent = 'Gallery and imported originals saved in Atlas Library.'; $('library-location').textContent = 'Saved outside Chrome: ' + page.libraryLocation; $('backup-library').hidden = true;
  } catch (error) { $('status').textContent = error.message === 'PAGE_EDIT_CONFLICT' ? 'PAGE_EDIT_CONFLICT: Another window saved a newer version. Copy your changes, then reload before editing again.' : `${error.code || 'PAGE_SAVE_FAILED'}: ${error.code ? error.message : 'Your changes remain in the editor. Connect the updated companion and check available storage.'}`; }
  finally { loadingImages = false; $('save').disabled = $('cancel').disabled = $('images-input').disabled = $('choose-images').disabled = false; if (editing) renderImageEditor(); }
};
$('previous').onclick = $('story-previous').onclick = () => showImage(viewerIndex - 1); $('next').onclick = $('story-next').onclick = () => showImage(viewerIndex + 1);
$('close-viewer').onclick = () => $('viewer').close();
$('viewer').addEventListener('keydown', event => {
  if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(event.key)) {
    event.preventDefault(); event.stopPropagation(); const reader=$('viewer');
    if(event.key==='Home'||event.key==='End') reader.scrollTo({top:event.key==='Home'?0:reader.scrollHeight,behavior:'auto'});
    else reader.scrollBy({top:(['ArrowUp','PageUp'].includes(event.key)?-1:1)*(event.key.startsWith('Page')?reader.clientHeight*.85:55),behavior:'auto'});
    return;
  }
  if (['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); event.stopPropagation(); showImage(viewerIndex + (event.key === 'ArrowLeft' ? -1 : 1)); } });
$('viewer').addEventListener('close', () => { cancelOpeningMotion(); $('viewer-image').removeAttribute('src'); document.documentElement.removeAttribute('data-reader-open'); window.scrollTo({top:galleryScrollY,behavior:'instant'}); });
$('publishing-check').onclick = () => { const plan = publicationReadiness(page); $('publish-status').textContent = `${plan.localImages} local image(s) require transfer; ${plan.referencedImages} image(s) already use hosted URLs.`; $('publish-dialog').showModal(); };
$('close-publish').onclick = () => $('publish-dialog').close();
window.addEventListener('beforeunload', event => { if (editing && (loadingImages || $('title-input').value !== page.title || $('text-input').value !== page.text || JSON.stringify(draftImages) !== JSON.stringify(page.images) || $('style-input').value !== displayGalleryStyle(page.galleryStyle))) { event.preventDefault(); event.returnValue = ''; } });
$('backup-library').onclick = async () => {
  $('backup-library').disabled = true;
  try { const result = await saveLibraryPage(page); page = {...page,libraryRevision:result.libraryRevision,libraryLocation:result.location}; await chrome.storage.local.set({['atlas.page.v1.'+id]:page}); $('library-location').textContent='Saved outside Chrome: '+result.location; $('backup-library').hidden=true; $('status').textContent='Existing page backed up. Older local images contain resized previews only; reselect originals if required.'; }
  catch(error) { $('status').textContent = `${error.code || 'LIBRARY_SAVE_FAILED'}: ${error.message}`; }
  finally { $('backup-library').disabled=false; }
};
load();

// Presentation preview is local UI state; it neither saves nor publishes.
$('presentation-preview').onclick = () => {
  if (!page || editing) return;
  document.documentElement.setAttribute('data-presentation-preview','');
  $('gallery').focus();
};
window.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || $('viewer').open || $('publish-dialog').open) return;
  if (!document.documentElement.hasAttribute('data-presentation-preview')) return;
  document.documentElement.removeAttribute('data-presentation-preview');
  $('presentation-preview').focus();
  event.preventDefault();
});
