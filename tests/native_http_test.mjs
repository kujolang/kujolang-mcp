import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';
import net from 'node:net';
const reservation=net.createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));const port=reservation.address().port;await new Promise(r=>reservation.close(r));
const temp=await mkdtemp(join(tmpdir(),'kujo-mcp-http-'));const config=JSON.parse(await readFile('mcp-server.json','utf8'));config.http.port=port;config.http.rate_limit_per_minute=1;config.catalog_path=join(process.cwd(),'data/catalog.json');await writeFile(join(temp,'config.json'),JSON.stringify(config));
let log='';const server=spawn(process.env.KUJO_BIN||'kujo',['run','server.kujo','--interpreter'],{env:{...process.env,KUJOLANG_MCP_CONFIG:join(temp,'config.json')},stdio:['ignore','pipe','pipe']});server.stdout.on('data',x=>log+=x);server.stderr.on('data',x=>log+=x);const base=`http://127.0.0.1:${port}`;
async function status(path,options={}) {
 const deadline=performance.now()+3000;
 do {
  const response=await fetch(base+path,{...options,signal:AbortSignal.timeout(1500)});
  await response.arrayBuffer();
  if(response.status!==503)return response.status;
  // The transport can refuse admission until its prior worker releases its slot.
  // A refused request never reaches the quota. Every admitted status is asserted.
  await delay(15);
 } while(performance.now()<deadline);
 throw new Error("The native transport did not release its admission slot");
}
try {
 let ready=false;
 for(let attempt=0;attempt<100;attempt++){
  try{ready=await status('/health')===200;}catch{}
  if(ready)break;
  if(server.exitCode!==null)throw Error(log);
  await delay(100);
 }
 assert.ok(ready,log);
 const post=path=>status(path,{
  method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({jsonrpc:'2.0',id:1,method:'ping',params:{}}),
 });
 assert.equal(await post('/mcp'),200);
 assert.equal(await status('/health'),200);
 assert.equal(await post('/mcp'),429);
 assert.equal(await post('/mcp/v1'),429);
 assert.equal(await status('/health'),200);
 console.log('Native HTTP: persistent POST quota shared across aliases; health exempt; passed');
} finally {
 if(server.exitCode===null&&server.signalCode===null){
  const exited=once(server,'exit');
  server.kill('SIGTERM');
  await exited;
 }
 await rm(temp,{recursive:true,force:true});
}
