(()=>{'use strict';
const status=document.getElementById('shopStatus');
const panel=document.getElementById('shiftPanel');
const tiles=document.getElementById('shiftTiles');
let started=false,owner=false;
function updateTiles(){
 const state=KBRShift.snapshot(),shift=state.shift,loaded=state.loaded;
 const shop=document.getElementById('shopTile');
 shop.classList.toggle('is-open',!!shift);
 const shopIcon=document.getElementById('shopIcon');const iconSrc=shift?'icons/shop-open.png':'icons/shop-closed.png';if(!shopIcon.getAttribute('src')?.endsWith(iconSrc)){shopIcon.hidden=false;shopIcon.src=iconSrc;}
 shop.querySelector('.tile-label').textContent=!loaded?'Loading shop…':shift?'Close Shop':'Open Shop';
 shop.querySelector('.tile-details').textContent=!loaded?'Loading…':shift?'Shop is currently open':'Open the shop for the next shift';
 document.getElementById('correctOpeningTile').hidden=!owner;
 document.getElementById('recordsTile').hidden=!owner;
 for(const tile of tiles.querySelectorAll('.shift-tile')){
  const kind=tile.dataset.shiftAction||tile.dataset.shiftView;
  const requiresOpen=kind!=='toggle-shop'&&kind!=='history';
  const restricted=(kind==='correct-opening'||kind==='history')&&!owner;
  tile.disabled=!loaded||(requiresOpen&&!shift)||restricted;
 }
}
async function show(tab){
 tiles.hidden=true;panel.hidden=false;
 KBRShift.setTab(tab);
 await KBRShift.refresh();
 updateTiles();
}
async function run(kind){
 const state=KBRShift.snapshot();
 if(!state.loaded)return;
 if(kind==='toggle-shop'){await KBRShift.action(state.shift?'close':'open');return;}
 if(!state.shift)return;
 if(kind==='correct-opening'){if(owner)KBRShift.correctOpening(state.shift.id);return;}
 if(['cash-in','cash-out','handover'].includes(kind))await KBRShift.action(kind);
}
for(const button of tiles.querySelectorAll('[data-shift-action]'))button.onclick=()=>run(button.dataset.shiftAction);
for(const button of tiles.querySelectorAll('[data-shift-view]'))button.onclick=()=>show(button.dataset.shiftView);
document.getElementById('refreshCashRegistry').onclick=async()=>{await KBRShift.refresh();updateTiles();};
document.getElementById('backToTiles').onclick=()=>{panel.hidden=true;tiles.hidden=false;updateTiles();};
new MutationObserver(updateTiles).observe(document.getElementById('baristaShiftView'),{childList:true});
async function start(){
 if(!KBRCloud.requireLogin())return;
 try{
  const role=await KBRCloud.role();
  if(!['owner','operator'].includes(role))throw Error('Staff login required.');
  owner=role==='owner';KBRShift.setOwnerAccess(owner);KBRShift.setTab('cash');
  await KBRShift.refresh();updateTiles();
  status.textContent=KBRShift.snapshot().loaded?'Choose an action from the tiles.':'Unable to load shop status. Refresh or reopen this page.';
  if(!started){
   started=true;let lastResumeRefresh=0;
   const refreshOnReturn=()=>{
    if(document.hidden)return;
    const now=Date.now();if(now-lastResumeRefresh<5000)return;
    lastResumeRefresh=now;
    KBRShift.refresh().then(updateTiles);
   };
   window.addEventListener('focus',refreshOnReturn);
   document.addEventListener('visibilitychange',refreshOnReturn);
  }
 }catch(error){status.textContent=error.message;}
}
start();
})();
