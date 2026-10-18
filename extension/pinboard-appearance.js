// Presentation only. Separate storage avoids overwriting board filters or models.
const APPEARANCE_KEY='atlas.pinboard.appearance.v1';
const choice=document.getElementById('board-appearance');
const message=document.getElementById('appearance-status');
const normalize=value=>value==='dark'?'dark':'light';
let revision=0;
function apply(value){const mode=normalize(value);document.documentElement.setAttribute('data-board-appearance',mode);choice.value=mode;}
async function restore(){const current=revision;try{const saved=await chrome.storage.local.get(APPEARANCE_KEY);if(current===revision)apply(saved[APPEARANCE_KEY]);}catch{if(current===revision)apply('light');}}
choice.onchange=async()=>{
  ++revision;const mode=normalize(choice.value);apply(mode);choice.disabled=true;message.hidden=true;
  try{await chrome.storage.local.set({[APPEARANCE_KEY]:mode});}
  catch{message.textContent='Appearance could not be saved. Try again.';message.hidden=false;}
  finally{choice.disabled=false;}
};
chrome.storage.onChanged?.addListener((changes,area)=>{if(area==='local' && changes[APPEARANCE_KEY]){++revision;apply(changes[APPEARANCE_KEY].newValue);}});
restore();
