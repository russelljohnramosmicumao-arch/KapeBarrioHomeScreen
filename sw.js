'use strict';
const CACHE='kbr-home-staff-order-positions-v23';
const ASSETS=["./apple-touch-icon.png","./apple-touch-icon.png?v=20261117-home","./icons/icon-192.png?v=20261117-home","./icons/icon-512.png?v=20261117-home","./shifts.js?v=tasks-then-kitchen-v20","./icons/shop-closed.png","./icons/shop-open.png","./icons/icon-192.png","./icons/icon-512.png","./manifest.json","./manager-tile.js","./page-clock.js","./","./index.html","./customer-registration.html","./clock-in.html","./barista-tasks.html","./open-end-shift.html","./sync-config.js","./sync-core.js","./sync-core.js?v=usage-sleep-v2","./sync-ui.js","./sync.css?v=cash-pane-v2","./worker-clock.js?v=staff-order-positions-v23","./shop-page.js?v=split-cash-shop-v10","./sync-login.html","./reset-password.html","./reset-password.js","./page-tools.js?v=shop-cache-recovery-20261109","./page-tools.css"];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    // A single optional image or offline resource must not abort the entire update.
    const results=await Promise.allSettled(ASSETS.map(asset=>cache.add(new Request(asset,{cache:'reload'}))));
    const required=['./open-end-shift.html','./shifts.js?v=tasks-then-kitchen-v20','./shop-page.js?v=split-cash-shop-v10','./page-tools.js?v=shop-cache-recovery-20261109'];
    const failed=required.filter(path=>!results[ASSETS.indexOf(path)]||results[ASSETS.indexOf(path)].status!=='fulfilled');
    if(failed.length)throw new Error('Critical shift files could not be cached: '+failed.join(', '));
    // Activate the repair without requiring a working old update button.
    await self.skipWaiting();
  })());
});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('kbr-home-')&&k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const u=new URL(event.request.url),scope=new URL(self.registration.scope);
 if(event.request.method!=='GET'||u.origin!==scope.origin||!u.pathname.startsWith(scope.pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const navigation=event.request.mode==='navigate';
  if(navigation){
   try{const response=await fetch(event.request,{cache:'no-store'});if(response.ok)await cache.put(event.request,response.clone());return response;}
   catch(error){
    const exact=await cache.match(event.request);if(exact)return exact;
    const clean=new URL(u);clean.search='';clean.hash='';
    const saved=await cache.match(clean.href);if(saved)return saved;
    const alias=new URL(clean.href);if(alias.pathname.endsWith('/'))alias.pathname+='index.html';else if(!/\.[a-z0-9]+$/i.test(alias.pathname))alias.pathname+='.html';
    const fallback=await cache.match(alias.href);if(fallback)return fallback;
    return new Response('<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><h2>Offline</h2><p>Open this page online once before using it offline.</p>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
   }
  }
  const saved=await cache.match(event.request);if(saved)return saved;
  const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;
 })());
});
