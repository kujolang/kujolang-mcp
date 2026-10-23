// Synthetic scaling of selection only; not full catalog/runtime or edge measurements.
import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {performance} from 'node:perf_hooks';
const items=JSON.parse(await readFile('data/catalog.json','utf8')).items;
const old=(xs,k)=>{let rest=xs,out=[];while(out.length<k&&rest.length){let best=0;for(let i=1;i<rest.length;i++)if(rest[i].score>rest[best].score)best=i;out.push(rest[best]);rest=rest.filter((_,i)=>i!==best);}return out;};
const sorted=(xs,k)=>[...xs].sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,k);
const bounded=(xs,k)=>{let out=[];for(const x of xs){if(out.length===k&&x.score<=out.at(-1).score)continue;let p=out.findIndex(v=>x.score>v.score);if(p<0)p=out.length;out.splice(p,0,x);if(out.length>k)out.pop();}return out;};
const results=[];
for(const size of [items.length,1000,10000,50000])for(const k of [10,50]){
 const xs=Array.from({length:size},(_,i)=>({i,score:1+((i*17)%23),slug:items[i%items.length].slug}));const expected=old(xs,k);
 for(const [name,fn] of Object.entries({old,sorted,bounded})){assert.deepEqual(fn(xs,k),expected);const samples=[];for(let n=0;n<35;n++){const t=performance.now();fn(xs,k);if(n>=5)samples.push(performance.now()-t);}samples.sort((a,b)=>a-b);results.push({size,k,algorithm:name,p50_ms:samples[14],p95_ms:samples[28],p99_ms:samples[29]});}
}
console.log(JSON.stringify({node:process.version,scope:'synthetic selection only, 30 measured iterations after 5 warmups; deterministic ties verified',results},null,2));
