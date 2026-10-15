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
  const stub = {
    calls, session,
    response: {ok: true, status: 200, body: {ok: true, protocol: 'atlas.local.v1', status: 'ready'}},
    nativeResult: {ok: true, protocol: 'atlas.local.v1', port: 17892, token},
    fetchFailure: null,
  };
  const chrome = {
    runtime: {
      id: extensionId,
      getURL: path => extensionURL + path,
      onMessage: {addListener: callback => { listener = callback; }},
      sendNativeMessage: async (host, message) => {
        calls.native.push({host, message: clone(message)});
        return clone(stub.nativeResult);
      },
    },
    action: {onClicked: {addListener: callback => { stub.click = callback; }}},
    tabs: {create: value => calls.tabs.push(clone(value))},
    sidePanel: {open: async value => { calls.panels.push(clone(value)); if (stub.panelFailure) throw new Error('Side panel unavailable'); }},
    storage: {session: {
      setAccessLevel: async value => calls.access.push(clone(value)),
      set: async value => { calls.writes.push(clone(value)); Object.assign(session, clone(value)); },
      get: async key => ({[key]: session[key]}),
      remove: async key => { calls.removes.push(key); delete session[key]; },
    }},
  };
  const context = vm.createContext({chrome, AbortSignal, fetch: async (url, options) => {
    calls.fetch.push({url, options: clone(options)});
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
    assert.equal(w.calls.writes.length, 0);
    noToken(result);
  }
});

test('manual pairing rejects invalid credential lengths without network access', async () => {
  const w = worker();
  for (const bad of [null, 123, '', 'short', 'x'.repeat(1025)]) {
    assert.equal((await w.send({type: 'pair', token: bad})).ok, false);
  }
  assert.equal(w.calls.fetch.length, 0);
  assert.equal(w.calls.writes.length, 0);
});

test('native pairing rejects incompatible protocol, port and malformed results', async () => {
  for (const change of [{protocol: 'atlas.local.v0'}, {port: 80}, {port: '17892'}, {token: null}, {ok: false}]) {
    const w = worker();
    Object.assign(w.nativeResult, change);
    const result = await w.send({type: 'native-connect'});
    assert.equal(result.ok, false);
    assert.equal(w.calls.fetch.length, 0);
    assert.equal(w.calls.writes.length, 0);
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
  assert.deepEqual(rejected.session, {});
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
  assert.deepEqual(w.calls.removes, ['token']);
  assert.deepEqual(await w.send({type: 'state'}), {ok: true, paired: false});
  assert.equal((await w.send({type: 'api', path: '/v1/grants'})).ok, false);
  assert.equal(w.calls.fetch.length, 0);
});

let failures = 0;
for (const {name, run} of tests) {
  try { await run(); process.stdout.write(`PASS ${name}\n`); }
  catch (error) { failures++; process.stderr.write(`FAIL ${name}\n${error.stack}\n`); }
}
process.stdout.write(`${tests.length - failures}/${tests.length} worker contract tests passed (Node VM; Chrome runtime NOT_RUN).\n`);
if (failures) process.exitCode = 1;
