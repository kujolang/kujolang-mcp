import assert from 'node:assert/strict';import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {spawn} from 'node:child_process';import net from 'node:net';
const reserve=net.createServer();await new Promise(r=>reserve.listen(0,'127.0.0.1',r));const port=reserve.address().port;await new Promise(r=>reserve.close(r));
const temp=await mkdtemp(join(tmpdir(),'mcp-auth-'));const cfg=JSON.parse(await readFile('mcp-server.json','utf8'));cfg.http.port=port;cfg.http.rate_limit_per_minute=20;cfg.security.auth_enabled=true;cfg.catalog_path=join(process.cwd(),'data/catalog.json');await writeFile(join(temp,'config.json'),JSON.stringify(cfg));
const token='local-test-token-never-a-real-secret';let log='';const server=spawn(process.env.KUJO_BIN||'kujo',['run','server.kujo','--interpreter'],{env:{...process.env,KUJOLANG_MCP_CONFIG:join(temp,'config.json'),KUJOLANG_MCP_TOKEN:token},stdio:['ignore','pipe','pipe']});server.stdout.on('data',b=>log+=b);server.stderr.on('data',b=>log+=b);const base=`http://127.0.0.1:${port}`;
async function raw(lines){return new Promise((resolve,reject)=>{let data='';const sock=net.connect(port,'127.0.0.1',()=>sock.write(lines+'\r\n\r\n'));sock.setTimeout(3000,()=>sock.destroy(Error('raw request timeout')));sock.on('data',b=>data+=b);sock.on('error',reject);sock.on('end',()=>resolve(Number(data.split(' ')[1])));});}
try{
 let ready=false;for(let i=0;i<150;i++){try{ready=(await fetch(base+'/health')).status===401}catch{}if(ready)break;await new Promise(r=>setTimeout(r,100));}assert.ok(ready,log);
 for(const authorization of ['', 'Bearer', 'Bearer ', 'Basic '+token, 'Bearer wrong', 'Bearer  '+token]){const res=await fetch(base+'/health',{headers:{authorization}});assert.equal(res.status,401);assert.equal(res.headers.get('www-authenticate'),'Bearer');assert.ok(!(await res.text()).includes(token));}
 assert.equal((await fetch(base+'/health',{headers:{authorization:'bearer '+token}})).status,200);
 for(const header of [`Authorization: Bearer ${token}\r\nauthorization: Bearer wrong`,`Host: localhost\r\nhost: evil`]){
  const host=header.startsWith('Host:')?'':'Host: localhost\r\n';assert.equal(await raw(`GET /health HTTP/1.1\r\n${host}${header}\r\nConnection: close`),400);
 }
 const post=()=>fetch(base+'/mcp',{method:'POST',headers:{authorization:(Math.random()<0.5?'BEARER ':'bearer ')+token,'content-type':'application/json','x-forwarded-for':Math.random().toString()},body:'{"jsonrpc":"2.0","id":1,"method":"ping"}'});
 const responses=await Promise.all(Array.from({length:40},post));const passed=responses.filter(r=>r.status===200).length;assert.ok(passed>=1&&passed<=20,`quota bypass: ${passed}`);assert.ok(responses.every(r=>[200,429,503].includes(r.status)));let total=passed;while(total<20){const r=await post();assert.equal(r.status,200);total++;}assert.equal((await post()).status,429);
 assert.equal((await fetch(base+'/health',{headers:{authorization:'Bearer '+token}})).status,200);assert.ok(!log.includes(token));
 console.log(JSON.stringify({passed:true,concurrent_accepted:passed,concurrent_rejected:40-passed,duplicate_singletons_rejected:true}));
}finally{server.kill('SIGTERM');await Promise.race([new Promise(r=>server.once('exit',r)),new Promise(r=>setTimeout(()=>{server.kill('SIGKILL');r();},6000))]);await rm(temp,{recursive:true,force:true});}
