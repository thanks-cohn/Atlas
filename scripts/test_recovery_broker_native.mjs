#!/usr/bin/env node
/** Shipped worker decisions + actual Linux native frames/proof/HTTP processes.
 * Chrome runtime is NOT_RUN. The runtime adapter supplies Chrome's Origin header,
 * and a test-only Popen observer records precisely the disposable helper PIDs.
 */
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn,execFileSync} from 'node:child_process';
import vm from 'node:vm';
import net from 'node:net';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temp=await mkdtemp(path.join(tmpdir(),'atlas-worker-native-'));
const env={...process.env,PYTHONPATH:path.join(root,'src')};
const python=process.env.PYTHON||'python';
const extension='a'.repeat(32),origin=`chrome-extension://${extension}`;
const state=path.join(temp,'state'),config=path.join(temp,'native.json'),pids=path.join(temp,'children.txt');
const code=await readFile(path.join(root,'extension/background.js'),'utf8');
const local={};let nativeCalls=0,loseMutationResponse=false;
const setup=`import json,sys\nfrom pathlib import Path\nfrom atlas_companion.state import State\np=Path(sys.argv[1]);f=p/'files';f.mkdir();(f/'target').mkdir();(f/'source.txt').write_bytes(b'recovery-proof-bytes');s=State(p/'state');g=s.grant(str(f),'Recovery fixture',True);s.pair('a'*32);(p/'native.json').write_text(json.dumps({'extension_id':'a'*32,'state_dir':str(p/'state')}));print(g)`;
const observer=`import os,sys,subprocess\nfrom atlas_native import __main__ as host\noriginal=subprocess.Popen\ndef launch(*a,**kw):\n p=original(*a,**kw)\n with open(os.environ['ATLAS_TEST_PID_LOG'],'a') as f:f.write(str(p.pid)+'\\n')\n return p\nsubprocess.Popen=launch\nraise SystemExit(host.main())`;
async function nativeMessage(message,id=extension){
 nativeCalls++;
 const payload=Buffer.from(JSON.stringify(message)),header=Buffer.alloc(4);header.writeUInt32LE(payload.length);
 return new Promise((resolve,reject)=>{const proc=spawn(python,['-c',observer,config,`chrome-extension://${id}/`],{env:{...env,ATLAS_TEST_PID_LOG:pids},stdio:['pipe','pipe','pipe']});const output=[];proc.stdout.on('data',data=>output.push(data));proc.stderr.resume();proc.on('error',reject);proc.on('close',()=>{try{const bytes=Buffer.concat(output);assert.ok(bytes.length>=4);const size=bytes.readUInt32LE(0);assert.equal(bytes.length,size+4);resolve(JSON.parse(bytes.subarray(4).toString()));}catch(error){reject(error);}});proc.stdin.end(Buffer.concat([header,payload]));});
}
function worker(id=extension){
 let listener;const session={};
 const storage=target=>({get:async key=>({[key]:target[key]}),set:async values=>Object.assign(target,values),remove:async key=>delete target[key],setAccessLevel:async()=>{}});
 const chrome={runtime:{id,getURL:p=>`chrome-extension://${id}/`+p,onMessage:{addListener:fn=>listener=fn},onStartup:{addListener:()=>{}},sendNativeMessage:(_host,message)=>nativeMessage(message,id)},storage:{local:storage(local),session:storage(session)},action:{onClicked:{addListener:()=>{}}}};
 vm.runInNewContext(code,{chrome,AbortSignal,setTimeout,clearTimeout,fetch:async(url,options)=>{const response=await fetch(url,{...options,headers:{...options.headers,Origin:`chrome-extension://${id}`}});if(loseMutationResponse&&url.endsWith('/v1/operate')){loseMutationResponse=false;await response.arrayBuffer();throw new Error('Injected lost response after actual mutation');}return response;}});
 return {session,send:message=>new Promise(resolve=>listener(message,{id,url:`chrome-extension://${id}/explorer.html`},resolve))};
}
async function children(){try{return (await readFile(pids,'utf8')).trim().split('\n').filter(Boolean).map(Number);}catch{return [];}}
async function killFixtureHelpers(){for(const pid of await children()){try{const argv=(await readFile(`/proc/${pid}/cmdline`,'utf8')).split('\0');if(argv.includes(state)&&argv.includes('serve'))process.kill(pid,'SIGKILL');}catch{}}await new Promise(resolve=>setTimeout(resolve,80));}
try{
 await new Promise((resolve,reject)=>{const probe=net.createServer();probe.once('error',()=>reject(new Error('Port17892 occupied: run recovery integration when it is free.')));probe.listen(17892,'127.0.0.1',()=>probe.close(resolve));});
 const grant=execFileSync(python,['-c',setup,temp],{env,encoding:'utf8'}).trim();
 const first=worker();assert.equal((await first.send({type:'ensure-ready'})).paired,false);assert.equal(nativeCalls,0);
 assert.equal((await first.send({type:'native-connect'})).ok,true);assert.equal(local.nativeEnrolled,true);assert.equal(Object.keys(local).join(','),'nativeEnrolled');
 assert.ok(first.session.token);const originalToken=first.session.token;
 assert.equal((await first.send({type:'api',path:'/v1/list',body:{grant,path:''}})).entries.length,2);
 console.log('PASS first explicit native enrollment: actual framed host wakes and proves real helper; local storage contains boolean only');
 const returning=worker();assert.equal(returning.session.token,undefined);assert.equal((await returning.send({type:'ensure-ready'})).paired,true);assert.notEqual(returning.session.token,originalToken);
 console.log('PASS returning fresh worker/browser-session model: remembered authorization obtains rotated session-only token without prompt');
 await killFixtureHelpers();const before=nativeCalls;
 const recovered=await returning.send({type:'api',path:'/v1/list',body:{grant,path:''}});assert.equal(recovered.ok,true);assert.equal(recovered.entries.length,2);assert.equal(nativeCalls,before+1);
 console.log('PASS helper SIGKILL: read reconnects through actual native host and retries once with same durable grant');
 await killFixtureHelpers();const preflightBefore=nativeCalls;
 const prepared=await returning.send({type:'api',path:'/v1/operate',body:{id:'preflight-recovery-copy-0001',action:'copy',sources:[{grant,path:'source.txt'}],destination:{grant,path:'target'},name:'before-loss.txt'}});
 assert.equal(prepared.receipt.status,'completed');assert.equal(nativeCalls,preflightBefore+1);assert.equal((await readFile(path.join(temp,'files/target/before-loss.txt'))).toString(),'recovery-proof-bytes');
 console.log('PASS already-dead helper before mutation: authenticated readiness wake, then exactly one mutation submission');
 loseMutationResponse=true;const mutationBefore=nativeCalls;
 const result=await returning.send({type:'api',path:'/v1/operate',body:{id:'test-unknown-mutation-0001',action:'copy',sources:[{grant,path:'source.txt'}],destination:{grant,path:'target'}}});
 assert.equal(result.error.code,'OUTCOME_UNKNOWN');assert.equal(nativeCalls,mutationBefore);assert.equal((await readFile(path.join(temp,'files/target/source.txt'))).toString(),'recovery-proof-bytes');
 assert.equal(returning.session.lifecycleState,'OUTCOME_UNKNOWN');
 const history=await returning.send({type:'api',path:'/v1/receipts'});assert.equal(history.receipts.filter(r=>r.id==='test-unknown-mutation-0001').length,1);
 assert.equal(returning.session.lifecycleState,'READY');assert.equal(returning.session.unknownOperation,undefined);
 console.log('PASS lost actual mutation response: byte-exact effect once, OUTCOME_UNKNOWN, zero reconnect/replay, one durable receipt');
 execFileSync(python,['-c','import sys;from atlas_companion.state import State;State(sys.argv[1]).revoke_grant(sys.argv[2])',state,grant],{env});
 await killFixtureHelpers();assert.equal((await returning.send({type:'api',path:'/v1/list',body:{grant,path:''}})).ok,false);
 console.log('PASS revoked grant remains denied after native demand wake');
 const changed=worker('b'.repeat(32));assert.equal((await changed.send({type:'ensure-ready'})).error.code,'NEEDS_PAIRING');assert.equal(changed.session.token,undefined);
 console.log('PASS changed extension identity cannot inherit enrollment credentials');
 console.log('NOT_RUN actual Chrome MV3 callbacks / native registration / OS sleep and reboot');
}finally{await killFixtureHelpers();await rm(temp,{recursive:true,force:true});}
