import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
const source=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
function worker(base='/'){
 const listeners={},stores=new Map();let offline=false,unauthorized=false;
 const origin='https://example.github.io';const root=new URL(base,origin).href;
 const cache=async name=>{if(!stores.has(name))stores.set(name,new Map());const m=stores.get(name);return {put:async(k,v)=>m.set(k,v),match:async k=>m.get(k)};};
 const sandbox={URL,Set,MessageChannel,Response,Promise,Error,console,Request:class{constructor(path,opts){this.url=new URL(path,root).href;Object.assign(this,opts);}},caches:{open:cache,keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name)},fetch:async request=>{if(offline)throw Error('No network');const url=typeof request==='string'?new URL(request,root).href:request.url;const path=new URL(url).pathname;const response=new Response(path,{status:unauthorized?401:200,headers:{'Content-Type':path.endsWith('.json')?'application/json':path.endsWith('.js')?'application/javascript':'text/html'}});Object.defineProperty(response,'url',{value:url});return response;},self:{location:{origin,href:new URL('sw.js',root).href},addEventListener:(name,cb)=>listeners[name]=cb,skipWaiting:async()=>{},clients:{claim:async()=>{}}}};
 vm.runInNewContext(source,sandbox);
 async function lifecycle(name){let promise;listeners[name]({waitUntil:p=>promise=p});await promise;}
 async function request(path,mode='navigate'){let promise;listeners.fetch({request:{url:new URL(path,root).href,method:'GET',mode},respondWith:p=>promise=p});return promise?await promise:null;}
 async function ready(){let promise,data;listeners.message({data:{type:'CHECK_READY'},ports:[{postMessage:d=>data=d}],waitUntil:p=>promise=p});await promise;return data.ready;}
 return {lifecycle,request,ready,setOffline:v=>offline=v,setUnauthorized:v=>unauthorized=v,stores};
}
for(const base of ['/','/ORL-Estudio/']){
 test(`Full app download is required before offline readiness at ${base}`,async()=>{const w=worker(base);assert.equal(await w.ready(),false);await w.lifecycle('install');await w.lifecycle('activate');assert.equal(await w.ready(),true);});
 test(`Page and bank remain available without a network at ${base}`,async()=>{const w=worker(base);await w.lifecycle('install');w.setOffline(true);assert.equal((await w.request('./?source=installed')).status,200);assert.equal(await (await w.request('bank.json','cors')).text(),base+'bank.json');});
}
test('A project service worker leaves other GitHub Pages projects and their caches alone',async()=>{
 const w=worker('/ORL-Estudio/');w.stores.set('orl-estudio-_another-project_-old',new Map());await w.lifecycle('install');await w.lifecycle('activate');
 assert.ok(w.stores.has('orl-estudio-_another-project_-old'));assert.equal(await w.request('/'),null);assert.equal(await w.request('/another-project/bank.json','cors'),null);assert.equal(await w.request('/signin-with-chatgpt'),null);
});
test('Expired access is not hidden if authentication is later configured',async()=>{const w=worker('/ORL-Estudio/');await w.lifecycle('install');w.setUnauthorized(true);assert.equal((await w.request('./')).status,401);});
test('HTML, manifest and app script do not depend on the ChatGPT origin or root-only paths',()=>{
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');const manifest=JSON.parse(fs.readFileSync(new URL('../manifest.webmanifest',import.meta.url),'utf8'));
 assert.ok(!html.includes('chatgpt.site'));assert.ok(!/\b(?:src|href)="\//.test(html));assert.equal(manifest.scope,'./');assert.ok(manifest.start_url.startsWith('./'));
 assert.ok(!app.includes("fetch('/bank.json')"));assert.ok(app.includes("new URL('bank.json',APP_ROOT)"));assert.ok(app.includes('scope:APP_ROOT.href'));
});
