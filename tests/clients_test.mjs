import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
const source=await readFile('dist/worker.js','utf8');
const worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
const db=new DatabaseSync(':memory:');
for(const file of ['0001_analytics.sql','0002_history.sql','0003_clients.sql'])db.exec(await readFile('migrations/'+file,'utf8'));
const pending=[];const env={ANALYTICS_DB:{prepare(sql){return{bind(...values){return{sql,values};}};},async batch(stmts){db.exec('BEGIN');try{for(const s of stmts)db.prepare(s.sql).run(...s.values);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}}}};
async function call(method,name,ua,headers={}){
 db.exec('DELETE FROM daily_clients');
 const params=method==='initialize'?{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name,version:'PRIVATE-VERSION'}}:{name:'get_kujo_overview',arguments:{},clientInfo:{name:'Codex'}};
 const r=await worker.fetch(new Request('https://mcp.kujolang.ai/mcp',{method:'POST',headers:{'content-type':'application/json',...(ua?{'user-agent':ua}:{}),'x-client-id':'PRIVATE-IDENTITY',...headers},body:JSON.stringify({jsonrpc:'2.0',id:'PRIVATE-ID',method,params})}),env,{waitUntil(p){pending.push(p);}});
 assert.equal(r.status,200);await Promise.all(pending.splice(0));
 const rows=db.prepare('SELECT * FROM daily_clients').all();assert(!JSON.stringify(rows).includes('PRIVATE'));return rows;
}
for(const [name,client] of [['Codex','codex'],['Claude Code','claude_code'],['Claude Duet','claude_duet'],['Grok Bot','grok_bot'],['Muse','muse'],['Pi','pi'],['CommandCode','commandcode']]){
 let rows=await call('initialize',name,'Muse/1.2');assert.equal(rows[0].client,client);assert.equal(rows[0].source,'client_info');assert.equal(rows[0].method,'initialize');
 rows=await call('tools/call',null,name+'/1.2');assert.equal(rows[0].client,client);assert.equal(rows[0].source,'user_agent');assert.equal(rows[0].tool,'get_kujo_overview');
}
assert.equal((await call('initialize','PRIVATE-NAME@example.com','Codex/1'))[0].client,'other');
for(const ua of [null,'node','python-requests/2.0','Mozilla/5.0','mcp-sdk/1.0','not-codex/1','Pi PRIVATE-DATA','Codex/1 PRIVATE-DATA','x'.repeat(300)]){const r=await call('tools/call',null,ua);assert.equal(r[0].client,'unknown');assert.equal(r[0].source,'none');}
assert.equal((await call('initialize','x'.repeat(129),null))[0].client,'unknown');
assert.equal((await call('initialize','',null))[0].client,'unknown');
await call('initialize','Codex',null);assert.equal((await call('tools/call',null,null))[0].client,'unknown');
for(const headers of [{'dnt':'1'},{'sec-gpc':'1'},{'x-kujo-telemetry':'off'}])assert.equal((await call('tools/call',null,'Codex/1',headers)).length,0);
assert.throws(()=>db.prepare("INSERT INTO daily_clients VALUES('2026-10-23','PRIVATE-NAME','initialize','not_applicable','success','none','not_applicable',?,1)").run('a'.repeat(64)));
console.log('Client allowlist, sources, unknowns, spoofable labels, no session linkage, privacy canaries and opt-outs passed');
