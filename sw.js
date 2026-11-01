const ROOT=new URL('./',self.location.href);
const PREFIX='orl-estudio-'+ROOT.pathname.replace(/[^a-zA-Z0-9_-]/g,'_')+'-';
const CACHE=PREFIX+'d304824730e8';
const MEDIA=PREFIX+'media-v2';
const FILES=["./", "./index.html", "./styles.css", "./atlas.css", "./app.js", "./core.js", "./atlas.js", "./bank.json", "./atlas.json", "./examination.json", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png", "./icon-maskable.png"];
const MEDIA_PATHS=new Set(["./assets/atlas/fig-001.jpg", "./assets/atlas/fig-002.jpg", "./assets/atlas/fig-003.jpg", "./assets/atlas/fig-004.jpg", "./assets/atlas/fig-005.jpg", "./assets/atlas/fig-006.jpg", "./assets/atlas/fig-007.jpg", "./assets/atlas/fig-008.jpg", "./assets/atlas/fig-009.jpg", "./assets/atlas/fig-010.jpg", "./assets/atlas/fig-011.jpg", "./assets/atlas/fig-012.jpg", "./assets/atlas/fig-013.jpg", "./assets/atlas/fig-014.jpg", "./assets/atlas/fig-015.jpg", "./assets/atlas/fig-016.jpg", "./assets/atlas/fig-017.jpg", "./assets/atlas/fig-018.jpg", "./assets/atlas/fig-019.jpg", "./assets/atlas/fig-020.jpg", "./assets/atlas/fig-021.jpg", "./assets/atlas/fig-022.jpg", "./assets/atlas/fig-023.jpg", "./assets/atlas/fig-024-guide.png", "./assets/atlas/fig-024.jpg", "./assets/atlas/fig-025-guide.png", "./assets/atlas/fig-025.jpg", "./assets/atlas/fig-026-guide.png", "./assets/atlas/fig-026.jpg", "./assets/atlas/fig-027-guide.png", "./assets/atlas/fig-027.jpg", "./assets/atlas/fig-028-guide.png", "./assets/atlas/fig-028.jpg", "./assets/atlas/fig-029-guide.png", "./assets/atlas/fig-029.jpg", "./assets/atlas/fig-030-guide.png", "./assets/atlas/fig-030.jpg", "./assets/atlas/fig-031-guide.png", "./assets/atlas/fig-031.jpg", "./assets/atlas/fig-032-guide.png", "./assets/atlas/fig-032.jpg", "./assets/atlas/fig-033-guide.png", "./assets/atlas/fig-033.jpg", "./assets/atlas/fig-034-guide.png", "./assets/atlas/fig-034.jpg", "./assets/atlas/fig-035-guide.png", "./assets/atlas/fig-035.jpg", "./assets/atlas/fig-036-guide.png", "./assets/atlas/fig-036.jpg", "./assets/atlas/fig-037-guide.png", "./assets/atlas/fig-037.jpg", "./assets/atlas/fig-038-guide.png", "./assets/atlas/fig-038.jpg", "./assets/atlas/fig-039-guide.png", "./assets/atlas/fig-039.jpg", "./assets/atlas/fig-040-guide.png", "./assets/atlas/fig-040.jpg", "./assets/atlas/fig-041-guide.png", "./assets/atlas/fig-041.jpg", "./assets/atlas/fig-042-guide.png", "./assets/atlas/fig-042.jpg", "./assets/atlas/fig-043-guide.png", "./assets/atlas/fig-043.jpg", "./assets/atlas/fig-044-guide.png", "./assets/atlas/fig-044.jpg", "./assets/atlas/fig-045-guide.png", "./assets/atlas/fig-045.jpg", "./assets/atlas/fig-046-guide.png", "./assets/atlas/fig-046.jpg", "./assets/atlas/fig-047-guide.png", "./assets/atlas/fig-047.jpg", "./assets/atlas/fig-048-guide.png", "./assets/atlas/fig-048.jpg", "./assets/atlas/fig-049-guide.png", "./assets/atlas/fig-049-legend.png", "./assets/atlas/fig-049.jpg"].map(path=>new URL(path,ROOT).pathname));
const ASSETS=FILES.map(path=>new URL(path,ROOT).href);
const PATHS=new Set(ASSETS.map(path=>new URL(path).pathname));
self.addEventListener('install',event=>{event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 for(const address of ASSETS){
  const response=await fetch(new Request(address,{cache:'reload',credentials:'same-origin'}));
  if(!response.ok||response.redirected||new URL(response.url).origin!==ROOT.origin)throw Error('Asset not available: '+address);
  if(address.endsWith('.json')&&!response.headers.get('Content-Type')?.includes('json'))throw Error('Invalid data response');
  if(address.endsWith('.js')&&!/javascript|ecmascript/.test(response.headers.get('Content-Type')||''))throw Error('Invalid script response');
  await cache.put(address,response);
 }
 await self.skipWaiting();
})());});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{
 for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE&&name!==MEDIA)await caches.delete(name);
 await self.clients.claim();
})());});
self.addEventListener('message',event=>{
 if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
 if(event.data?.type==='CHECK_READY')event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);const matches=await Promise.all(ASSETS.map(path=>cache.match(path)));
  event.ports[0]?.postMessage({ready:matches.every(Boolean)});
 })());
});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==ROOT.origin||(!PATHS.has(url.pathname)&&!MEDIA_PATHS.has(url.pathname)))return;
 event.respondWith((async()=>{
  if(MEDIA_PATHS.has(url.pathname)){
   const mediaCache=await caches.open(MEDIA);const key=url.origin+url.pathname;
   const cached=await mediaCache.match(key);if(cached)return cached;
   try{const response=await fetch(event.request);if(response.ok&&!response.redirected&&response.headers.get('Content-Type')?.startsWith('image/'))await mediaCache.put(key,response.clone());return response;}catch{return Response.error();}
  }
  const cache=await caches.open(CACHE);
  if(event.request.mode==='navigate'){
   try{const network=await fetch(event.request);if(network.ok&&!network.redirected&&network.headers.get('Content-Type')?.includes('text/html'))return network;if(network.status===401||network.status===403||network.redirected)return network;}catch{}
   return (await cache.match(new URL('index.html',ROOT).href))||(await cache.match(ROOT.href))||Response.error();
  }
  return (await cache.match(url.origin+url.pathname))||fetch(event.request);
 })());
});
