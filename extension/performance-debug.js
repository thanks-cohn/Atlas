// Opt-in, page-local measurements. Never exports URLs, titles, keys typed or content.
(() => {
  const env=window,clock=()=>env.performance.now(),CAPACITY=240,MAX_MS=30000;
  const samples=[],observers=[],listeners=[],paintJobs=new Set(),timeline=[];
  let soakMode=false,lastHealthAt=0,intervalHealth={};
  const noop=()=>{};
  let scenarioRunning=false;
  let active=false,frame=0,loop=0,deadline=0,generation=0,lastFrame=0,due=0,dropped=0,started=null,stopped=0;
  const supported={},totals={},scenarios=new Map(),measurements=new Map(),stateReaders=new Map();let startedUTC=null;
  const round=value=>Math.round(value*100)/100;
  const label=value=>typeof value==='string' && /^[a-zA-Z0-9_.:-]{1,64}$/.test(value)?value:'custom';
  const visible=()=>!env.document.hidden;
  function record(type,name,duration,extra={}){
    if(!active || !Number.isFinite(duration))return;
    const sample={type,name:label(name),at_ms:round(clock()-started),duration_ms:round(Math.max(0,duration)),...extra};
    totals[type]=(totals[type] || 0)+1;
    if(soakMode){
      if(type==='longtask'){intervalHealth.long_tasks=(intervalHealth.long_tasks || 0)+1;intervalHealth.long_task_max_ms=Math.max(intervalHealth.long_task_max_ms || 0,duration);}
      if(type==='input' && extra.trusted)intervalHealth.input_queue_max_ms=Math.max(intervalHealth.input_queue_max_ms || 0,duration);
      if(type==='loop')intervalHealth.timer_drift_max_ms=Math.max(intervalHealth.timer_drift_max_ms || 0,duration);
    }
    const sameType=samples.filter(item=>item.type===type);
    if(sameType.length>=60){samples.splice(samples.indexOf(sameType[0]),1);dropped++;}
    else if(samples.length===CAPACITY){const discard=samples.findIndex(item=>['frame','loop','resource'].includes(item.type));samples.splice(discard<0?0:discard,1);dropped++;}
    samples.push(sample);
  }
  function begin(name){
    if(!active)return noop;
    const at=clock(),epoch=generation;let ended=false;
    return ()=>{if(ended || epoch!==generation)return;ended=true;const duration=clock()-at;measure('time.'+label(name),duration);record('span',name,duration);};
  }
  function afterPaint(name='paint.opportunity'){
    if(!active)return Promise.resolve({status:'inactive'});
    if(!visible())return Promise.resolve({status:'hidden'});
    if(paintJobs.size>=8){totals.coalesced_paint_jobs=(totals.coalesced_paint_jobs || 0)+1;return Promise.resolve({status:'coalesced'});}
    const at=clock(),epoch=generation;
    return new Promise(resolve=>{
      const job={first:0,second:0,timeout:0,finish:null};
      job.finish=status=>{
        if(!paintJobs.delete(job))return;
        env.cancelAnimationFrame(job.first);env.cancelAnimationFrame(job.second);env.clearTimeout(job.timeout);
        if(epoch===generation && status!=='cancelled')record('paint',name,clock()-at,{status});
        resolve({status,duration_ms:round(clock()-at)});
      };
      paintJobs.add(job);
      job.first=env.requestAnimationFrame(()=>{job.second=env.requestAnimationFrame(()=>job.finish(visible()?'opportunity':'hidden'));});
      job.timeout=env.setTimeout(()=>job.finish('timeout'),1000);
    });
  }
  function listen(name,handler,options){env.addEventListener(name,handler,options);listeners.push(()=>env.removeEventListener(name,handler,options));}
  function observe(type,options,consume){
    supported[type]=Boolean(env.PerformanceObserver?.supportedEntryTypes?.includes(type));
    if(!supported[type])return;
    const epoch=generation;
    try{const observer=new env.PerformanceObserver(list=>{if(active && epoch===generation && visible())for(const item of list.getEntries())consume(item);});observer.observe({type,...options});observers.push(observer);}catch{supported[type]=false;}
  }
  function stop(){
    if(!active)return snapshot();
    if(soakMode && visible() && clock()>lastHealthAt)sampleHealth();
    stopped=clock();active=false;generation++;
    env.cancelAnimationFrame(frame);env.clearTimeout(loop);env.clearTimeout(deadline);frame=loop=deadline=0;
    for(const observer of observers)observer.disconnect();observers.length=0;
    for(const remove of listeners)remove();listeners.length=0;
    for(const job of [...paintJobs])job.finish('cancelled');
    return snapshot();
  }
  function clear(){timeline.length=0;intervalHealth={};measurements.clear();samples.length=0;dropped=0;for(const key of Object.keys(totals))delete totals[key];}
  function start({durationMs=10000,soak=false}={}){
    stop();clear();for(const key of Object.keys(supported))delete supported[key];
    active=true;generation++;const epoch=generation;started=clock();startedUTC=new Date().toISOString();stopped=0;lastFrame=0;
    soakMode=soak===true;lastHealthAt=clock();
    const duration=Math.max(250,Math.min(soakMode?600000:MAX_MS,Number(durationMs) || 10000));
    if(soakMode)sampleHealth();
    observe('longtask',{},entry=>record('longtask','main-thread',entry.duration));
    observe('event',{durationThreshold:16},entry=>record('event','browser-input',entry.duration,{queue_ms:round(Math.max(0,entry.processingStart-entry.startTime)),handler_ms:round(Math.max(0,entry.processingEnd-entry.processingStart))}));
    observe('layout-shift',{},entry=>{if(!entry.hadRecentInput)record('layout','shift',0,{value:entry.value});});
    observe('resource',{},entry=>record('resource',['img','fetch','xmlhttprequest'].includes(entry.initiatorType)?entry.initiatorType:'other',entry.duration));
    const tick=timestamp=>{
      if(!active || epoch!==generation)return;
      if(visible()){if(lastFrame)record('frame','gap',timestamp-lastFrame);lastFrame=timestamp;}else lastFrame=0;
      frame=env.requestAnimationFrame(tick);
    };
    frame=env.requestAnimationFrame(tick);
    due=clock()+50;
    const heartbeat=()=>{if(!active || epoch!==generation)return;if(visible()){record('loop','timer-drift',Math.max(0,clock()-due));if(soakMode && clock()-lastHealthAt>=5000)sampleHealth();}due=clock()+50;loop=env.setTimeout(heartbeat,50);};
    loop=env.setTimeout(heartbeat,50);
    listen('visibilitychange',()=>{lastFrame=0;due=clock()+50;},true);
    for(const type of ['pointerdown','click','keydown','wheel'])listen(type,event=>{
      if(!visible())return;
      const eventAt=Number(event.timeStamp),lag=clock()-eventAt;
      if(Number.isFinite(eventAt) && lag>=0 && lag<60000)record('input',type,lag,{trusted:event.isTrusted===true});
      afterPaint('input.'+type).then(noop);
    },{capture:true,passive:true});
    listen('error',()=>record('error','script-error',0));
    listen('unhandledrejection',()=>record('error','unhandled-rejection',0));
    listen('pagehide',stop);
    deadline=env.setTimeout(stop,duration);
    return {schema:'atlas.performance.v1',active:true,duration_ms:duration,max_samples:CAPACITY};
  }
  function summary(){
    const groups={};
    for(const item of samples){const key=item.type+':'+item.name;(groups[key] ||= []).push(item.duration_ms);}
    return Object.fromEntries(Object.entries(groups).map(([name,values])=>{
      values.sort((a,b)=>a-b);const percentile=q=>values[Math.min(values.length-1,Math.ceil(values.length*q)-1)];
      return [name,{retained_count:values.length,p50_ms:percentile(.5),p95_ms:percentile(.95),max_ms:values.at(-1)}];
    }));
  }
  function measure(name,value){
    if(!active || !Number.isFinite(value))return;
    const key=label(name);if(!measurements.has(key) && measurements.size>=32)return;
    const prior=measurements.get(key) || {count:0,sum:0,min:value,max:value,last:value};
    prior.count++;prior.sum+=value;prior.min=Math.min(prior.min,value);prior.max=Math.max(prior.max,value);prior.last=value;measurements.set(key,prior);
  }
  function applicationState(){
    const result={};for(const [name,read] of stateReaders){try{const value=read(),safe={};for(const [key,item] of Object.entries(value || {}).slice(0,32))if(/^[a-zA-Z0-9_.:-]{1,64}$/.test(key) && (typeof item==='boolean' || Number.isFinite(item)))safe[key]=item;result[name]=safe;}catch{result[name]={unavailable:true};}}return result;
  }
  function sampleHealth(){
    const doc=env.document,count=selector=>doc.querySelectorAll(selector).length;
    const pixels=[...doc.querySelectorAll('img')].reduce((sum,img)=>sum+(img.naturalWidth || 0)*(img.naturalHeight || 0),0);
    const heap=env.performance.memory?.usedJSHeapSize;
    const entry={at_ms:round(clock()-started),mounted_cards:count('#pins .pin'),total_elements:count('*'),image_elements:count('img'),tag_buttons:count('#tag-field button'),known_image_pixels:pixels,js_heap_bytes:Number.isFinite(heap)?heap:null,application:applicationState(),...intervalHealth};
    // Keep the initial baseline plus the latest59 points, never unlimited history.
    if(timeline.length>=60)timeline.splice(1,1);timeline.push(entry);intervalHealth={};lastHealthAt=clock();
  }
  function snapshot(){
    const doc=env.document,count=selector=>doc.querySelectorAll(selector).length;
    return {schema:'atlas.performance.v1',active,mode:soakMode?'soak':'capture',timeline:timeline.map(item=>({...item,application:JSON.parse(JSON.stringify(item.application))})),started_at_utc:startedUTC,elapsed_ms:started===null?0:round((active?clock():stopped || clock())-started),visibility:doc.hidden?'hidden':'visible',support:{...supported},sample_limit:CAPACITY,dropped_samples:dropped,totals:{...totals},summary:summary(),samples:samples.map(item=>({...item})),measurements:Object.fromEntries([...measurements].map(([key,value])=>[key,{...value,mean:round(value.sum/value.count)}])),application:applicationState(),dom:{total_elements:count('*'),image_elements:count('img'),tag_buttons:count('#tag-field button'),mounted_cards:count('#pins .pin'),open_dialogs:count('dialog[open]'),loading_images:[...doc.querySelectorAll('img')].filter(img=>!img.complete).length,scroll_locked:doc.documentElement.hasAttribute('data-pin-open')}};
  }
  function check({frameGapMs=50,inputMs=100,loopDriftMs=100,interactionMs=100}={}){
    const report=snapshot(),rules=[];
    const rule=(name,items,limit)=>rules.push({name,limit_ms:limit,observations:items.length,max_ms:items.length?Math.max(...items.map(item=>item.duration_ms)):null,status:!items.length?'insufficient-data':items.some(item=>item.duration_ms>limit)?'over-budget':'within-budget'});
    rule('frame-gaps',samples.filter(item=>item.type==='frame'),frameGapMs);
    rule('trusted-input-queue',samples.filter(item=>item.type==='input' && item.trusted),inputMs);
    rule('event-loop-drift',samples.filter(item=>item.type==='loop'),loopDriftMs);
    rule('preview-open-close',samples.filter(item=>item.type==='paint' && ['preview.open','preview.close'].includes(item.name) && item.status!=='hidden'),interactionMs);
    return {schema:report.schema,active,retained_window_only:true,dropped_samples:dropped,capabilities:report.support,rules};
  }
  async function probe({durationMs=2000}={}){
    const config=start({durationMs});await new Promise(resolve=>env.setTimeout(resolve,config.duration_ms));return stop();
  }
  const api={start,stop,clear,snapshot,check,probe,begin,afterPaint,measure,
    soak:({durationMs=300000}={})=>start({durationMs,soak:true}),
    registerState(name,read){if(typeof read!=='function')throw Error('STATE_READER_REQUIRED');if(stateReaders.size>=8 && !stateReaders.has(label(name)))throw Error('STATE_READER_LIMIT');stateReaders.set(label(name),read);},
    isActive:()=>active,
    register(name,fn){if(typeof fn!=='function')throw Error('SCENARIO_HANDLER_REQUIRED');scenarios.set(label(name),fn);},
    async run(name,options={}){if(!active)throw Error('PERFORMANCE_CAPTURE_NOT_ACTIVE');if(scenarioRunning)throw Error('PERFORMANCE_SCENARIO_BUSY');const action=scenarios.get(name);if(!action)throw Error('PERFORMANCE_SCENARIO_UNAVAILABLE');const epoch=generation,end=begin('scenario.'+name);scenarioRunning=true;const scoped={...api,isActive:()=>active && epoch===generation,afterPaint:name=>epoch===generation?afterPaint(name):Promise.resolve({status:'cancelled'})};try{return await action(options,scoped);}finally{scenarioRunning=false;end();}}
  };
  function installControls(){
    const doc=env.document,recordButton=doc.getElementById?.('performance-record'),copyButton=doc.getElementById?.('performance-copy'),status=doc.getElementById?.('performance-status');
    if(!recordButton || !copyButton || !status)return;
    recordButton.onclick=()=>{const output=doc.getElementById?.('performance-report');if(output){output.value='';output.hidden=true;}api.soak();status.textContent='Recording for up to five minutes. Reproduce the lag, then click Copy lag report.';};
    copyButton.onclick=async()=>{
      const report=api.stop();
      try{await env.navigator.clipboard.writeText(JSON.stringify(report,null,2));status.textContent='Lag report copied. Paste it into your bug report.';}
      catch{const output=doc.getElementById?.('performance-report');if(output){output.value=JSON.stringify(report,null,2);output.hidden=false;output.focus?.();output.select?.();status.textContent='Clipboard unavailable. Copy the selected report below.';}else status.textContent='Clipboard unavailable. Use atlasDebug.performance.snapshot() in the console.';}
    };
  }
  if(env.document.readyState==='loading')env.document.addEventListener('DOMContentLoaded',installControls,{once:true});else installControls();
  env.atlasDebug ||= {};
  env.atlasDebug.performance=api;
  if(new URL(env.location.href).searchParams.get('debugPerformance')==='1')start({durationMs:30000});
})();
