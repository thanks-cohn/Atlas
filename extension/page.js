import {readPage, updatePage, withPageLock, publicImageURL, publicationReadiness} from './pages-store.js';
import {rasterImage, imageType} from './image-file.js';
import {library, saveLibraryPage, readLibraryPage, importOriginal} from './library-client.js';
const $ = id => document.getElementById(id);
const id = new URL(location.href).searchParams.get('id');
let page = null, editing = false, draftImages = [], viewerIndex = 0, loadingImages = false;
const originalFiles = new Map();
const element = (tag, text = '') => { const el = document.createElement(tag); el.textContent = text; return el; };
function showImage(index) {
  if (!page.images.length) return;
  viewerIndex = (index + page.images.length) % page.images.length;
  const image = page.images[viewerIndex];
  $('viewer-image').referrerPolicy = 'no-referrer'; $('viewer-image').src = image.source; $('viewer-image').alt = image.title || image.caption || page.title;
  $('viewer-title').textContent = image.title || ''; $('viewer-title').hidden = !image.title; $('viewer-caption').textContent = image.caption; $('viewer-count').textContent = `${viewerIndex + 1} / ${page.images.length}`;
  $('previous').disabled = $('next').disabled = page.images.length < 2;
}
function render() {
  $('page').hidden = !page || editing; $('editor').hidden = !page || !editing; $('edit').hidden = $('publishing-check').hidden = !page || editing;
  $('backup-library').hidden = !page || editing || Boolean(page.libraryRevision);
  if (!page) return;
  document.title = page.title + ' · Atlas'; $('title').textContent = page.title; $('text').textContent = page.text;
  $('image-count').textContent = `${page.images.length} ${page.images.length === 1 ? 'image' : 'images'}`;
  document.body.className = editing ? 'studio-mode' : (page.galleryStyle || 'atelier');
  renderCollection($('gallery'), page.images, page.galleryStyle || 'atelier');
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
    const img = element('img'); img.referrerPolicy = 'no-referrer'; imageButton.append(img);
    const meta = element('div'); meta.className = 'cinema-meta'; const title = element('h2'), caption = element('p'), count = element('span');
    meta.append(count, title, caption); stage.append(imageButton, meta);
    const controls = element('div'); controls.className = 'cinema-controls';
    const previous = element('button', '←'), next = element('button', '→'); previous.type = next.type = 'button'; previous.setAttribute('aria-label', 'Previous work'); next.setAttribute('aria-label', 'Next work');
    const strip = element('div'); strip.className = 'cinema-strip';
    const update = () => { const image = images[active]; img.src = image.source; img.alt = image.title || image.caption || 'Gallery image'; title.textContent = image.title || ''; caption.textContent = image.caption; count.textContent = String(active+1).padStart(2,'0')+' / '+String(images.length).padStart(2,'0'); strip.replaceChildren(); images.forEach((image, index) => { const thumb = element('button'); thumb.type = 'button'; thumb.setAttribute('aria-label', 'Show work '+(index+1)); thumb.setAttribute('aria-pressed', String(index===active)); const tiny = element('img'); tiny.referrerPolicy = 'no-referrer'; tiny.src = image.source; tiny.alt = ''; thumb.append(tiny); thumb.onclick = () => {active=index;update();}; strip.append(thumb); }); };
    previous.onclick = () => { active=(active-1+images.length)%images.length; update(); }; next.onclick = () => {active=(active+1)%images.length;update();}; previous.disabled = next.disabled = images.length<2;
    imageButton.setAttribute('aria-label', preview ? 'Draft image preview' : 'Expand current work'); imageButton.onclick = () => { if (!preview) { showImage(active); $('viewer').showModal(); } };
    container.tabIndex = 0; container.onkeydown = event => { if (['ArrowLeft','ArrowRight'].includes(event.key)) {event.preventDefault(); event.stopPropagation(); active=(active+(event.key==='ArrowLeft'?-1:1)+images.length)%images.length;update();} };
    controls.append(previous,next); container.append(stage,controls,strip); update(); return;
  }
  images.forEach((image, index) => {
    const figure = element('figure'), button = element('button'); button.className = 'gallery-image'; button.type = 'button'; button.setAttribute('aria-label', `Expand ${image.title || image.caption || 'image ' + (index + 1)}`);
    const img = element('img'); img.referrerPolicy = 'no-referrer'; img.src = image.source; img.alt = image.title || image.caption || page.title; img.loading = 'lazy'; img.decoding = 'async';
    img.onerror = () => { img.hidden = true; button.append(element('span', 'Image unavailable · Edit Gallery to replace its source')); }; button.append(img);
    button.onclick = () => { if (!preview) {showImage(index); $('viewer').showModal();} };
    const figcaption = element('figcaption'); const number = element('span', String(index+1).padStart(2,'0')); number.className = 'work-number'; figcaption.append(number);
    const copy = element('div'); if (image.title) { const heading = element('span', image.title); heading.className = 'image-title'; copy.append(heading); } if (image.caption) { const description = element('span', image.caption); description.className = 'image-caption'; copy.append(description); } figcaption.append(copy); figure.append(button,figcaption); container.append(figure);
  });
}
function renderPreview() {
  $('preview-title').textContent = $('title-input').value;
  $('preview-text').textContent = $('text-input').value;
  $('preview').className = $('style-input').value;
  renderCollection($('preview-gallery'), draftImages, $('style-input').value, true);
  const descriptions = {atelier:'Quiet space, whole images, and elegant exhibition labels.',fieldnotes:'A visual essay with a generous opening work and an editorial sequence.',nocturne:'A focused screening room with a single work, a filmstrip, and arrow navigation.'};
  $('style-description').textContent = descriptions[$('style-input').value];
}

