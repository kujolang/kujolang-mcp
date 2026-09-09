import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import net from 'node:net';
const reservation=net.createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));const port=reservation.address().port;await new Promise(r=>reservation.close(r));
const temp=await mkdtemp(join(tmpdir(),'kujo-mcp-http-'));const config=JSON.parse(await readFile('mcp-server.json','utf8'));config.http.port=port;config.http.rate_limit_per_minute=1;config.catalog_path=join(process.cwd(),'data/catalog.json');await writeFile(join(temp,'config.json'),JSON.stringify(config));
let log='';const server=spawn(process.env.KUJO_BIN||'kujo',['run','server.kujo','--interpreter'],{env:{...process.env,KUJOLANG_MCP_CONFIG:join(temp,'config.json')},stdio:['ignore','pipe','pipe']});server.stdout.on('data',x=>log+=x);server.stderr.on('data',x=>log+=x);const base=`http://127.0.0.1:${port}`;
try{let ready=false;for(let i=0;i<100;i++){try{ready=(await fetch(base+'/health')).status===200}catch{}if(ready)break;if(server.exitCode!==null)throw Error(log);await new Promise(r=>setTimeout(r,100))}assert.ok(ready,log);
const post=path=>fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'ping',params:{}})});
assert.equal((await post('/mcp')).status,200);assert.equal((await fetch(base+'/health')).status,200);assert.equal((await post('/mcp')).status,429);assert.equal((await post('/mcp/v1')).status,429);assert.equal((await fetch(base+'/health')).status,200);console.log('Native HTTP: persistent POST quota shared across aliases; health exempt; passed');
}finally{server.kill('SIGTERM');await new Promise(r=>server.once('exit',r));await rm(temp,{recursive:true,force:true})}
