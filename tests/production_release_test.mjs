// Bounded read-only release smoke checks; no load or oversized-body probes.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const origin='https://mcp.kujolang.ai';
const manifest=JSON.parse(await readFile('mcp.manifest.json','utf8'));
const expected=manifest.server.version;
const checks=[];
async function post(body,headers={},status=200,path='/mcp'){
 const response=await fetch(origin+path,{method:'POST',headers:{'content-type':'application/json','x-kujo-telemetry':'off',...headers},body:typeof body==='string'?body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(20000)});
 assert.equal(response.status,status);
 assert.equal(response.headers.get('cache-control'),'no-store');
 const result=await response.json();checks.push({path,status,code:result.error?.code??null});return result;
}
const rpc=(method,params={})=>({jsonrpc:'2.0',id:1,method,params});
assert.equal((await post(rpc('initialize'))).result.serverInfo.version,expected);
assert.deepEqual((await post(rpc('ping'),{},200,'/mcp/v1')).result,{});
assert.equal((await post('{"jsonrpc":"2.0","id":1.0,"method":"ping"}')).error.code,-32600);
assert.equal((await post('{"jsonrpc":"2.0","id":1,"method":"ping","params":{"n":1e400}}')).error.code,-32700);
assert.equal((await post('{"jsonrpc":"2.0","id":1,"id":2,"method":"ping"}',{},400)).error.code,-32700);
await post(rpc('ping'),{accept:'application/json;q=garbage'},406);
await post(rpc('ping'),{origin:'https://invalid.example'},403);
const query='\u0085mcp\u0085';
const search=await post(rpc('tools/call',{name:'search_kujo_catalog',arguments:{query}}));
assert.equal(search.result.structuredContent.query,'mcp');assert.ok(search.result.structuredContent.returned>0);
const modern=rpc('ping',{_meta:{'io.modelcontextprotocol/protocolVersion':'2026-07-28','io.modelcontextprotocol/clientInfo':{name:'release-check',version:'1'},'io.modelcontextprotocol/clientCapabilities':{}}});
assert.equal((await post(modern,{'mcp-protocol-version':'2026-07-28','mcp-method':'ping'})).result.resultType,'complete');
const health=await (await fetch(origin+'/health',{signal:AbortSignal.timeout(20000)})).json();assert.equal(health.version,expected);
const receipt={checked_at:new Date().toISOString(),origin,version:expected,result:'passed',health,checks};
if(process.env.RECEIPT_PATH)await writeFile(process.env.RECEIPT_PATH,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({passed:true,version:expected,checks:checks.length}));
