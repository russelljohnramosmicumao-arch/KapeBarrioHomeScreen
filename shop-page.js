(()=>{'use strict';
const status=document.getElementById('shopStatus'),panel=document.getElementById('shiftPanel'),tiles=document.getElementById('shiftTiles');let started=false;
// No background polling: refresh when this screen is opened, revisited, or after a saved drawer action.
function updateTiles(){const state=KBRShift.snapshot(),s=state.shift;document.getElementById('shopTile').classList.toggle('is-open',!!s);document.getElementById('shopIcon').src=s?'icons/shop-open.png':'icons/shop-closed.png';document.getElementById('shopLabel').textContent=state.loaded?(s?'Shop Open':'Shop Closed'):'Loading shop…';document.getElementById('shopTileDetails').innerHTML=!state.loaded?'':s?`Opened by ${escapeHtml(s.opened_name)}<b>Starting cash ${peso(s.opening_cash)}</b>`:'Tap to open the shop';document.getElementById('cashTileDetails').innerHTML=!state.loaded?'Loading…':s?`Expected cash<b>${peso(state.totals.cash)}</b>`:'Open the shop to start the registry';document.getElementById('shopTile').disabled=!state.loaded;document.getElementById('cashTile').disabled=!state.loaded;}
async function show(tab){tiles.hidden=true;panel.hidden=false;KBRShift.setTab(tab);await KBRShift.refresh();updateTiles();}
for(const button of document.querySelectorAll('[data-shop-tab]'))button.onclick=()=>show(button.dataset.shopTab);
document.getElementById('backToTiles').onclick=()=>{panel.hidden=true;tiles.hidden=false;updateTiles();};
new MutationObserver(updateTiles).observe(document.getElementById('baristaShiftView'),{childList:true});
async function start(){if(!KBRCloud.requireLogin())return;try{if(!['owner','operator'].includes(await KBRCloud.role()))throw Error('Staff login required.');KBRShift.setTab('shop');await KBRShift.refresh();updateTiles();status.textContent=KBRShift.snapshot().loaded?'Choose Shop or Cash Registry.':'Could not load shop status. Use the Update button or reopen this page to retry.';if(!started){started=true;
// Returning from another app/device can change drawer cash; refresh on return.
window.addEventListener('focus',()=>{if(!document.hidden)KBRShift.refresh();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)KBRShift.refresh();});}}catch(error){status.textContent=error.message;}}start();
})();
