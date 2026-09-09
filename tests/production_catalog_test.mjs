// Read-only post-deployment verification against the reviewed bundled Worker.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const endpoint=process.env.MCP_ENDPOINT||'https://mcp.kujolang.ai/mcp';
assert.equal(new URL(endpoint).protocol,'https:');
const source=await readFile('dist/worker.js','utf8');
const worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
const catalog=JSON.parse(await readFile('data/catalog.json','utf8'));
const checks=[];
async function compare(method,params){
 const init={method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})};
 const expected=await (await worker.fetch(new Request(endpoint,init))).json();
 const response=await fetch(endpoint,{...init,redirect:'error',signal:AbortSignal.timeout(20000)});
 assert.equal(response.status,200,method);const actual=await response.json();assert.deepEqual(actual,expected,method+': '+JSON.stringify(params));
 checks.push({method,params,response_sha256:createHash('sha256').update(JSON.stringify(actual)).digest('hex')});return actual;
}
for(const method of ['tools/list','resources/list','prompts/list'])await compare(method,{});
let itemCount=0;
for(const collection of ['projects','skills','workflows']){const result=await compare('resources/read',{uri:'kujolang://catalog/'+collection});itemCount+=JSON.parse(result.result.contents[0].text).items.length;}
assert.equal(itemCount,catalog.counts.total);
const overview=await compare('tools/call',{name:'get_kujo_overview',arguments:{}});
assert.equal(overview.result.structuredContent.runtime_version,catalog.items.find(i=>i.slug==='kujo').version);
for(const profile of Object.keys(catalog.installation.profile_commands))await compare('tools/call',{name:'get_installation',arguments:{profile}});
for(const slug of ['kujo','kennel','commerce','kujo-pi','watchdog','videoops-quality-review'])await compare('tools/call',{name:'get_catalog_item',arguments:{slug}});
const healthResponse=await fetch(new URL('/health',endpoint),{redirect:'error',signal:AbortSignal.timeout(20000)});assert.equal(healthResponse.status,200);const health=await healthResponse.json();
const receipt={checked_at:new Date().toISOString(),endpoint,result:'passed',catalog_revision:catalog.source.snapshot_sha256,catalog_content_digest:catalog.source.content_sha256,worker_sha256:createHash('sha256').update(source).digest('hex'),runtime_version:overview.result.structuredContent.runtime_version,items_compared:itemCount,installer_profiles_compared:Object.keys(catalog.installation.profile_commands).length,health,checks};
if(process.env.RECEIPT_PATH)await writeFile(process.env.RECEIPT_PATH,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({result:receipt.result,catalog_revision:receipt.catalog_revision,runtime_version:receipt.runtime_version,items_compared:itemCount,profiles:receipt.installer_profiles_compared}));
