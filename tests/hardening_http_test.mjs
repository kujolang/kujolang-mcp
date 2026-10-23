import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import net from 'node:net';
const source=await readFile('dist/worker.js','utf8');
const worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
const reservation=net.createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));const port=reservation.address().port;await new Promise(r=>reservation.close(r));
const temp=await mkdtemp(join(tmpdir(),'mcp-hardening-'));
const config=JSON.parse(await readFile('mcp-server.json','utf8'));config.http.port=port;config.http.rate_limit_enabled=false;config.security.strict_2026_headers=true;config.catalog_path=join(process.cwd(),'data/catalog.json');
await writeFile(join(temp,'config.json'),JSON.stringify(config));
let log='';const server=spawn(process.env.KUJO_BIN||'kujo',['run','server.kujo','--interpreter'],{env:{...process.env,KUJOLANG_MCP_CONFIG:join(temp,'config.json')},stdio:['ignore','pipe','pipe']});server.stdout.on('data',b=>log+=b);server.stderr.on('data',b=>log+=b);
const base=`http://127.0.0.1:${port}`;
const normalize=value=>{
 if(Array.isArray(value))return value.map(normalize);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>{if(k==='text'&&typeof v==='string'){try{return [k,normalize(JSON.parse(v))]}catch{}}return [k,normalize(v)]}));
 return value;
};
let cases=0;
async function pair(body,{headers={},status=200,path='/mcp',compare=true}={}){
 const text=typeof body==='string'||Buffer.isBuffer(body)?body:JSON.stringify(body);
 const init={method:'POST',headers:{'content-type':'application/json','accept':'application/json, text/event-stream',...headers},body:text};
 const a=await fetch(base+path,init),b=await worker.fetch(new Request('https://mcp.kujolang.ai'+path,init));
 const at=await a.text(),bt=await b.text();
 assert.equal(a.status,status,`native ${text.slice(0,120)}: ${at}`);assert.equal(b.status,status,`worker ${text.slice(0,120)}: ${bt}`);
 for(const h of ['cache-control','x-content-type-options','x-frame-options','content-security-policy','referrer-policy','cross-origin-resource-policy'])assert.equal(a.headers.get(h),b.headers.get(h),h);
 if(compare){if(status===202){assert.equal(at,'');assert.equal(bt,'');}else assert.deepEqual(normalize(JSON.parse(bt)),normalize(JSON.parse(at)),text.slice(0,160));}
 cases++;return JSON.parse(at||'null');
}
const rpc=(method,params={},id=1)=>({jsonrpc:'2.0',id,method,params});
try{
 let ready=false;for(let i=0;i<150;i++){try{ready=(await fetch(base+'/health')).status===200}catch{}if(ready)break;if(server.exitCode!==null)throw Error(log);await new Promise(r=>setTimeout(r,100));}assert.ok(ready,log);
 for(const path of ['/mcp','/mcp/v1'])for(const method of ['GET','PUT','PATCH','DELETE','OPTIONS']){
  const a=await fetch(base+path,{method}),b=await worker.fetch(new Request('https://mcp.kujolang.ai'+path,{method}));assert.equal(a.status,405);assert.equal(b.status,405);cases++;
 }
 for(const method of ['initialize','ping','server/discover','tools/list','resources/list','prompts/list','unknown'])await pair(rpc(method));
 for(const version of ['2025-06-18','2026-07-28','unknown'])await pair(rpc('initialize',{protocolVersion:version}));
 const tool=(name,args)=>rpc('tools/call',{name,arguments:args});
 for(const [name,args] of [
  ['get_kujo_overview',{}],['list_ecosystem',{}],['list_ecosystem',{limit:200}],['search_kujo_catalog',{query:'MCP agent gateway'}],['search_kujo_catalog',{query:'technical:seo  mcp mcp'}],['recommend_kujo_stack',{task:'website technical seo'}],['list_webops_capabilities',{}],['list_webops_capabilities',{query:'technical seo'}],['get_catalog_item',{slug:' Kujo '}],['get_installation',{profile:'ALL'}],['get_installation',{profile:'constructor'}],['get_installation',{profile:null}],['get_kujo_overview',{x:1}],
 ])await pair(tool(name,args));
 const catalog=JSON.parse(await readFile('data/catalog.json','utf8'));
 for(const profile of ['default','all',...Object.keys(catalog.installation.profiles)])await pair(tool('get_installation',{profile}));
 for(const uri of ['kujolang://overview','kujolang://catalog/projects','kujolang://catalog/skills','kujolang://catalog/workflows','kujolang://installation','kujolang://security','constructor'])await pair(rpc('resources/read',{uri}));
 for(const name of ['choose_kujo_stack','plan_kujo_adoption','discover_webops','unknown'])for(const args of [{task:'test'}, {}, {task:'x',constraints:[]}, {task:'x'.repeat(1001)}])await pair(rpc('prompts/get',{name,arguments:args}));
 for(const value of [null,[],{},true,1,1.5,'x',-1,0,201]){
  await pair(tool('list_ecosystem',{limit:value}));await pair(tool('search_kujo_catalog',{query:'mcp',category:value}));await pair(tool('recommend_kujo_stack',{task:'mcp',limit:value}));await pair(tool('list_webops_capabilities',{limit:value}));
 }
 for(const payload of [null,[],[rpc('ping')],rpc('ping',[]),rpc('ping',null),rpc('ping',{},null),rpc('ping',{},true),rpc('ping',{},[]),rpc('ping',{},{}),rpc('ping',{},9007199254740992)])await pair(payload,{compare:false});
 for(const accept of ['text/html','application/json;q=0','application/json;q=0, */*'])await pair(rpc('ping'),{headers:{accept},status:406});
 for(const id of ['',0,-1,9007199254740991])await pair(rpc('ping',{},id));
 for(const payload of [{},{method:'ping'},{jsonrpc:'2.0',method:'tools/call',params:{name:'get_kujo_overview'}},{jsonrpc:'2.0',method:'notifications/initialized',params:[]}])await pair(payload,{status:400});
 await pair({jsonrpc:'2.0',method:'notifications/initialized'},{status:202});
 await pair('{',{status:400});await pair('not json');
 for(const body of ['{"jsonrpc":"2.0","id":1,"id":2,"method":"ping"}','{"id":1,"\\u0069d":2}', '['.repeat(65)+'0'+']'.repeat(65)])await pair(body,{status:400});
 await pair('['.repeat(64)+'0'+']'.repeat(64));
 for(const type of ['application/json-unexpected','application/json;','application/json, text/html'])await pair(rpc('ping'),{headers:{'content-type':type},status:415});
 for(const type of ['APPLICATION/JSON','application/json; charset=utf-8','application/json; charset="utf-8"'])await pair(rpc('ping'),{headers:{'content-type':type}});
 await pair(rpc('ping'),{headers:{origin:'https://evil.example'},status:403});
 await pair(Buffer.from([123,34,120,34,58,34,255,34,125]));
 await pair(rpc('ping',Object.fromEntries(Array.from({length:1024},(_,i)=>['k'+i,i]))));
 await pair(rpc('ping',Object.fromEntries(Array.from({length:1025},(_,i)=>['k'+i,i]))),{status:400});
 await pair(' '.repeat(131071));await pair(' '.repeat(131072));await pair(' '.repeat(131073),{status:413});
 await pair(JSON.stringify(rpc('ping',{text:'é'.repeat(66000)})),{status:413});
 for(const query of ['é'.repeat(512),'é'.repeat(513),'😀'.repeat(512)])await pair(tool('search_kujo_catalog',{query}));
 await pair(rpc('ping'),{path:'/mcp/v1'});
 await pair(rpc('ping'),{headers:{'mcp-protocol-version':'bad'},status:400});
 await pair(rpc('ping',{},9007199254740992),{headers:{'mcp-protocol-version':'bad'},status:400});
 for(const method of ['tools/list','tools/call','resources/read','prompts/get']){
  const params={_meta:{'io.modelcontextprotocol/protocolVersion':'2026-07-28','io.modelcontextprotocol/clientInfo':{name:'test',version:'1'},'io.modelcontextprotocol/clientCapabilities':{}}};
  if(method==='tools/call'){params.name='get_kujo_overview';params.arguments={};}if(method==='resources/read')params.uri='kujolang://overview';if(method==='prompts/get'){params.name='choose_kujo_stack';params.arguments={task:'test'};}
  const headers={'mcp-protocol-version':'2026-07-28','mcp-method':method,...(params.name||params.uri?{'mcp-name':params.name||params.uri}:{})};
  await pair(rpc(method,params),{headers});
  await pair(rpc(method,params),{headers:{...headers,'mcp-method':'wrong'},status:400});
  if(params.name||params.uri)await pair(rpc(method,params),{headers:{...headers,'mcp-name':'=?base64?'+Buffer.from(params.name||params.uri).toString('base64')+'?='}});
 }
 // Deterministic malformed-type fuzz corpus, followed by concurrent recovery probes.
 let seed=23;for(let i=0;i<50;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=[null,[],{},false,'',seed][seed%6];await pair(tool('search_kujo_catalog',{query:v}),{compare:true});}
 await Promise.all(Array.from({length:12},()=>pair(rpc('ping'))));
 // Stream cancellation proves over-limit chunked bodies are rejected before EOF.
 let cancelled=false,pulls=0;
 const stream=new ReadableStream({pull(c){pulls++;c.enqueue(new Uint8Array(65536));},cancel(){cancelled=true;}});
 const over=await worker.fetch(new Request('https://mcp.kujolang.ai/mcp',{method:'POST',headers:{'content-type':'application/json'},body:stream,duplex:'half'}));assert.equal(over.status,413);assert.ok(cancelled);assert.ok(pulls<=5);
 assert.equal((await worker.fetch(new Request('https://anything.workers.dev/health'))).status,403);
 console.log(JSON.stringify({passed:true,differential_cases:cases,stream_cancelled:cancelled,stream_pulls:pulls}));
}finally{server.kill('SIGTERM');await Promise.race([new Promise(r=>server.once('exit',r)),new Promise(r=>setTimeout(()=>{server.kill('SIGKILL');r();},6000))]);await rm(temp,{recursive:true,force:true});}
