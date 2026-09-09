import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const source=await readFile('dist/worker.js','utf8');
const worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
const catalog=JSON.parse(await readFile('data/catalog.json','utf8'));
async function request(method,params){const response=await worker.fetch(new Request('https://mcp.kujolang.ai/mcp',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})}));assert.equal(response.status,200);assert.equal(response.headers.get('x-content-type-options'),'nosniff');return response.json()}
function native(method,params){const result=spawnSync(process.env.KUJO_BIN||'kujo',['run','server.kujo','--interpreter','--','--request',JSON.stringify({jsonrpc:'2.0',id:1,method,params})],{encoding:'utf8',maxBuffer:4000000});assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout)}
for(const slug of ['kujo','kennel','commerce','kujo-pi','watchdog','videoops-quality-review']){const params={name:'get_catalog_item',arguments:{slug}};const actual=await request('tools/call',params);assert.equal(actual.result.isError,false);assert.deepEqual(actual.result.structuredContent,native('tools/call',params).result.structuredContent)}
for(const profile of Object.keys(catalog.installation.profile_commands)){const params={name:'get_installation',arguments:{profile}};const actual=await request('tools/call',params),other=native('tools/call',params);assert.equal(actual.result.isError,false);assert.deepEqual(actual.result.structuredContent.members,other.result.structuredContent.members);assert.equal(actual.result.structuredContent.command,other.result.structuredContent.command)}
const overview=await request('tools/call',{name:'get_kujo_overview',arguments:{}});assert.equal(overview.result.structuredContent.runtime_version,catalog.items.find(i=>i.slug==='kujo').version);assert.equal(overview.result.structuredContent.runtime_version,native('tools/call',{name:'get_kujo_overview',arguments:{}}).result.structuredContent.runtime_version);
const list=await request('tools/list',{});assert.equal(list.result.tools.length,7);assert.ok(list.result.tools.every(t=>t.annotations.readOnlyHint&&!t.annotations.destructiveHint));
for(const [name,args] of [['search_kujo_catalog',{query:'x'.repeat(513)}],['get_installation',{profile:'unknown'}],['get_catalog_item',{slug:'missing'}],['get_kujo_overview',{unexpected:true}]])assert.equal((await request('tools/call',{name,arguments:args})).result.isError,true);
assert.equal((await worker.fetch(new Request('https://invalid.example/mcp'))).status,403);
assert.equal((await worker.fetch(new Request('https://mcp.kujolang.ai/mcp'))).status,405);
assert.equal((await worker.fetch(new Request('https://mcp.kujolang.ai/mcp',{method:'POST',body:'x'}))).status,415);
assert.equal((await worker.fetch(new Request('https://mcp.kujolang.ai/mcp',{method:'POST',headers:{'content-type':'application/json'},body:'x'.repeat(131073)}))).status,413);
assert.equal((await request('no-such-method',{})).error.code,-32601);
console.log('Worker contracts: six exact item parity cases, all installer profiles, read-only discovery, invalid input and HTTP guards passed');
