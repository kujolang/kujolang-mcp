// Local Node Fetch API measurements, not Cloudflare CPU or production latency.
import {readFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import os from 'node:os';
const source=await readFile(process.env.WORKER_PATH||'dist/worker.js','utf8');
const start=performance.now();
const worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
const coldImportMs=performance.now()-start;
const cases={health:null,initialize:['initialize',{protocolVersion:'2025-06-18'}],tools:['tools/list',{}],item:['tools/call',{name:'get_catalog_item',arguments:{slug:'kujo'}}],search:['tools/call',{name:'search_kujo_catalog',arguments:{query:'mcp agent gateway',limit:10}}],stack:['tools/call',{name:'recommend_kujo_stack',arguments:{task:'website technical seo'}}],listing:['tools/call',{name:'list_ecosystem',arguments:{limit:200}}],installation:['tools/call',{name:'get_installation',arguments:{profile:'all'}}],resource:['resources/read',{uri:'kujolang://catalog/skills'}],malformed:'{',overlimit:'x'.repeat(131073)};
const results={};
for(const [name,value] of Object.entries(cases)){
 const samples=[];let bytes=0,status=0;const cpu=process.cpuUsage();const began=performance.now();
 for(let i=0;i<110;i++){
  const req=new Request('https://mcp.kujolang.ai/'+(value===null?'health':'mcp'),value===null?{}:{method:'POST',headers:{'content-type':'application/json','accept':'application/json, text/event-stream'},body:typeof value==='string'?value:JSON.stringify({jsonrpc:'2.0',id:1,method:value[0],params:value[1]})});
  const t=performance.now();const res=await worker.fetch(req);const body=await res.arrayBuffer();const elapsed=performance.now()-t;if(i>=10)samples.push(elapsed);bytes=body.byteLength;status=res.status;
 }
 const total=performance.now()-began,usage=process.cpuUsage(cpu);samples.sort((a,b)=>a-b);
 results[name]={p50_ms:samples[49],p95_ms:samples[94],p99_ms:samples[98],min_ms:samples[0],max_ms:samples[99],throughput_per_second:110000/total,response_bytes:bytes,status,cpu_user_ms:usage.user/1000,cpu_system_ms:usage.system/1000};
}
console.log(JSON.stringify({environment:{node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0].model},warm_samples:100,warmup:10,cold_import_ms:coldImportMs,peak_rss_bytes:process.resourceUsage().maxRSS*1024,results},null,2));
