// Opt-in, page-local measurements. Never exports URLs, titles, keys typed or content.
(() => {
  const env=window,clock=()=>env.performance.now(),CAPACITY=240,MAX_MS=30000;
  const samples=[],observers=[],listeners=[],paintJobs=new Set();
  const noop=()=>{};
  let active=false,frame=0,loop=0,deadline=0,generation=0,lastFrame=0,due=0,dropped=0,started=null,stopped=0;
  const supported={},totals={},scenarios=new Map();let startedUTC=null;
  const round=value=>Math.round(value*100)/100;
  const label=value=>typeof value==='string' && /^[a-zA-Z0-9_.:-]{1,64}$/.test(value)?value:'custom';
  const visible=()=>!env.document.hidden;
  function record(type,name,duration,extra={}){
    if(!active || !Number.isFinite(duration))return;
    const sample={type,name:label(name),at_ms:round(clock()-started),duration_ms:round(Math.max(0,duration)),...extra};
    totals[type]=(totals[type] || 0)+1;
    const sameType=samples.filter(item=>item.type===type);
    if(sameType.length>=60){samples.splice(samples.indexOf(sameType[0]),1);dropped++;}
    else if(samples.length===CAPACITY){const discard=samples.findIndex(item=>['frame','loop','resource'].includes(item.type));samples.splice(discard<0?0:discard,1);dropped++;}
    samples.push(sample);
  }
  function begin(name){
    if(!active)return noop;
    const at=clock(),epoch=generation;let ended=false;
    return ()=>{if(ended || epoch!==generation)return;ended=true;record('span',name,clock()-at);};
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
    stopped=clock();active=false;generation++;
    env.cancelAnimationFrame(frame);env.clearTimeout(loop);env.clearTimeout(deadline);frame=loop=deadline=0;
    for(const observer of observers)observer.disconnect();observers.length=0;
    for(const remove of listeners)remove();listeners.length=0;
    for(const job of [...paintJobs])job.finish('cancelled');
    return snapshot();
  }
  function clear(){samples.length=0;dropped=0;for(const key of Object.keys(totals))delete totals[key];}
  function start({durationMs=10000}={}){
    stop();clear();for(const key of Object.keys(supported))delete supported[key];
    active=true;generation++;const epoch=generation;started=clock();startedUTC=new Date().toISOString();stopped=0;lastFrame=0;
    const duration=Math.max(250,Math.min(MAX_MS,Number(durationMs) || 10000));
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
    const heartbeat=()=>{if(!active || epoch!==generation)return;if(visible())record('loop','timer-drift',Math.max(0,clock()-due));due=clock()+50;loop=env.setTimeout(heartbeat,50);};
    loop=env.setTimeout(heartbeat,50);
    listen('visibilitychange',()=>{lastFrame=0;due=clock()+50;},true);
    for(const type of ['pointerdown','keydown','wheel'])listen(type,event=>{
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
  function snapshot(){
    const doc=env.document,count=selector=>doc.querySelectorAll(selector).length;
    return {schema:'atlas.performance.v1',active,started_at_utc:startedUTC,elapsed_ms:started===null?0:round((active?clock():stopped || clock())-started),visibility:doc.hidden?'hidden':'visible',support:{...supported},sample_limit:CAPACITY,dropped_samples:dropped,totals:{...totals},summary:summary(),samples:samples.map(item=>({...item})),dom:{mounted_cards:count('#pins .pin'),open_dialogs:count('dialog[open]'),loading_images:[...doc.querySelectorAll('img')].filter(img=>!img.complete).length,scroll_locked:doc.documentElement.hasAttribute('data-pin-open')}};
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
  const api={start,stop,clear,snapshot,check,probe,begin,afterPaint,
    isActive:()=>active,
    register(name,fn){if(typeof fn!=='function')throw Error('SCENARIO_HANDLER_REQUIRED');scenarios.set(label(name),fn);},
    async run(name,options={}){if(!active)throw Error('PERFORMANCE_CAPTURE_NOT_ACTIVE');const action=scenarios.get(name);if(!action)throw Error('PERFORMANCE_SCENARIO_UNAVAILABLE');const end=begin('scenario.'+name);try{return await action(options,api);}finally{end();}}
  };
  env.atlasDebug ||= {};
  env.atlasDebug.performance=api;
  if(new URL(env.location.href).searchParams.get('debugPerformance')==='1')start({durationMs:30000});
})();
