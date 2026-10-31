const ROOT=new URL('./',self.location.href);
const PREFIX='orl-estudio-'+ROOT.pathname.replace(/[^a-zA-Z0-9_-]/g,'_')+'-';
const CACHE=PREFIX+'010debafdc7c';
const FILES=["./", "./index.html", "./styles.css", "./app.js", "./core.js", "./bank.json", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png", "./icon-maskable.png"];
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
 for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);
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
 if(event.request.method!=='GET'||url.origin!==ROOT.origin||!PATHS.has(url.pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(event.request.mode==='navigate'){
   try{const network=await fetch(event.request);if(network.ok&&!network.redirected&&network.headers.get('Content-Type')?.includes('text/html'))return network;if(network.status===401||network.status===403||network.redirected)return network;}catch{}
   return (await cache.match(new URL('index.html',ROOT).href))||(await cache.match(ROOT.href))||Response.error();
  }
  return (await cache.match(url.origin+url.pathname))||fetch(event.request);
 })());
});
