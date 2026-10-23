import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile('dist/worker.js','utf8');
const worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
const catalog=JSON.parse(await readFile('data/catalog.json','utf8'));
const token='a'.repeat(64);
const writes=[];const reads=[];const pending=[];
const db = {
 prepare(sql) {
  return { bind(...values) {
   return {sql,values,
    async all(){reads.push({sql,values});return {results:[]};},
    async run(){writes.push({sql,values});return {success:true};}
   };
  }};
 },
 async batch(statements){writes.push(...statements);return [];}
};
const env={ANALYTICS_DB:db,ANALYTICS_ACCESS_AUD:token,ANALYTICS_OWNER_EMAIL:'owner@example.com'};const ctx={waitUntil(p){pending.push(p);}};
async function rpc(name,args={},headers={},otherEnv=env,method='tools/call'){
 const request=new Request('https://mcp.kujolang.ai/mcp',{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify({jsonrpc:'2.0',id:'PRIVATE-ID',method,params:method==='tools/call'?{name,arguments:args}:{clientInfo:{name:'PRIVATE-CLIENT'}}})});
 const response=await worker.fetch(request,otherEnv,ctx);await Promise.all(pending.splice(0));return response.json();
}
const metric=(d,v)=>writes.some(s=>s.values[1]===d&&s.values[2]===v);
await rpc('search_kujo_catalog',{query:'PRIVATE-QUERY@example.com installation'});
assert(metric('topic','installation'));assert(metric('tool','search_kujo_catalog'));
assert(!JSON.stringify(writes).includes('PRIVATE'));
assert(writes.every(x=>x.values.length===1||x.values.length===3));
for(const [header,value] of [['x-kujo-telemetry','off'],['dnt','1'],['sec-gpc','1']]){writes.length=0;await rpc('get_kujo_overview',{}, {[header]:value});assert.equal(writes.length,0);}
writes.length=0;await rpc('get_catalog_item',{slug:'PRIVATE-ITEM'});assert(metric('item','unknown'));assert(!JSON.stringify(writes).includes('PRIVATE'));
writes.length=0;await rpc('get_catalog_item',{slug:'kujo'});assert(metric('item','kujo'));
writes.length=0;await rpc('get_installation',{profile:'core'});assert(metric('profile','core'));
writes.length=0;await rpc('PRIVATE-TOOL');assert(metric('tool','unknown'));assert(!JSON.stringify(writes).includes('PRIVATE'));
writes.length=0;await rpc('',{}, {},env,'initialize');assert(metric('calls','initialize'));assert(!JSON.stringify(writes).includes('PRIVATE'));
writes.length=0;await rpc('',{}, {},env,'ping');assert.equal(writes.length,0);
const failed={...env,ANALYTICS_DB:{...db,batch(){return Promise.reject(Error('PRIVATE-FAILURE'));}}};
assert.equal((await rpc('get_catalog_item',{slug:'kujo'},{},failed)).result.structuredContent.slug,'kujo');
const throws={...env,ANALYTICS_DB:{prepare(){throw Error('PRIVATE-FAILURE');}}};
assert.equal((await rpc('get_catalog_item',{slug:'kujo'},{},throws)).result.structuredContent.slug,'kujo');
const accessCtx={...ctx,access:{aud:token,async getIdentity(){return {email:'owner@example.com'};}}};
const get=(path,headers={},e=env,c=ctx)=>worker.fetch(new Request('https://mcp.kujolang.ai'+path,{headers}),e,c);
for(const path of ['/analytics','/analytics/app.js','/analytics/data']){
 for(const headers of [{},{authorization:'Bearer '+token},{'cf-access-authenticated-user-email':'owner@example.com','cf-access-jwt-assertion':'forged',cookie:'CF_Authorization=forged'}])assert.equal((await get(path,headers)).status,401);
 for(const access of [undefined,{aud:'wrong'},{aud:token,async getIdentity(){return {email:'attacker@example.com'};}},{aud:token,async getIdentity(){throw Error('unavailable');}},{aud:token,async getIdentity(){return {};}}])assert.equal((await get(path,{},env,{...ctx,access})).status,401);
 for(const e of [{}, {...env,ANALYTICS_ACCESS_AUD:''},{...env,ANALYTICS_OWNER_EMAIL:''}])assert.equal((await get(path,{},e,accessCtx)).status,401);
}
assert.equal(reads.length,0);
const authorized=await get('/analytics/data',{},env,accessCtx);assert.equal(authorized.status,200);assert.equal(authorized.headers.get('cache-control'),'no-store');assert.deepEqual((await authorized.json()).rows,[]);assert.equal(reads.length,1);assert(reads[0].sql.includes('day >= ?'));
assert.equal((await get('/analytics/data',{}, {...env,ANALYTICS_DB:undefined},accessCtx)).status,503);
assert.equal((await get('/analytics/data',{origin:'https://evil.example'},env,accessCtx)).status,403);
assert.equal((await get('/analytics/data',{origin:'https://mcp.kujolang.ai'},env,accessCtx)).status,200);
const dashboard=await get('/analytics',{},env,accessCtx);assert.equal(dashboard.status,200);assert((await dashboard.text()).includes('not unique people'));assert(dashboard.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
assert.equal((await get('/analytics/app.js',{},env,accessCtx)).status,200);
assert.equal((await get('/telemetry')).status,200);
assert(!JSON.stringify(writes).includes('owner@example.com'));
assert.equal((await worker.fetch(new Request('https://evil.example/analytics'),env,accessCtx)).status,403);
assert.equal((await worker.fetch(new Request('https://mcp.kujolang.ai/analytics/data',{method:'POST'}),env,accessCtx)).status,405);
writes.length=0;await worker.scheduled({},env,ctx);await Promise.all(pending.splice(0));assert.equal(writes.length,1);assert(writes[0].sql.startsWith('DELETE'));assert.match(writes[0].values[0],/^\d{4}-\d{2}-\d{2}$/);
// Deterministic retrieval quality checks, independent of telemetry counters.
for(const [query,slug] of [['mcp','mcp'],['kennel','kennel'],['rag','rag']]){
 const response=await rpc('search_kujo_catalog',{query},{'x-kujo-telemetry':'off'});
 assert(response.result.structuredContent.results.slice(0,5).some(x=>x.item.slug===slug));
}
const config=JSON.parse(await readFile('wrangler.jsonc','utf8'));assert.equal(config.observability.enabled,false);
assert(!/localStorage|sessionStorage|document.cookie|innerHTML/.test(await readFile('src/cloudflare/dashboard.js','utf8')));
assert(source.includes(catalog.source.snapshot_sha256));
console.log('Analytics: fixed dimensions, privacy canaries, opt-outs, failure isolation, authorization, retention and search quality passed');
