import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {createCardHold,heldMasonry}=await import('data:text/javascript;base64,'+Buffer.from(readFileSync('extension/pinboard-card-hold.js')).toString('base64'));
let now=0,id=0,released=0;const timers=new Map(),advance=ms=>{now+=ms;for(const [key,timer] of [...timers])if(timer.at<=now){timers.delete(key);timer.fn();}};
const hold=createCardHold({onRelease:()=>released++,setTimer:(fn,ms)=>{timers.set(++id,{fn,at:now+ms});return id;},clearTimer:id=>timers.delete(id)});
const nodes=Array.from({length:30},(_,id)=>({id:String(id)})),heightFor=node=>[100,220,170][Number(node.id)%3];
const baseline=heldMasonry(nodes,3,200,20,heightFor),original=baseline.positions[17];hold.hold('17',original);advance(4999);assert.equal(hold.active().length,1);hold.touch('17');advance(4999);assert.equal(released,0);advance(1);assert.equal(released,1);assert.equal(hold.active().length,0);
hold.hold('17',original);hold.hold('20',baseline.positions[20]);const ranked=[nodes[17],nodes[20],...nodes.filter(node=>!['17','20'].includes(node.id))];const layout=heldMasonry(ranked,3,200,20,heightFor,hold.active());
for(const index of [17,20]){const next=layout.positions.find(p=>p.node.id===String(index)),prior=baseline.positions[index];assert.equal(next.x,prior.x);assert.equal(next.y,prior.y);}
for(let a=0;a<layout.positions.length;a++)for(let b=a+1;b<layout.positions.length;b++){const x=layout.positions[a],y=layout.positions[b];assert.ok(!(x.x<y.x+y.width && x.x+x.width>y.x && x.y<y.y+y.height && x.y+x.height>y.y),'Cards never overlap held geometry');}
hold.clear();advance(5000);assert.equal(released,1);const normal=heldMasonry(ranked,3,200,20,heightFor);assert.equal(normal.positions[0].y,0);assert.equal(normal.positions[0].x,0);
assert.equal(heldMasonry(nodes.slice(0,1),3,200,20,heightFor,[original]).positions[0].y,0,'Filtered-out card does not leave a hole');assert.equal(heldMasonry(ranked,2,180,20,heightFor,[original]).positions[0].x,0,'Incompatible width does not reserve stale geometry');
console.log('PASS: five-second inactivity/reset/release, multiple geometry reservations, no overlap, filter/resize safety and restoration of ranked placement.');
