#!/usr/bin/env node
/** Executes the shipped worker in Node's VM against transport doubles.
 * This proves worker decisions and request contracts, not Chrome MV3 behavior.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../extension/background.js', import.meta.url), 'utf8');
const extensionId = 'a'.repeat(32);
const extensionURL = `chrome-extension://${extensionId}/`;
const token = 'private-pairing-token-that-must-stay-in-worker';
const clone = value => structuredClone(value);

function worker() {
  let listener;
  const calls = {fetch: [], native: [], access: [], writes: [], removes: [], tabs: [], panels: []};
  const session = {};
  const local = {};
  const stub = {
    calls, session, local,
    response: {ok: true, status: 200, body: {ok: true, protocol: 'atlas.local.v1', status: 'ready'}},
    nativeResult: {ok: true, protocol: 'atlas.local.v1', port: 17892, token},
    fetchFailure: null,
  };
  const chrome = {
    runtime: {
      id: extensionId,
      getURL: path => extensionURL + path,
      onMessage: {addListener: callback => { listener = callback; }},
      onStartup:{addListener:callback=>{stub.startup=callback;}},
      sendNativeMessage: async (host, message) => {
        calls.native.push({host, message: clone(message)});
        if(stub.nativeFailure)throw stub.nativeFailure;
        if(stub.nativeHook)await stub.nativeHook();
        return clone(stub.nativeResult);
      },
    },
    action: {onClicked: {addListener: callback => { stub.click = callback; }}},
    tabs: {create: value => calls.tabs.push(clone(value))},
    sidePanel: {open: async value => { calls.panels.push(clone(value)); if (stub.panelFailure) throw new Error('Side panel unavailable'); }},
    storage: {local:{get:async key=>({[key]:local[key]}),set:async value=>Object.assign(local,clone(value)),remove:async key=>{delete local[key];},setAccessLevel:async()=>{}},session: {
      setAccessLevel: async value => calls.access.push(clone(value)),
      set: async value => { calls.writes.push(clone(value)); Object.assign(session, clone(value)); },
      get: async key => ({[key]: session[key]}),
      remove: async key => { calls.removes.push(key); delete session[key]; },
    }},
  };
  const context = vm.createContext({chrome, AbortSignal, setTimeout, clearTimeout, fetch: async (url, options) => {
    calls.fetch.push({url, options: clone(options)});
    if(stub.fetchHook)return stub.fetchHook(url,options);
    if (stub.fetchFailure) throw stub.fetchFailure;
    return {ok: stub.response.ok, status: stub.response.status, json: async () => clone(stub.response.body)};
  }});
  vm.runInContext(source, context, {filename: 'extension/background.js', timeout: 1000});
  stub.send = (message, sender = {id: extensionId, url: extensionURL + 'explorer.html'}) => new Promise((resolve, reject) => {
    try {
      const accepted = listener(message, sender, value => resolve(clone(value)));
      if (accepted !== true) resolve(undefined);
    } catch (error) { reject(error); }
  });
  return stub;
}

const tests = [];
function test(name, run) { tests.push({name, run}); }
function noToken(value) {
  assert.ok(!JSON.stringify(value).includes(token), 'Pairing token leaked in worker response');
  assert.equal(value.token, undefined);
}

test('session credential access is restricted to trusted extension contexts', async () => {
  const w = worker();
  assert.deepEqual(w.calls.access, [{accessLevel: 'TRUSTED_CONTEXTS'}]);
  w.click({id: 17});
  await Promise.resolve();
  assert.deepEqual(w.calls.panels, [{tabId: 17}]);
  assert.deepEqual(w.calls.tabs, []);
  w.panelFailure = true;
  w.click({id: 18});
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(w.calls.tabs, [{url: extensionURL + 'explorer.html'}]);
});

test('foreign extensions, webpages and missing sender URLs are rejected before transport', async () => {
  const w = worker();
  for (const sender of [
    {id: 'b'.repeat(32), url: extensionURL + 'explorer.html'},
    {id: extensionId, url: 'https://evil.example/'},
    {id: extensionId, url: extensionURL.slice(0, -1) + '.evil/explorer.html'},
    {id: extensionId}, {},
  ]) {
    assert.equal(await w.send({type: 'pair', token}, sender), undefined);
    assert.equal(await w.send({type: 'native-connect'}, sender), undefined);
  }
  assert.equal(w.calls.fetch.length, 0);
  assert.equal(w.calls.native.length, 0);
  assert.deepEqual(w.session, {});
});

test('manual pairing validates health before storage and responses never disclose token', async () => {
  const w = worker();
  const result = await w.send({type: 'pair', token});
  assert.deepEqual(result, {ok: true});
  noToken(result);
  assert.equal(w.session.token, token);
  assert.equal(w.calls.fetch[0].url, 'http://127.0.0.1:17892/v1/health');
  assert.equal(w.calls.fetch[0].options.headers.Authorization, `Bearer ${token}`);
  const state = await w.send({type: 'state'});
  assert.deepEqual(state, {ok: true, paired: true});
  noToken(state);
});

test('failed manual health authentication cannot persist proposed credentials', async () => {
  for (const failure of ['status', 'body', 'network']) {
    const w = worker();
    w.session.token = 'previous-valid-token';
    if (failure === 'status') w.response = {ok: false, status: 401, body: {ok: false, error: {message: 'Invalid token'}}};
    if (failure === 'body') w.response.body = {ok: false, error: {message: 'Revoked'}};
    if (failure === 'network') w.fetchFailure = new Error('Failed to fetch');
    const result = await w.send({type: 'pair', token});
    assert.equal(result.ok, false);
    assert.equal(w.session.token, 'previous-valid-token');
    assert.equal(w.calls.writes.filter(v=>v.token).length, 0);
    noToken(result);
  }
});

test('manual pairing rejects invalid credential lengths without network access', async () => {
  const w = worker();
  for (const bad of [null, 123, '', 'short', 'x'.repeat(1025)]) {
    assert.equal((await w.send({type: 'pair', token: bad})).ok, false);
  }
  assert.equal(w.calls.fetch.length, 0);
  assert.equal(w.calls.writes.filter(v=>v.token).length, 0);
});

test('native pairing rejects incompatible protocol, port and malformed results', async () => {
  for (const change of [{protocol: 'atlas.local.v0'}, {port: 80}, {port: '17892'}, {token: null}, {token: ''}, {token:'x'.repeat(201)}, {ok: false}]) {
    const w = worker();
    Object.assign(w.nativeResult, change);
    const result = await w.send({type: 'native-connect'});
    assert.equal(result.ok, false);
    assert.equal(w.calls.fetch.length, 0);
    assert.equal(w.calls.writes.filter(v=>v.token).length, 0);
    assert.equal(w.calls.native[0].host, 'org.atlas.companion');
    assert.deepEqual(w.calls.native[0].message, {action: 'connect'});
    noToken(result);
  }
});

test('native bootstrap authenticates health before storing token', async () => {
  const w = worker();
  const result = await w.send({type: 'native-connect'});
  assert.deepEqual(result, {ok: true});
  assert.equal(w.session.token, token);
  assert.equal(w.calls.fetch.length, 1);
  noToken(result);
  const rejected = worker();
  rejected.response.ok = false;
  rejected.response.body = {ok: false, error: {message: 'Unpaired'}};
  assert.equal((await rejected.send({type: 'native-connect'})).ok, false);
  assert.equal(rejected.session.token,undefined);
});

test('only exact API routes can reach the fixed numeric loopback endpoint', async () => {
  const w = worker();
  w.session.token = token;
  for (const path of ['https://evil.example/', '/v1/list?path=secret', '/v1/list/../operate', '//evil.example/v1/list', '/v1/exec', '/v1/list#fragment', '/v1/health/']) {
    const result = await w.send({type: 'api', path});
    assert.equal(result.ok, false);
    noToken(result);
  }
  assert.equal(w.calls.fetch.length, 0);
  const result = await w.send({type: 'api', path: '/v1/list', body: {grant: 'explicit-grant', path: 'research'}});
  assert.equal(result.ok, true);
  noToken(result);
  const call = w.calls.fetch[0];
  assert.equal(call.url, 'http://127.0.0.1:17892/v1/list');
  assert.equal(call.options.method, 'POST');
  assert.equal(call.options.headers.Authorization, `Bearer ${token}`);
  assert.equal(call.options.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(call.options.body), {grant: 'explicit-grant', path: 'research'});
  await w.send({type: 'api', path: '/v1/grants'});
  assert.equal(w.calls.fetch[1].options.method, 'GET');
  assert.equal(w.calls.fetch[1].options.body, undefined);
});

test('unpaired API requests fail locally and disconnect clears credentials', async () => {
  const w = worker();
  assert.equal((await w.send({type: 'api', path: '/v1/list', body: {}})).ok, false);
  assert.equal(w.calls.fetch.length, 0);
  w.session.token = token;
  const result = await w.send({type: 'disconnect'});
  assert.deepEqual(result, {ok: true});
  noToken(result);
  assert.deepEqual(w.calls.removes, ['token','unknownOperation']);
  assert.deepEqual(await w.send({type: 'state'}), {ok: true, paired: false});
  assert.equal((await w.send({type: 'api', path: '/v1/grants'})).ok, false);
  assert.equal(w.calls.fetch.length, 0);
});

test('remembered native enrollment survives browser session without durable credentials', async()=>{
  const w=worker();await w.send({type:'native-connect'});assert.equal(w.local.nativeEnrolled,true);assert.deepEqual(Object.keys(w.local).sort(),['diagnosticEvents','nativeEnrolled']);
  noToken(w.local);
  delete w.session.token;const result=await w.send({type:'ensure-ready'});assert.equal(result.paired,true);assert.equal(result.state,'READY');assert.equal(w.calls.native.length,2);noToken(result);
  await w.send({type:'disconnect'});assert.equal(w.local.nativeEnrolled,undefined);delete w.session.token;
  const before=w.calls.native.length;assert.equal((await w.send({type:'ensure-ready'})).paired,false);assert.equal(w.calls.native.length,before);
});
test('manual mode and a new extension never auto-enroll or native wake',async()=>{
  const w=worker();await w.send({type:'pair',token});assert.equal(w.local.nativeEnrolled,undefined);delete w.session.token;
  assert.equal((await w.send({type:'ensure-ready'})).paired,false);assert.equal(w.calls.native.length,0);
  w.session.token=token;w.fetchFailure=new Error('Failed to fetch');const result=await w.send({type:'api',path:'/v1/list',body:{}});assert.equal(result.ok,false);assert.equal(w.calls.native.length,0);noToken(result);
});
test('read transport failure wakes native once and retries the read once',async()=>{
  const w=worker();w.local.nativeEnrolled=true;w.session.token=token;let lists=0;
  w.fetchHook=async(url)=>{if(url.endsWith('/v1/list')&&++lists===1)throw new Error('Helper killed');return {ok:true,status:200,json:async()=>({ok:true,protocol:'atlas.local.v1',status:'ready',entries:[]})};};
  assert.equal((await w.send({type:'api',path:'/v1/list',body:{grant:'test',path:''}})).ok,true);assert.equal(lists,2);assert.equal(w.calls.native.length,1);
});
test('concurrent read recovery shares one native connection and remains bounded on failure',async()=>{
  const w=worker();w.local.nativeEnrolled=true;w.session.token=token;let woke=false;
  w.nativeHook=async()=>{await new Promise(resolve=>setTimeout(resolve,10));woke=true;};
  w.fetchHook=async url=>{if(url.endsWith('/v1/list')&&!woke)throw new Error('Offline');return {ok:true,status:200,json:async()=>({ok:true,protocol:'atlas.local.v1',status:'ready'})};};
  const results=await Promise.all([1,2,3].map(()=>w.send({type:'api',path:'/v1/list',body:{}})));assert.ok(results.every(r=>r.ok));assert.equal(w.calls.native.length,1);
  w.fetchFailure=new Error('Offline');delete w.fetchHook;w.calls.native=[];const result=await w.send({type:'api',path:'/v1/list',body:{}});assert.equal(result.ok,false);assert.equal(w.calls.native.length,1);
});
test('ambiguous filesystem and graph writes are never replayed or native-reconnected automatically',async()=>{
  for(const path of ['/v1/operate','/v1/catalog','/v1/library']){const w=worker();w.local.nativeEnrolled=true;w.session.token=token;w.fetchHook=async url=>{if(url.endsWith(path))throw new Error('Response lost');return {ok:true,status:200,json:async()=>({ok:true,protocol:'atlas.local.v1',status:'ready'})};};const result=await w.send({type:'api',path,body:{id:'test-operation-id-12345'}});assert.equal(result.error.code,'OUTCOME_UNKNOWN');assert.equal(result.error.operationId,'test-operation-id-12345');assert.equal(w.calls.fetch.filter(call=>call.url.endsWith(path)).length,1);assert.equal(w.calls.native.length,0);assert.equal(w.session.lifecycleState,'OUTCOME_UNKNOWN');noToken(result);}
});
test('mutation readiness recovery occurs before submission and never replays the operation',async()=>{
  const w=worker();w.session.token=token;w.local.nativeEnrolled=true;let ready=false,writes=0;
  w.nativeHook=async()=>{ready=true;};w.fetchHook=async url=>{if(!ready)throw new Error('Helper already dead');if(url.endsWith('/v1/operate'))writes++;return {ok:true,status:200,json:async()=>({ok:true,protocol:'atlas.local.v1',status:'ready',receipt:{status:'completed'}})};};
  const result=await w.send({type:'api',path:'/v1/operate',body:{id:'single-submission-0001'}});assert.equal(result.ok,true);assert.equal(writes,1);assert.equal(w.calls.native.length,1);
});

test('native failure states and management never grant browser root authority',async()=>{
  for(const [message,code] of [['Specified native messaging host not found.','NEEDS_INSTALL'],['Access to native messaging host is forbidden.','NEEDS_PAIRING']]){const w=worker();w.local.nativeEnrolled=true;w.nativeFailure=new Error(message);const result=await w.send({type:'ensure-ready'});assert.equal(result.error.code,code);assert.equal(w.session.token,undefined);}
  const w=worker();assert.equal((await w.send({type:'native-manage'})).ok,true);assert.deepEqual(w.calls.native[0].message,{action:'manage'});assert.equal(w.session.token,undefined);assert.equal(w.local.nativeEnrolled,undefined);
});

test('unknown outcomes stay visible across reads and reconcile only final matching receipts or explicit acknowledgement',async()=>{
 const w=worker();w.session.token=token;w.session.unknownOperation={operationId:'uncertain-op',kind:'/v1/operate'};
 assert.equal((await w.send({type:'ensure-ready'})).state,'OUTCOME_UNKNOWN');
 await w.send({type:'api',path:'/v1/list',body:{}});assert.equal(w.session.lifecycleState,'OUTCOME_UNKNOWN');
 w.response.body={ok:true,receipts:[{id:'uncertain-op',status:'pending'}]};await w.send({type:'api',path:'/v1/receipts'});assert.ok(w.session.unknownOperation);
 w.response.body={ok:true,receipts:[{id:'uncertain-op',status:'completed'}]};await w.send({type:'api',path:'/v1/receipts'});assert.equal(w.session.unknownOperation,undefined);assert.equal(w.session.lifecycleState,'READY');
 w.session.unknownOperation={operationId:null,kind:'/v1/catalog'};const count=w.calls.fetch.length;await w.send({type:'acknowledge-unknown'});assert.equal(w.session.unknownOperation,undefined);assert.equal(w.calls.fetch.length,count);
});
test('browser startup wakes only explicitly remembered native enrollment',async()=>{
 const fresh=worker();await fresh.startup();assert.equal(fresh.calls.native.length,0);
 const returning=worker();returning.local.nativeEnrolled=true;await returning.startup();assert.equal(returning.calls.native.length,1);assert.equal(returning.session.token,token);
});

test('diagnostic report exposes stages and mode without credentials or automatic reconnect', async()=>{
 const w=worker();
 await w.send({type:'pair',token});
 const report=await w.send({type:'debug-report'});
 assert.equal(report.ok,true);assert.equal(report.report.connectionMode,'MANUAL_TOKEN_NO_AUTOMATIC_WAKE');
 assert.equal(report.report.hasSessionCredential,true);assert.equal(report.report.limits.nativeTimeoutMs,45000);
 assert.ok(report.report.events.some(e=>e.code==='REQUEST_OK'));noToken(report);noToken(w.local);
 const before=w.calls.native.length;await w.send({type:'debug-probe'});assert.equal(w.calls.native.length,before);
 const rejected=await w.send({type:'debug-report'},{id:'b'.repeat(32),url:extensionURL+'explorer.html'});assert.equal(rejected,undefined);
});
test('diagnostic journal is bounded and UI messages cannot inject raw data',async()=>{
 const w=worker();
 for(let i=0;i<205;i++)await w.send({type:'debug-ui-error',code:token});
 const result=await w.send({type:'debug-report'});assert.equal(result.report.events.length,200);
 assert.ok(result.report.events.every(e=>e.code==='UI_SCRIPT_ERROR'));noToken(result);
});
let failures = 0;
for (const {name, run} of tests) {
  try { await run(); process.stdout.write(`PASS ${name}\n`); }
  catch (error) { failures++; process.stderr.write(`FAIL ${name}\n${error.stack}\n`); }
}
process.stdout.write(`${tests.length - failures}/${tests.length} worker contract tests passed (Node VM; Chrome runtime NOT_RUN).\n`);
if (failures) process.exitCode = 1;
