'use strict';
const CACHE='kbr-home-20261109-three-column-shifts-v5';
const ASSETS=["./shifts.js?v=shift-tiles-v4","./icons/shop-closed.png","./icons/shop-open.png","./icons/icon-192.png","./icons/icon-512.png","./manifest.json","./manager-tile.js","./page-clock.js","./","./index.html","./customer-registration.html","./clock-in.html","./open-end-shift.html","./sync-config.js","./sync-core.js","./sync-core.js?v=usage-sleep-v2","./sync-ui.js","./sync.css?v=cash-pane-v2","./worker-clock.js?v=elapsed-local-nov4-v3","./shop-page.js?v=shift-tiles-v4","./sync-login.html","./reset-password.html","./reset-password.js","./page-tools.js?v=shop-cache-recovery-20261109","./page-tools.css"];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    // A single optional image or offline resource must not abort the entire update.
    const results=await Promise.allSettled(ASSETS.map(asset=>cache.add(asset)));
    const required=['./open-end-shift.html','./shifts.js?v=shift-tiles-v4','./shop-page.js?v=shift-tiles-v4','./page-tools.js?v=shop-cache-recovery-20261109'];
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
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    // Fetch fresh app pages/scripts first; cached copies remain an offline fallback.
    const freshFirst=event.request.mode==='navigate'||/\/(?:shifts|shop-page|page-tools)\.js$/.test(url.pathname);
    if(freshFirst){
      try{const response=await fetch(event.request);if(response.ok){await cache.put(event.request,response.clone());return response;}const cached=await cache.match(event.request);return cached||response;}
      catch(error){const cached=await cache.match(event.request);if(cached)return cached;throw error;}
    }
    const cached=await cache.match(event.request);if(cached)return cached;
    const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;
  })());
});
