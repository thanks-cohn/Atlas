import {readPage, updatePage, withPageLock, publicImageURL, publicationReadiness} from './pages-store.js';
import {rasterImage} from './image-file.js';
const $ = id => document.getElementById(id);
const id = new URL(location.href).searchParams.get('id');
let page = null, editing = false, draftImages = [], viewerIndex = 0, loadingImages = false;
const element = (tag, text = '') => { const el = document.createElement(tag); el.textContent = text; return el; };
function showImage(index) {
  if (!page.images.length) return;
  viewerIndex = (index + page.images.length) % page.images.length;
  const image = page.images[viewerIndex];
  $('viewer-image').referrerPolicy = 'no-referrer'; $('viewer-image').src = image.source; $('viewer-image').alt = image.caption || page.title;
  $('viewer-caption').textContent = image.caption; $('viewer-count').textContent = `${viewerIndex + 1} / ${page.images.length}`;
  $('previous').disabled = $('next').disabled = page.images.length < 2;
}
function render() {
  $('page').hidden = !page || editing; $('editor').hidden = !page || !editing; $('edit').hidden = $('publishing-check').hidden = !page || editing;
  if (!page) return;
  document.title = page.title + ' · Atlas'; $('title').textContent = page.title; $('text').textContent = page.text;
  $('image-count').textContent = `${page.images.length} ${page.images.length === 1 ? 'image' : 'images'}`;
  $('gallery').replaceChildren();
  if (!page.images.length) {
    const empty = element('div'); empty.className = 'gallery-empty'; empty.append(element('h2', 'A place for your collection'), element('p', 'Choose Edit Gallery to add images and tell their story.')); $('gallery').append(empty);
  }
  page.images.forEach((image, index) => {
    const figure = element('figure'), button = element('button'); button.className = 'gallery-image'; button.type = 'button'; button.setAttribute('aria-label', `Expand ${image.caption || 'image ' + (index + 1)}`);
    const img = element('img'); img.referrerPolicy = 'no-referrer'; img.src = image.source; img.alt = image.caption || page.title; img.loading = 'lazy'; img.decoding = 'async';
    img.onerror = () => { img.hidden = true; button.append(element('span', 'Image unavailable · Edit Gallery to replace its source')); }; button.append(img);
    button.onclick = () => { showImage(index); $('viewer').showModal(); };
    figure.append(button); if (image.caption) figure.append(element('figcaption', image.caption)); $('gallery').append(figure);
  });
}
function renderImageEditor() {
  $('image-editor').replaceChildren();
  draftImages.forEach((image, index) => {
    const row = element('div'); row.className = 'image-editor-row';
    const thumbnail = element('img'); thumbnail.referrerPolicy = 'no-referrer'; thumbnail.src = image.source; thumbnail.alt = 'Selected image ' + (index + 1);
    const label = element('label', 'Caption'), caption = element('input'); caption.maxLength = 300; caption.value = image.caption; caption.oninput = () => { image.caption = caption.value; }; label.append(caption);
    const up = element('button', '↑'); up.type = 'button'; up.disabled = loadingImages || index === 0; up.setAttribute('aria-label', 'Move image earlier'); up.onclick = () => { [draftImages[index - 1], draftImages[index]] = [draftImages[index], draftImages[index - 1]]; renderImageEditor(); };
    const remove = element('button', 'Remove'); remove.type = 'button'; remove.disabled = loadingImages; remove.onclick = () => { draftImages.splice(index, 1); renderImageEditor(); };
    row.append(thumbnail, label, up, remove); $('image-editor').append(row);
  });
}
async function load() {
  try { page = await readPage(chrome.storage.local, id); $('status').textContent = page ? 'Saved locally · Private until you choose to publish' : 'PAGE_NOT_FOUND: This page is unavailable in this installation.'; render(); }
  catch { $('status').textContent = 'PAGE_READ_FAILED: This page could not be loaded.'; }
}
$('edit').onclick = () => { editing = true; draftImages = page.images.map(image => ({...image})); $('title-input').value = page.title; $('text-input').value = page.text; render(); renderImageEditor(); $('title-input').focus(); };
$('cancel').onclick = () => { if (!loadingImages) { editing = false; render(); } };
$('images-input').onchange = async () => {
  const files = [...$('images-input').files];
  if (draftImages.length + files.length > 24) { $('status').textContent = 'IMAGE_LIMIT: Use up to 24 images in this gallery.'; $('images-input').value = ''; return; }
  loadingImages = true; $('save').disabled = $('cancel').disabled = $('images-input').disabled = true; renderImageEditor();
  try {
    const additions = [];
    for (const file of files) additions.push({id: crypto.randomUUID(), source: await rasterImage(file), sourceKind: 'local', caption: ''});
    if (JSON.stringify([...draftImages, ...additions]).length > 3900000) throw new Error('IMAGE_BUDGET');
    draftImages.push(...additions); $('status').textContent = 'Images ready. Save to keep your changes.';
  } catch { $('status').textContent = 'IMAGE_ADD_FAILED: Choose smaller PNG, JPEG, WebP or GIF images (up to 10 MB each). No selected batch was added; your previous images remain.'; }
  finally { loadingImages = false; $('save').disabled = $('cancel').disabled = $('images-input').disabled = false; $('images-input').value = ''; renderImageEditor(); }
};
$('add-url').onclick = () => {
  if (loadingImages) return;
  const source = publicImageURL($('image-url').value);
  if (!source || source.length > 8192 || draftImages.length >= 24) { $('status').textContent = 'IMAGE_URL_INVALID: Use a public HTTP(S) image URL without embedded credentials (up to 24 images).'; return; }
  draftImages.push({id: crypto.randomUUID(), source, sourceKind: 'url', caption: ''}); $('image-url').value = ''; renderImageEditor(); $('status').textContent = 'Image URL added. Save to keep your changes.';
};
$('editor').onsubmit = async event => {
  event.preventDefault(); if (loadingImages) return; $('save').disabled = true;
  try {
    page = await withPageLock(() => updatePage(chrome.storage.local, id, {title: $('title-input').value, text: $('text-input').value, images: draftImages}, page.revision));
    editing = false; render(); $('status').textContent = 'Gallery saved locally.';
  } catch (error) { $('status').textContent = error.message === 'PAGE_EDIT_CONFLICT' ? 'PAGE_EDIT_CONFLICT: Another window saved a newer version. Copy your changes, then reload before editing again.' : 'PAGE_SAVE_FAILED: Your changes are still in the editor. Check the title, image sizes and available extension storage.'; }
  finally { $('save').disabled = false; }
};
$('previous').onclick = () => showImage(viewerIndex - 1); $('next').onclick = () => showImage(viewerIndex + 1);
$('close-viewer').onclick = () => $('viewer').close();
$('viewer').addEventListener('keydown', event => { if (['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); event.stopPropagation(); showImage(viewerIndex + (event.key === 'ArrowLeft' ? -1 : 1)); } });
$('viewer').addEventListener('close', () => { $('viewer-image').removeAttribute('src'); });
$('publishing-check').onclick = () => { const plan = publicationReadiness(page); $('publish-status').textContent = `${plan.localImages} local image(s) require transfer; ${plan.referencedImages} image(s) already use hosted URLs.`; $('publish-dialog').showModal(); };
$('close-publish').onclick = () => $('publish-dialog').close();
window.addEventListener('beforeunload', event => { if (editing && (loadingImages || $('title-input').value !== page.title || $('text-input').value !== page.text || JSON.stringify(draftImages) !== JSON.stringify(page.images))) { event.preventDefault(); event.returnValue = ''; } });
load();
