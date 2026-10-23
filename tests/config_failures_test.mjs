import assert from 'node:assert/strict';import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';import {spawnSync} from 'node:child_process';
const dir=await mkdtemp(join(tmpdir(),'mcp-config-'));const base=JSON.parse(await readFile('mcp-server.json','utf8'));base.catalog_path=join(process.cwd(),'data/catalog.json');let cases=0;
try{
 const run=path=>spawnSync(process.env.KUJO_BIN||'kujo',['run','server.kujo','--interpreter','--','--self-check'],{env:{...process.env,KUJOLANG_MCP_CONFIG:path},encoding:'utf8',timeout:15000});
 const bad=async value=>{const path=join(dir,'config.json');await writeFile(path,typeof value==='string'?value:JSON.stringify(value));assert.notEqual(run(path).status,0);cases++;};
 for(const value of ['{','[]',{...base,http:[]},{...base,http:{...base.http,port:0}},{...base,http:{...base.http,max_request_body_bytes:0}},{...base,http:{...base.http,host:'0.0.0.0'}},{...base,security:{...base.security,allowed_hosts:[]}},{...base,catalog_path:join(dir,'missing.json')}])await bad(value);
 const snapshot=join(dir,'catalog.json');await writeFile(snapshot,'{}');await bad({...base,catalog_path:snapshot});await writeFile(snapshot,'{');await bad({...base,catalog_path:snapshot});
 const catalog=JSON.parse(await readFile('data/catalog.json','utf8'));catalog.source.snapshot_sha256='0'.repeat(64);await writeFile(snapshot,JSON.stringify(catalog));await bad({...base,catalog_path:snapshot});
 assert.notEqual(run(join(dir,'missing-config.json')).status,0);cases++;console.log(JSON.stringify({passed:true,startup_failure_cases:cases}));
}finally{await rm(dir,{recursive:true,force:true});}