function renderImageEditor() {
  $('image-editor').replaceChildren();
  draftImages.forEach((image, index) => {
    const row = element('div'); row.className = 'image-editor-row';
    const thumbnail = element('img'); thumbnail.referrerPolicy = 'no-referrer'; thumbnail.src = image.source; thumbnail.alt = 'Selected image ' + (index + 1);
    const fields = element('div'); fields.className = 'image-editor-fields'; const titleLabel = element('label', 'Image title (optional)'), titleInput = element('input'); titleInput.maxLength = 200; titleInput.disabled = loadingImages; titleInput.value = image.title || ''; titleInput.oninput = () => { image.title = titleInput.value; }; titleLabel.append(titleInput); const label = element('label', 'Caption (optional)'), caption = element('input'); caption.maxLength = 300; caption.disabled = loadingImages; caption.value = image.caption; caption.oninput = () => { image.caption = caption.value; }; label.append(caption); fields.append(titleLabel, label);
    const up = element('button', '↑'); up.type = 'button'; up.disabled = loadingImages || index === 0; up.setAttribute('aria-label', 'Move image earlier'); up.onclick = () => { [draftImages[index - 1], draftImages[index]] = [draftImages[index], draftImages[index - 1]]; renderImageEditor(); };
    const remove = element('button', 'Remove from page'); remove.type = 'button'; remove.disabled = loadingImages; remove.onclick = () => { draftImages.splice(index, 1); renderImageEditor(); };
    const down = element('button', '↓'); down.type = 'button'; down.disabled = loadingImages || index === draftImages.length - 1; down.setAttribute('aria-label', 'Move image later'); down.onclick = () => { [draftImages[index], draftImages[index + 1]] = [draftImages[index + 1], draftImages[index]]; renderImageEditor(); };
    const actions = element('div'); actions.className = 'image-row-actions'; actions.append(up, down, remove); row.append(thumbnail, fields, actions); $('image-editor').append(row);
  });
  renderPreview();
}
async function load() {
  try {
    page = await readPage(chrome.storage.local, id);
    try { const disk = await readLibraryPage(id); if (!page || (disk.libraryRevision || 0) > (page.libraryRevision || 0)) { page = disk; await chrome.storage.local.set({['atlas.page.v1.'+id]: page}); } } catch { /* Existing browser copy remains accessible; never label it disk-backed. */ }
    $('library-location').textContent = page?.libraryRevision ? 'Atlas Library copy: ' + (page.libraryLocation || 'companion storage') : 'This page is currently saved only in Chrome. Save it to Atlas Library to protect it from extension removal.';
    $('backup-library').hidden = !page || Boolean(page.libraryRevision); $('status').textContent = page ? '' : 'PAGE_NOT_FOUND: This page is unavailable in this installation.'; render(); }
  catch { $('status').textContent = 'PAGE_READ_FAILED: This page could not be loaded.'; }
}
$('edit').onclick = () => { editing = true; draftImages = page.images.map(image => ({...image})); originalFiles.clear(); $('title-input').value = page.title; $('text-input').value = page.text; $('style-input').value = page.galleryStyle || 'atelier'; $('preview').hidden = true; $('image-editor').hidden = false; $('sequence-tab').setAttribute('aria-pressed','true'); $('preview-tab').setAttribute('aria-pressed','false'); render(); renderImageEditor(); $('title-input').focus(); };
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
    const additions = [];
    for (const file of files) { const image = {id: crypto.randomUUID(), source: await rasterImage(file), sourceKind: 'local', title: '', caption: ''}; additions.push(image); originalFiles.set(image.id,file); }
    if (JSON.stringify([...draftImages, ...additions]).length > 3900000) throw Object.assign(new Error('This gallery preview cache is full. Add fewer images or use smaller previews.'),{code:'GALLERY_PREVIEW_BUDGET'});
    draftImages.push(...additions); $('import-status').textContent = `${files.length} image(s) added to this draft: ${files.map(file=>file.name || 'Selected image').join(', ')}. Save to Atlas Library to keep originals outside Chrome.`; $('status').textContent = 'Images are staged, not yet saved to disk.';
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
$('previous').onclick = () => showImage(viewerIndex - 1); $('next').onclick = () => showImage(viewerIndex + 1);
$('close-viewer').onclick = () => $('viewer').close();
$('viewer').addEventListener('keydown', event => { if (['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); event.stopPropagation(); showImage(viewerIndex + (event.key === 'ArrowLeft' ? -1 : 1)); } });
$('viewer').addEventListener('close', () => { $('viewer-image').removeAttribute('src'); });
$('publishing-check').onclick = () => { const plan = publicationReadiness(page); $('publish-status').textContent = `${plan.localImages} local image(s) require transfer; ${plan.referencedImages} image(s) already use hosted URLs.`; $('publish-dialog').showModal(); };
$('close-publish').onclick = () => $('publish-dialog').close();
window.addEventListener('beforeunload', event => { if (editing && (loadingImages || $('title-input').value !== page.title || $('text-input').value !== page.text || JSON.stringify(draftImages) !== JSON.stringify(page.images) || $('style-input').value !== (page.galleryStyle || 'atelier'))) { event.preventDefault(); event.returnValue = ''; } });
$('backup-library').onclick = async () => {
  $('backup-library').disabled = true;
  try { const result = await saveLibraryPage(page); page = {...page,libraryRevision:result.libraryRevision,libraryLocation:result.location}; await chrome.storage.local.set({['atlas.page.v1.'+id]:page}); $('library-location').textContent='Saved outside Chrome: '+result.location; $('backup-library').hidden=true; $('status').textContent='Existing page backed up. Older local images contain resized previews only; reselect originals if required.'; }
  catch(error) { $('status').textContent = `${error.code || 'LIBRARY_SAVE_FAILED'}: ${error.message}`; }
  finally { $('backup-library').disabled=false; }
};
load();
