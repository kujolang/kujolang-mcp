import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {spawn} from 'node:child_process';import net from 'node:net';import {performance} from 'node:perf_hooks';
const reserve=net.createServer();await new Promise(r=>reserve.listen(0,'127.0.0.1',r));const port=reserve.address().port;await new Promise(r=>reserve.close(r));const dir=await mkdtemp(join(tmpdir(),'mcp-bench-'));
const cfg=JSON.parse(await readFile('mcp-server.json','utf8'));cfg.http.port=port;cfg.http.rate_limit_enabled=false;cfg.catalog_path=join(process.cwd(),'data/catalog.json');await writeFile(join(dir,'config.json'),JSON.stringify(cfg));
const start=performance.now();const server=spawn(process.env.KUJO_BIN||'kujo',['run','server.kujo','--interpreter'],{env:{...process.env,KUJOLANG_MCP_CONFIG:join(dir,'config.json')},stdio:['ignore','pipe','pipe']});let log='';server.stdout.on('data',b=>log+=b);server.stderr.on('data',b=>log+=b);const url=`http://127.0.0.1:${port}`;
try{
 let ready=false;for(let i=0;i<150;i++){try{ready=(await fetch(url+'/health')).status===200}catch{}if(ready)break;if(server.exitCode!==null)throw Error(log);await new Promise(r=>setTimeout(r,20));}if(!ready)throw Error('startup timeout');
 console.error(JSON.stringify({native_cold_start_to_health_ms:performance.now()-start,method:'process spawn through first successful loopback health, 20 ms polling'}));
 process.env.BENCHMARK_BASE_URL=url;await import('./worker_benchmark.mjs');
}finally{server.kill('SIGTERM');if(server.exitCode===null)await new Promise(r=>server.once('exit',r));await rm(dir,{recursive:true,force:true});}
