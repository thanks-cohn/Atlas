// One existing control set, disclosed by hover/click/focus; no cloned UI state.
const menu=document.getElementById('board-menu');
const summary=menu.querySelector('summary');
let closeTimer;
const cancel=()=>{clearTimeout(closeTimer);closeTimer=undefined;};
function close(){cancel();menu.open=false;}
function schedule(){cancel();closeTimer=setTimeout(()=>{closeTimer=undefined;if(!menu.contains(document.activeElement) && !menu.matches(':hover'))menu.open=false;},2000);}
menu.addEventListener('pointerenter',event=>{if(event.pointerType==='touch')return;cancel();menu.open=true;});
menu.addEventListener('pointerleave',event=>{if(event.pointerType!=='touch')schedule();});
menu.addEventListener('focusin',cancel);
menu.addEventListener('focusout',schedule);
menu.addEventListener('toggle',()=>{summary.setAttribute('aria-expanded',String(menu.open));if(!menu.open)cancel();});
menu.addEventListener('keydown',event=>{if(event.key==='Escape' && menu.open){event.preventDefault();event.stopPropagation();close();summary.focus();}});
document.addEventListener('pointerdown',event=>{if(menu.open && !menu.contains(event.target))close();});
summary.setAttribute('aria-expanded',String(menu.open));
