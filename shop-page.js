(()=>{'use strict';const status=document.getElementById('shopStatus');let started=false;
function show(tab){for(const button of document.querySelectorAll('[data-shop-tab]'))button.setAttribute('aria-selected',String(button.dataset.shopTab===tab));KBRShift.setTab(tab);}
for(const button of document.querySelectorAll('[data-shop-tab]'))button.onclick=()=>show(button.dataset.shopTab);
async function start(){if(!KBRCloud.requireLogin())return;try{if(!['owner','operator'].includes(await KBRCloud.role()))throw Error('Staff login required.');show('shop');await KBRShift.refresh();status.textContent='Shop shifts and cash records sync with the ordering app.';if(!started){started=true;setInterval(()=>{if(!document.hidden)KBRShift.refresh();},3000);}}catch(error){status.textContent=error.message;}}start();
})();
