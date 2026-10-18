import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync('extension/pinboard-appearance.js','utf8');
const key='atlas.pinboard.appearance.v1';
function mount(saved){
 const attrs={},choice={value:'light'},message={hidden:true},data={[key]:saved,'atlas.pinboard.settings.v1':{limit:24}},listeners=[];let fail=false;
 const chrome={storage:{local:{get:async()=>({...data}),set:async values=>{if(fail)throw Error('Quota');Object.assign(data,values);}},onChanged:{addListener:fn=>listeners.push(fn)}}};
 vm.runInNewContext(source,{chrome,document:{documentElement:{setAttribute:(k,v)=>attrs[k]=v},getElementById:id=>id==='board-appearance'?choice:message}});
 return {attrs,choice,message,data,change:(value,area='local')=>listeners.forEach(fn=>fn({[key]:{newValue:value}},area)),fail:()=>fail=true};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const first=mount(undefined);await tick();assert.equal(first.choice.value,'light');
first.choice.value='dark';await first.choice.onchange();assert.equal(first.attrs['data-board-appearance'],'dark');assert.equal(first.data[key],'dark');assert.equal(first.data['atlas.pinboard.settings.v1'].limit,24);
const second=mount(first.data[key]);await tick();assert.equal(second.attrs['data-board-appearance'],'dark');
second.change('light','sync');assert.equal(second.choice.value,'dark');second.change('light');assert.equal(second.choice.value,'light');second.change('invalid');assert.equal(second.choice.value,'light');
second.fail();second.choice.value='dark';await second.choice.onchange();assert.equal(second.choice.value,'dark');assert.equal(second.message.hidden,false);assert.equal(second.choice.disabled,false);
const race=mount('dark');race.choice.value='light';await race.choice.onchange();await tick();assert.equal(race.choice.value,'light','Late initial reads must not overwrite the user choice');
const html=readFileSync('extension/pinboard.html','utf8'),css=readFileSync('extension/pinboard.css','utf8');assert.match(html,/id="board-appearance"/);assert.match(html,/src="pinboard-appearance.js"/);assert.match(css,/color-scheme:dark/);assert.match(css,/--board-accent:#66dce8/);assert.ok(!source.includes('runtime.sendMessage'));
console.log('PASS: theme restore, immediate changes, independent persistence, cross-tab updates, failure recovery and initial-load race. No companion required; real Chrome visual acceptance remains separate.');
