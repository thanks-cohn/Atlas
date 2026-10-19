// Real Chromium rendering/input harness with isolated, synthetic Chrome API data.
// This is NOT an MV3/native integration or a benchmark of the owner's machine.
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve,extname} from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const scriptRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..'),args=process.argv.slice(2);
const option=(name,fallback)=>{const index=args.indexOf(name);return index<0?fallback:args[index+1];};
const root=resolve(option('--source-root',scriptRoot));
let playwright;
try{const require=createRequire(import.meta.url);playwright=require('playwright');}catch{
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
    const roots=[{id:'0',children:[{id:'1',title:'Fixture',parentId:'0',children}]}],events=[],saved={'atlas.pinboard.settings.v1':{limit:budget}};
    // Substantial saved data URIs exercise validation/signature costs separately
    // from the tiny deterministic HTTP image fixture. No external requests.
    const canvas=document.createElement('canvas');canvas.width=320;canvas.height=240;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(320,240);let seed=123;
    for(let index=0;index<pixels.data.length;index++){seed=(seed*1664525+1013904223)>>>0;pixels.data[index]=index%4===3?255:seed>>>24;}
    ctx.putImageData(pixels,0,0);const cover=canvas.toDataURL('image/png');
    saved.atlasBookmarkCoversV1=Object.fromEntries(children.filter((_,index)=>index%10===0).map(node=>[node.id,{url:node.url,image:cover}]));
    window.chrome={storage:{local:{async get(keys){return structuredClone(keys==null?saved:Object.fromEntries((Array.isArray(keys)?keys:[keys]).map(key=>[key,saved[key]])));},async set(values){const changes={};for(const [key,value] of Object.entries(values)){changes[key]={oldValue:saved[key],newValue:value};saved[key]=structuredClone(value);}for(const event of events)event(changes,'local');}},onChanged:{addListener(fn){events.push(fn);}}},bookmarks:{async getTree(){return structuredClone(roots);},async get(id){return children.filter(node=>node.id===id);}},runtime:{async sendMessage(){return {ok:true,paired:false,revision:0,data:{resources:{},relationships:{}}};}},tabs:{}};
  },{origin,count:Math.max(100,Math.min(5000,Number(option('--cards',1000)))),budget:Number(option('--budget',24))});
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:Number(option('--cpu',1))});
  await page.goto(origin+'/pinboard.html');
  await page.waitForFunction(()=>document.querySelectorAll('#pins .pin').length>0 && !document.querySelector('.pin-initial-cover') && !!window.atlasDebug?.performance,{},{timeout:30000});
  await page.evaluate(()=>window.atlasDebug.performance.start({durationMs:30000}));
  const stress=await page.evaluate(async()=>{let completed=0;const start=scrollY;try{for(let index=0;index<24;index++){scrollBy({top:(Math.floor(index/4)%2?-1:1)*1500,behavior:'instant'});await window.atlasDebug.performance.afterPaint('fixture.scroll');completed++;}}finally{scrollTo({top:start,behavior:'instant'});}return {completed_steps:completed,synthetic_scroll:true};});
  for(let index=0;index<20;index++)await page.mouse.wheel(0,index%6<3?850:-850);
  const point=await page.evaluate(()=>{for(const node of document.querySelectorAll('.pin-visual')){const r=node.getBoundingClientRect();if(r.top>=0 && r.top<innerHeight-80)return {x:r.left+r.width/2,y:r.top+Math.min(40,r.height/2)};}return null;});
  let opened=false,closed=false;
  if(point){await page.mouse.click(point.x,point.y);try{await page.waitForFunction(()=>document.getElementById('detail').open,null,{timeout:2000});opened=true;}catch{}if(opened){await page.keyboard.press('Escape');try{await page.waitForFunction(()=>!document.getElementById('detail').open,null,{timeout:2000});closed=true;}catch{}}}
  const report=await page.evaluate(()=>({check:window.atlasDebug.performance.check(),capture:window.atlasDebug.performance.stop()}));
  const result={schema:'atlas.browser-performance-fixture.v1',browser:browser.version(),fixture_only:true,mv3_runtime:false,native_helper:false,cpu_rate:Number(option('--cpu',1)),stress,preview:{opened,closed},page_errors:errors,...report};
  const output=resolve(option('--output','/tmp/atlas-pinboard-browser.json'));mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({output,preview:result.preview,stress,check:result.check,application:result.capture.application,measurements:result.capture.measurements}));
  if(errors.length || !opened || !closed)process.exitCode=1;
  if(args.includes('--require-budget') && result.check.rules.some(rule=>rule.status==='over-budget'))process.exitCode=1;
}finally{await browser?.close();await new Promise(done=>server.close(done));}
