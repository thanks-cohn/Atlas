// Real Chromium rendering/input harness with isolated, synthetic Chrome API data.
// This is NOT an MV3/native integration or a benchmark of the owner's machine.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve,extname} from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const scriptRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..'),args=process.argv.slice(2);
const option=(name,fallback)=>{const index=args.indexOf(name);return index<0?fallback:args[index+1];};
const root=resolve(option('--source-root',scriptRoot));
let playwright;
try{playwright=process.env.ATLAS_PLAYWRIGHT_MODULE?await import(process.env.ATLAS_PLAYWRIGHT_MODULE):createRequire(import.meta.url)('playwright');}catch{
  if(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)playwright=createRequire(import.meta.url)(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
  else throw Error('Install Playwright and Chromium first: npm install --no-save playwright; npx playwright install chromium');
}
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
const server=createServer((request,response)=>{
  try{const path=resolve(root,'extension','.'+new URL(request.url,'http://localhost').pathname);
    if(!path.startsWith(resolve(root,'extension')+'/'))throw Error('outside-root');
    response.setHeader('Content-Type',mime[extname(path)] || 'application/octet-stream');response.end(readFileSync(path));
  }catch{response.writeHead(404);response.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser;
try{
  browser=await playwright.chromium.launch({headless:true,...(option('--chromium',null)?{executablePath:option('--chromium')}:{}),args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1366,height:768}}),page=await context.newPage(),errors=[];
  page.on('pageerror',()=>errors.push('page-error'));
  const origin='http://127.0.0.1:'+server.address().port;
  const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aT8sAAAAASUVORK5CYII=','base64');
  await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  await page.route('**/fixture/**',route=>route.fulfill({contentType:'image/png',body:image}));
  await page.addInitScript(({origin,count,budget})=>{
    const children=Array.from({length:count},(_,index)=>({id:String(index+10),parentId:'1',title:'Fixture '+index,url:origin+'/fixture/'+index+'.jpg'}));
    const roots=[{id:'0',children:[{id:'1',title:'Fixture',parentId:'0',children:[{id:'2',parentId:'1',title:'Architecture',children:[children[0]]},...children.slice(1)]}]}],events=[],saved={'atlas.pinboard.settings.v1':{limit:budget}};
    // Substantial saved data URIs exercise validation/signature costs separately
    // from the tiny deterministic HTTP image fixture. No external requests.
    const canvas=document.createElement('canvas');canvas.width=320;canvas.height=240;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(320,240);let seed=123;
    for(let index=0;index<pixels.data.length;index++){seed=(seed*1664525+1013904223)>>>0;pixels.data[index]=index%4===3?255:seed>>>24;}
    ctx.putImageData(pixels,0,0);const cover=canvas.toDataURL('image/png');
    saved.atlasBookmarkCoversV1=Object.fromEntries(children.filter((_,index)=>index%10===0).map(node=>[node.id,{url:node.url,image:cover}]));
    saved['atlas.pinboard.cards.v1']={default:[{id:'imported',title:'Imported',folderSourceBookmarkId:children[0].id,url:children[0].url,tags:['fixture'],image:cover},{id:'own',title:'Independent',tags:['Manual'],image:cover}]};saved['atlas.pinboards.v1']={'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa':{version:1,id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',title:'Second Board',folderId:'all',sourceBookmark:{id:'1',url:''}}};Object.assign(saved,JSON.parse(sessionStorage.getItem('fixture') || '{}'));window.fixture={saved,roots};window.chrome={storage:{local:{async get(keys){return structuredClone(keys==null?saved:Object.fromEntries((Array.isArray(keys)?keys:[keys]).map(key=>[key,saved[key]])));},async set(values){const changes={};for(const [key,value] of Object.entries(values)){changes[key]={oldValue:saved[key],newValue:value};saved[key]=structuredClone(value);}sessionStorage.setItem('fixture',JSON.stringify(saved));for(const event of events)event(changes,'local');}},onChanged:{addListener(fn){events.push(fn);}}},bookmarks:{async getTree(){return structuredClone(roots);},async get(id){return children.filter(node=>node.id===id);}},runtime:{async sendMessage(){return {ok:true,paired:false,revision:0,data:{resources:{},relationships:{}}};}},tabs:{}};
  },{origin,count:Math.max(100,Math.min(5000,Number(option('--cards',100)))),budget:Number(option('--budget',24))});
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:Number(option('--cpu',1))});
  await page.goto(origin+'/pinboard.html');
  await page.waitForFunction(()=>document.querySelectorAll('#pins .pin').length>0 && !document.querySelector('.pin-initial-cover') && !!window.atlasDebug?.performance,{},{timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#tag-field').textContent.includes('fixture'));
  const evidence=()=>page.evaluate(()=>JSON.stringify(window.fixture.saved['atlas.pinboard.folder-tags.v1']));
  const initial=await evidence();assert.ok(initial.includes('chrome-bookmarks'));
  await page.locator('#board-menu > summary').focus();await page.keyboard.press('Enter');
  await page.locator('.board-options details > summary').click();
  await page.locator('#folder-tags').uncheck();
  await page.waitForFunction(()=>!document.querySelector('#tag-field').textContent.includes('fixture'));
  assert.equal(await evidence(),initial);
  await page.reload();await page.waitForFunction(()=>document.querySelectorAll('#pins .pin').length>0);
  assert.equal(await page.locator('#folder-tags').isChecked(),false);
  await page.locator('#board-menu > summary').focus();await page.keyboard.press('Enter');await page.locator('.board-options details > summary').click();
  await page.locator('#folder-tags').check();await page.waitForFunction(()=>document.querySelector('#tag-field').textContent.includes('fixture'));
  assert.equal(await evidence(),initial);
  // Existing tag picker: imported folder vocabulary applies to an unrelated card.
  await page.locator('#folder').selectOption('blank');
  await page.locator('#board-menu > summary').focus();await page.keyboard.press('Enter');
  await page.locator('.pin-visual').filter({has:page.locator('img[alt="Independent"]')}).click();
  // Integration: the same authored Card uses its existing content adapter,
  // while the organization adapter stores only local references.
  await page.locator('#preview-notes').click();
  const notes=page.locator('#preview-notes-panel');
  await notes.getByRole('button',{name:'+ Section',exact:true}).click();
  await page.getByRole('button',{name:'Create New Section',exact:true}).click();
  await page.getByRole('textbox',{name:'Section name',exact:true}).fill('Integration');
  await page.locator('.pin-section-editor').getByRole('button',{name:'Add Section',exact:true}).click();
  await page.waitForSelector('.pin-section-editor',{state:'detached'});
  await notes.getByRole('button',{name:'Add Note',exact:true}).click();
  await notes.getByLabel('Title',{exact:true}).fill('Integration note');
  await notes.getByLabel('Note',{exact:true}).fill('Local authored content');
  await notes.getByRole('button',{name:'Save',exact:true}).click();
  await notes.getByRole('button',{name:'Move Integration note down',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#preview-notes-panel .preview-section-items .preview-note'));
  await notes.locator('.preview-section-items .preview-note').waitFor({state:'visible'});
  await page.keyboard.press('Escape');
  await page.locator('.pin-visual').filter({has:page.locator('img[alt="Independent"]')}).click();
  if(await page.locator('#preview-notes').getAttribute('aria-expanded')!=='true')await page.locator('#preview-notes').click();
  await page.waitForFunction(()=>document.querySelector('#preview-notes-panel .preview-section-items .preview-note')?.textContent.includes('Local authored content'));
  await notes.locator('.preview-section-items .preview-note').scrollIntoViewIfNeeded();
  await notes.locator('.preview-section-items .preview-note').waitFor({state:'visible'});
  if(process.env.ATLAS_POPOUT_SCREENSHOT)await page.screenshot({path:process.env.ATLAS_POPOUT_SCREENSHOT});
  await page.locator('#preview-add-tag').click();
  await page.waitForSelector('.pin-tag-editor[open]');
  const picker=page.locator('.pin-tag-editor select');
  assert.ok((await picker.locator('option').allTextContents()).some(t=>t==='architecture'));
  await picker.selectOption('architecture');await page.getByRole('button',{name:'Add Tag',exact:true}).last().click();
  await page.waitForFunction(()=>window.fixture.saved['atlas.pinboard.cards.v1'].default.find(c=>c.id==='own').tags.includes('architecture'));
  await page.getByRole('button',{name:'Close tag editor'}).click();await page.keyboard.press('Escape');
  await page.locator('#board-menu > summary').focus();await page.keyboard.press('Enter');await page.locator('#folder-tags').uncheck();
  await page.waitForFunction(()=>window.fixture.saved['atlas.pinboard.folder-tag-settings.v1'].default===false);
  // Both independently authored tags survive OFF, including the same folder label.
  assert.ok((await page.locator('#tag-field').textContent()).includes('fixture'));
  assert.ok((await page.locator('#tag-field').textContent()).includes('architecture'));
  assert.equal(await evidence(),initial);
  // Explicit gallery materialization preserves existing membership references;
  // the newly added image starts with no copied notes.
  await page.locator('#board-menu > summary').focus();await page.keyboard.press('Enter');
  await page.locator('.pin-visual').filter({has:page.locator('img[alt="Independent"]')}).click();
  await page.locator('#replace-image').click();
  await page.locator('#cover-url').fill(origin+'/fixture/new-image.jpg');
  await page.locator('#save-image-url').click();
  await page.waitForFunction(()=>document.querySelector('#image-position').textContent.includes('2 / 2'));
  if(await page.locator('#preview-notes').getAttribute('aria-expanded')!=='true')await page.locator('#preview-notes').click();
  assert.equal(await notes.locator('.preview-note').count(),0);
  await page.locator('#previous-image').click();
  if(await page.locator('#preview-notes').getAttribute('aria-expanded')!=='true')await page.locator('#preview-notes').click();
  await notes.locator('.preview-section-items .preview-note').waitFor({state:'visible'});
  assert.ok((await notes.locator('.preview-section-items .preview-note').textContent()).includes('Local authored content'));
  await page.keyboard.press('Escape');
  await page.goto(origin+'/pinboard.html?id=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
  await page.waitForFunction(()=>document.querySelectorAll('#pins .pin').length>0);
  assert.equal(await page.locator('#folder-tags').isChecked(),true);
  assert.ok((await page.locator('#tag-field').textContent()).includes('architecture'));
  assert.equal(await evidence(),initial);
  assert.equal(errors.length,0);
  console.log('PASS Chromium '+browser.version()+': actual settings controls, persisted OFF after reload, ON restoration with byte-identical folder evidence, existing tag dropdown, unrelated-card manual assignment, matching manual labels retained OFF, independent second board ON, authored Section/content reopen and explicit image migration without content copying. Synthetic Chrome APIs; installed MV3/native NOT_RUN.');
}finally{await browser?.close();await new Promise(done=>server.close(done));}
