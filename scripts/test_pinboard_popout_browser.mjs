// Actual Chromium DOM/input; isolated storage/content adapters, not installed MV3/native proof.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve, extname } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const { chromium } = process.env.ATLAS_PLAYWRIGHT_MODULE
  ? await import(process.env.ATLAS_PLAYWRIGHT_MODULE)
  : createRequire(import.meta.url)("playwright");
const root = resolve(fileURLToPath(new URL("../extension", import.meta.url)));
const html = `<!doctype html><link rel="stylesheet" href="/pinboard.css"><style>body{padding:24px}#preview-notes-panel,#preview-bookmarks-panel,#preview-images-panel{max-width:620px}</style><button id="preview-notes">Notes<span></span></button><button id="preview-bookmarks">Bookmarks<span></span></button><button id="preview-images">Images<span></span></button><div id="preview-images-panel"></div><div id="preview-notes-panel"></div><div id="preview-bookmarks-panel"></div><button id="switch">Switch Card</button><button id="tags">Tags</button><script type="module">
import {createCardSections} from '/card-sections.js';import {createCardSectionControls} from '/card-section-controls.js';import {installPreviewSections} from '/pinboard-preview-sections.js';import {installTagEditor} from '/pinboard-tag-editor.js';
const data=JSON.parse(localStorage.fixture || '{}');window.data=data;window.chrome={storage:{local:{async get(keys){return structuredClone(Object.fromEntries((Array.isArray(keys)?keys:[keys]).map(k=>[k,data[k]])));},async set(values){Object.assign(data,structuredClone(values));localStorage.fixture=JSON.stringify(data);}}}};
let card='A';const content=data.content || (data.content={A:{notes:[{id:'a',title:'A note',text:'Original A'}],bookmarks:[{id:'a-link',title:'A link',url:'https://a.example/'}]},B:{notes:[{id:'b',title:'B note',text:'Original B'}],bookmarks:[{id:'b-link',title:'B link',url:'https://b.example/'}]}});
const store=createCardSections(),organization=createCardSectionControls({store,getOwner:()=>card});window.store=store;
const view=installPreviewSections({organization,getBookmarks:()=>[{id:'other',title:'Another link',url:'https://other.example/'}],save:async(key,action,value)=>{const field=action==='note'?'notes':'bookmarks';const list=content[key][field],index=list.findIndex(i=>i.id===value.id);if(index<0)list.push(value);else list[index]=value;localStorage.fixture=JSON.stringify(data);show();}});
function show(){view.setContent(card,{...content[card],imagesContext:card,images:[{id:'portrait',title:'Portrait',image:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="200"><rect width="100" height="200" fill="gold"/></svg>')},{id:'landscape',title:'Landscape',image:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="teal"/></svg>')}]});}show();document.querySelector('#switch').onclick=()=>{card=card==='A'?'B':'A';show();};
const openTags=installTagEditor({onChanged:async()=>{},suggestions:()=>['Architecture','Travel','ＡＲＣＨＩＴＥＣＴＵＲＥ'],localAdapter:()=>({read:async()=>({tags:data.tags || [],data:null}),mutate:async(action,tag)=>{data.tags=action==='tag'?[...new Set([...(data.tags || []),tag])]:(data.tags || []).filter(t=>t!==tag);return {tags:data.tags,data:null};}})});document.querySelector('#tags').onclick=()=>openTags({title:'Fixture'});
</script>`;
const server = createServer((req, res) => {
  try {
    const path = new URL(req.url, "http://localhost").pathname;
    if (path === "/") {
      res.setHeader("Content-Type", "text/html");
      return res.end(html);
    }
    const file = resolve(root, "." + path);
    if (!file.startsWith(root + "/")) throw Error();
    res.setHeader(
      "Content-Type",
      extname(file) === ".css" ? "text/css" : "text/javascript",
    );
    res.end(readFileSync(file));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
let browser;
try {
  const index = process.argv.indexOf("--chromium");
  browser = await chromium.launch({
    headless: true,
    ...(index >= 0 ? { executablePath: process.argv[index + 1] } : {}),
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
      viewport: { width: 1100, height: 850 },
    }),
    errors = [];
  page.setDefaultTimeout(10000);
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:" + server.address().port);
  await page.locator("#preview-notes").click();
  const panel = page.locator("#preview-notes-panel");
  async function create(name, area = panel) {
    await area.getByRole("button", { name: "+ Section", exact: true }).click();
    await page
      .getByRole("button", { name: "Create New Section", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Section name", exact: true })
      .fill(name);
    await page
      .locator(".pin-section-editor")
      .getByRole("button", { name: "Add Section", exact: true })
      .click();
    await page.waitForSelector(".pin-section-editor", { state: "detached" });
  }
  await create("Zoology");
  await create("Architecture");
  await create("Art");
  assert.deepEqual(await panel.locator('.preview-section-divider h4').allTextContents(),['Architecture','Art','Zoology']);
  async function moveItem(host,title){
    const before=await page.evaluate(()=>JSON.stringify(window.data));
    await host.getByRole('button',{name:'Move '+title+' down',exact:true}).click();
    await page.waitForFunction(before=>JSON.stringify(window.data)!==before,before);
  }
  await moveItem(panel,'A note');
  assert.equal(await page.evaluate(async()=>Object.values((await store.read('A')).document.memberships).length),1);
  const membership=await page.evaluate(async()=>(await store.read('A')).document.memberships);
  await panel.getByRole('combobox',{name:'Sort notes'}).selectOption('za');
  await page.waitForFunction(()=>document.querySelector('.preview-section-divider h4')?.textContent==='Zoology');
  assert.deepEqual(await page.evaluate(async()=>(await store.read('A')).document.memberships),membership);
  if (process.env.ATLAS_POPOUT_SCREENSHOT)
    await page.screenshot({ path: process.env.ATLAS_POPOUT_SCREENSHOT });
  await page.getByRole("button", { name: "Switch Card", exact: true }).click();
  await page.locator("#preview-notes").click();
  await panel.getByRole("button", { name: "+ Section", exact: true }).click();
  await page
    .getByRole("button", { name: "Choose Existing Section", exact: true })
    .click();
  const select = page.getByRole("listbox", { name: "Existing Section names" });
  assert.deepEqual(await select.locator("option").allTextContents(), [
    "Architecture",
    "Art",
    "Zoology",
  ]);
  await page
    .getByRole("searchbox", { name: "Search Section names" })
    .fill("arch");
  assert.deepEqual(await select.locator("option").allTextContents(), [
    "Architecture",
  ]);
  await select.selectOption({ label: "Architecture" });
  await page
    .locator(".pin-section-editor")
    .getByRole("button", { name: "Add Section", exact: true })
    .click();
  await page.waitForSelector(".pin-section-editor", { state: "detached" });
  assert.equal(await panel.locator(".preview-note").count(), 1);
  assert.ok((await panel.textContent()).includes("Original B"));
  assert.ok(!(await panel.textContent()).includes("Original A"));
  await moveItem(panel,'B note');
  await panel.locator(".preview-note").first().click();
  await panel.getByLabel("Note", { exact: true }).fill("Edited B only");
  await panel.getByRole("button", { name: "Save", exact: true }).click();
  await page.waitForFunction(() =>
    document
      .querySelector("#preview-notes-panel")
      .textContent.includes("Edited B only"),
  );
  await panel.getByRole("button", { name: "Add Note", exact: true }).click();
  await panel.getByLabel("Title", { exact: true }).fill("New B");
  await panel.getByLabel("Note", { exact: true }).fill("Only B");
  await panel.getByRole("button", { name: "Save", exact: true }).click();
  await moveItem(panel,'New B');
  await page.locator("#preview-bookmarks").click();
  const links = page.locator("#preview-bookmarks-panel");
  await create("Architecture", links);
  await moveItem(links,'B link');
  assert.equal(await links.locator(".preview-bookmark").count(), 1);
  await links
    .getByRole("button", { name: "Add Existing Bookmark ↑", exact: true })
    .click();
  await links
    .getByRole("listbox", { name: "Choose an existing bookmark" })
    .selectOption("other");
  await links
    .getByRole("button", { name: "Add Bookmark", exact: true })
    .click();
  await moveItem(links,'Another link');
  assert.equal(await links.locator(".preview-bookmark").count(), 2);
  await page.reload();
  await page.locator("#preview-notes").click();
  assert.ok((await panel.textContent()).includes("Original A"));
  assert.ok(!(await panel.textContent()).includes("Only B"));
  const aIds = await page.evaluate(async () => {
    const a = await store.read("A"),
      b = await store.read("B");
    return [
      a.document.sections.find(
        (s) => a.names.find((n) => n.id === s.nameId)?.label === "Architecture",
      ).id,
      b.document.sections[0].id,
    ];
  });
  assert.notEqual(...aIds);
  await panel
    .getByRole("button", {
      name: "Remove Architecture Section; keep contents",
      exact: true,
    })
    .click();
  await page.waitForFunction(
    () =>
      !document
        .querySelector("#preview-notes-panel")
        .textContent.includes("Remove Architecture"),
  );
  assert.ok((await panel.textContent()).includes("Original A"));
  await page.getByRole("button", { name: "Switch Card", exact: true }).click();
  await page.locator("#preview-notes").click();
  assert.equal(
    await panel
      .getByRole("button", {
        name: "Remove Architecture Section; keep contents",
      })
      .count(),
    1,
  );
  assert.ok((await panel.textContent()).includes("Only B"));
  await panel
    .getByRole("button", { name: "Rename Architecture Section", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Section name", exact: true })
    .fill("Buildings");
  await page
    .locator(".pin-section-editor")
    .getByRole("button", { name: "Rename", exact: true })
    .click();
  await page.waitForSelector(".pin-section-editor", { state: "detached" });
  assert.ok((await panel.textContent()).includes("Buildings"));
  await page.getByRole("button", { name: "Tags", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Search existing tags" })
    .fill("arch");
  const tags = page.locator(".pin-tag-editor select");
  assert.equal(await tags.locator("option").count(), 2);
  await page
    .getByRole("searchbox", { name: "Search existing tags" })
    .press("Enter");
  await page.waitForFunction(() => window.data.tags?.length === 1);
  await page
    .getByRole("textbox", { name: "New tags, separated by commas" })
    .fill("architecture, ARCHITECTURE");
  await page.getByRole("button", { name: "Create & Add", exact: true }).click();
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => window.data.tags.length), 1);
  await page
    .getByRole("searchbox", { name: "Search existing tags" })
    .fill("travel");
  await page
    .getByRole("searchbox", { name: "Search existing tags" })
    .press("ArrowDown");
  assert.equal(await tags.evaluate((e) => document.activeElement === e), true);
  await tags.press("Enter");
  await page.waitForFunction(
    () =>
      window.data.tags.length === 2 &&
      !document.querySelector(".pin-tag-editor > button").disabled,
  );
  await tags.press("Enter");
  await page.waitForFunction(() => window.data.tags.length === 1);
  await page
    .getByRole("searchbox", { name: "Search existing tags" })
    .fill("does not exist");
  assert.equal(await tags.locator("option").textContent(), "No matching tags");
  await page.getByRole("button", { name: "Close tag editor" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(
    () => (document.documentElement.dataset.boardAppearance = "dark"),
  );
  await panel.getByRole("button", { name: "+ Section", exact: true }).click();
  await page
    .getByRole("button", { name: "Choose Existing Section", exact: true })
    .click();
  assert.equal(
    await page
      .locator(".pin-section-editor")
      .evaluate(
        (e) =>
          e.getBoundingClientRect().right <= innerWidth &&
          e.getBoundingClientRect().left >= 0,
      ),
    true,
  );
  await page.keyboard.press("Escape");
  await page.waitForSelector(".pin-section-editor", { state: "detached" });
  assert.equal(
    await page.evaluate(() => document.activeElement?.textContent),
    "+ Section",
  );
  await page.setViewportSize({width:1100,height:850});
  await page.locator('#preview-images').click();
  const images=page.locator('#preview-images-panel');
  await create('Pictures',images);
  await moveItem(images,'Portrait');
  await moveItem(images,'Portrait');
  await moveItem(images,'Landscape');
  await images.locator('img').first().waitFor();
  const geometry=await images.locator('.preview-images-grid').last().evaluate(grid=>({columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,rects:[...grid.querySelectorAll('img')].map(img=>({ratio:img.getBoundingClientRect().width/img.getBoundingClientRect().height,natural:img.naturalWidth/img.naturalHeight,clickable:!!img.closest('button,a')}))}));
  assert.equal(geometry.columns,2);assert.equal(geometry.rects.length,2);
  for(const r of geometry.rects){assert(Math.abs(r.ratio-r.natural)<0.02);assert.equal(r.clickable,false);}
  await page.setViewportSize({width:390,height:844});
  const narrow=await images.locator('.preview-images-grid').last().evaluate(grid=>({columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,fits:[...grid.querySelectorAll('img')].every(img=>img.getBoundingClientRect().right<=grid.getBoundingClientRect().right && img.getBoundingClientRect().width<=img.naturalWidth)}));
  assert.equal(narrow.columns,2);assert.equal(narrow.fits,true);
  assert.deepEqual(errors, []);
  console.log(
    "PASS Chromium: searchable normalized tags/Enter, create and reuse A–Z/searchable names across Cards, local note/bookmark assignments, new content, saved reopen, independent rename/removal and no content transfer. Synthetic content/storage adapters; installed MV3/native NOT_RUN.",
  );
} finally {
  await browser?.close();
  await new Promise((r) => server.close(r));
}
