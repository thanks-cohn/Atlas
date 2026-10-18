// Ephemeral interaction grace. No tag/ranking/storage state is changed.
export function createCardHold({onRelease,delay=5000,setTimer=setTimeout,clearTimer=clearTimeout}){
  const held=new Map();
  function touch(id){const entry=held.get(id);if(!entry)return;clearTimer(entry.timer);entry.timer=setTimer(()=>{held.delete(id);onRelease();},delay);}
  return {hold(id,position){if(!position)return;if(!held.has(id))held.set(id,{...position});touch(id);},touch,
    active:()=>[...held].map(([id,value])=>({id,...value})),
    clear(){for(const entry of held.values())clearTimer(entry.timer);held.clear();}};
}
// Reserve the real rectangles so other ranked cards cannot overlap a held card.
export function heldMasonry(items,columns,width,gap,heightFor,reservations=[]){
  const ids=new Set(items.map(node=>node.id));
  const held=reservations.filter(item=>ids.has(item.id) && Math.abs(item.width-width)<1);
  const byId=new Map(held.map(item=>[item.id,item])),ends=Array(columns).fill(0);
  const positions=items.map((node,index)=>{
    const reserved=byId.get(node.id);if(reserved)return {...reserved,node,index};
    const height=heightFor(node),candidates=ends.map((start,column)=>{
      const x=column*(width+gap);let y=start;
      for(const obstacle of [...held].sort((a,b)=>a.y-b.y))if(x<obstacle.x+obstacle.width && x+width>obstacle.x && y<obstacle.y+obstacle.height+24 && y+height+24>obstacle.y)y=obstacle.y+obstacle.height+24;
      return {column,x,y};
    });
    const place=candidates.reduce((best,next)=>next.y<best.y?next:best);ends[place.column]=place.y+height+24;
    return {node,index,x:place.x,y:place.y,width,height};
  });
  for(const item of held)for(let column=0;column<columns;column++){const x=column*(width+gap);if(x<item.x+item.width && x+width>item.x)ends[column]=Math.max(ends[column],item.y+item.height+24);}
  return {positions,ends};
}
