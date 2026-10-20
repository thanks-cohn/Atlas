// Real rendering and input with explicit synthetic provider APIs. Full MV3 has its own gate.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { installWorkspaceFixture } from "./fixtures/workspace-browser-fixture.mjs";
let chromium;
try {
  ({ chromium } = await import(
    process.env.ATLAS_PLAYWRIGHT_MODULE || "playwright"
  ));
} catch (error) {
  if (
    !process.env.ATLAS_PLAYWRIGHT_MODULE &&
    error.code === "ERR_MODULE_NOT_FOUND"
  ) {
    console.log("SKIP window Chromium: optional Playwright missing.");
    process.exit(0);
  }
  throw error;
}
const root = resolve(process.env.ATLAS_WORKSPACE_ROOT || "extension"),
  output = resolve(
    process.env.ATLAS_WINDOW_EVIDENCE || "/tmp/atlas-swap-browser",
  );
await mkdir(output, { recursive: true });
const server = createServer(async (req, res) => {
  try {
    const path = resolve(
      root,
      "." + new URL(req.url, "http://localhost").pathname,
    );
    if (!path.startsWith(root + "/")) {
      res.writeHead(403).end();
      return;
    }
    res.setHeader(
      "Content-Type",
      {
        ".js": "application/javascript",
        ".css": "text/css",
        ".html": "text/html",
      }[extname(path)] || "application/octet-stream",
    );
    res.end(await readFile(path));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
  executablePath: process.env.ATLAS_CHROMIUM_PATH || undefined,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({
  viewport: { width: 1366, height: 768 },
  hasTouch: true,
});
await context.addInitScript(installWorkspaceFixture);
const page = await context.newPage(),
  errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const url = `http://127.0.0.1:${server.address().port}/workspace.html`;
const left = page.locator(".pane").nth(0),
  right = page.locator(".pane").nth(1),
  launcher = page.getByRole("button", {
    name: "Workspace commands",
    exact: true,
  }),
  menu = page.locator(".command-flyout");
async function settle() {
  await page.waitForTimeout(160);
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}
const close = (a, b) => assert(Math.abs(a - b) < 2, `${a} != ${b}`);
async function snapshot() {
  return page.locator(".pane").evaluateAll((nodes) =>
    nodes.map((n) => ({
      width: n.getBoundingClientRect().width,
      upper: n.querySelector(".hierarchy").getBoundingClientRect().height,
      lower: n.querySelector(".viewer").getBoundingClientRect().height,
      provider: n.querySelector(".provider").value,
      query: n.querySelector(".search").value,
      selected: [...n.querySelectorAll('.item[aria-selected="true"]')].map(
        (n) => n.innerText,
      ),
      pin: n
        .querySelector(".viewer-actions>button")
        ?.getAttribute("aria-pressed"),
      scroll: n.querySelector(".viewer-content")?.scrollTop || 0,
      items: n.querySelector(".items").scrollTop,
      breadcrumb: n.querySelector(".breadcrumb").innerText,
    })),
  );
}
async function openCommands() {
  await launcher.click();
  await menu.waitFor({ state: "visible" });
}
try {
  await page.goto(url);
  await left.getByLabel('Location provider').selectOption('local');
  await left.locator('.items .item').first().dblclick();
  await left.getByRole('option',{name:'Alpine study.png'}).click();await left.locator('.viewer img').waitFor();
  await left.getByRole('button',{name:'Pin Preview',exact:true}).click();
  await right.getByLabel('Location provider').selectOption('objects');
  await right.getByRole('option',{name:'Composition notes'}).click();
  await right.getByRole('tab',{name:'Notes',exact:true}).click();
  await right.getByRole('button',{name:'Pin Preview',exact:true}).click();
  await right.locator('.viewer-content').evaluate(n=>{n.firstChild.textContent+='\n'+Array.from({length:70},(_,i)=>'Research '+i).join('\n');n.scrollTop=180;});
  const media=await left.locator('.viewer img').elementHandle();
  await left.locator('.row-splitter').focus();await page.keyboard.press('ArrowUp');await page.keyboard.press('ArrowUp');
  await right.locator('.row-splitter').focus();await page.keyboard.press('ArrowDown');
  await page.locator('.column-splitter').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
  await settle();
  const reads=await page.evaluate(()=>fixtureCalls.filter(c=>c.path==='/v1/read').length);
  const reports=[];
  async function modes(){return page.locator('.pane').evaluateAll(nodes=>nodes.map(n=>n.dataset.windowMax));}
  async function sides(){
    if(await launcher.isVisible()){await openCommands();await page.getByRole('menuitem',{name:'Swap left and right panes',exact:true}).click();}
    else await page.getByRole('button',{name:'Swap left and right panes',exact:true}).click();
    await settle();
  }
  function sameDimensions(before,after){for(let i=0;i<2;i++){for(const key of ['width','upper','lower','scroll','items'])close(after[i][key],before[i][key]);assert.deepEqual({...after[i],width:0,upper:0,lower:0,scroll:0,items:0},{...before[i],width:0,upper:0,lower:0,scroll:0,items:0});}}
  for(const scenario of ['manually-resized','partially-expanded','fully-expanded','mixed-expansion','expanded-and-resized']){
    if(scenario==='partially-expanded')await left.locator('.viewer .maximize').click();
    if(['fully-expanded','expanded-and-resized'].includes(scenario)){await left.locator('.viewer .maximize').click();await right.locator('.viewer .maximize').click();}
    if(scenario==='mixed-expansion'){await left.locator('.pane-head .maximize').click();await right.locator('.viewer .maximize').click();}
    await settle();
    if(scenario==='expanded-and-resized'){
      const rect=await left.locator('.row-splitter').boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2+24,{steps:8});await page.mouse.up();await settle();
    }
    const before=await snapshot(),mode=await modes(),x=(await left.boundingBox()).x;
    await sides();assert((await left.boundingBox()).x!==x);sameDimensions(before,await snapshot());assert.deepEqual(await modes(),mode,scenario+' horizontal expansion follows panels');
    await sides();sameDimensions(before,await snapshot());
    for(const column of [left,right]){
      const prior=await snapshot(),height=(await column.boundingBox()).height;
      await column.locator('.pane-head .rearrange').click();await settle();
      sameDimensions(prior,await snapshot());close((await column.boundingBox()).height,height);assert.deepEqual(await modes(),mode,scenario+' vertical expansion retained');
      assert((await column.locator('.viewer').boundingBox()).y<(await column.locator('.hierarchy').boundingBox()).y);
      await column.locator('.pane-head .rearrange').click();await settle();sameDimensions(prior,await snapshot());
    }
    assert(await media.evaluate(n=>n.isConnected));
    reports.push({scenario,dimensions:before,expansion:mode});
    await page.screenshot({path:output+'/'+scenario+'.png'});
    if(mode.some(Boolean)){await page.keyboard.press('Escape');await settle();}
  }
  assert.equal(await page.evaluate(()=>fixtureCalls.filter(c=>c.path==='/v1/read').length),reads);
  assert.deepEqual(errors,[]);
  await (await import('node:fs/promises')).writeFile(output+'/verification.json',JSON.stringify({browser:browser.version(),syntheticProviders:true,reports},null,2));
  console.log('PASS Chromium '+browser.version()+': horizontal/vertical swaps preserve per-panel dimensions, expansion, occupied height, selections, scroll, pins and live media in five normal/partial/full/resized scenarios; no extra native reads.');
} catch(error){await page.screenshot({path:output+'/failure.png'});throw error;}
finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
