import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
class Element {
 constructor(){this.children=[];this.style={};this.listeners={};this.hidden=true;this.textContent='';this.value='';this.checked=true;}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=nodes;}
 getContext(){return {fillRect(){},fillStyle:''};}
 setAttribute(){}
 addEventListener(name,fn){this.listeners[name]=fn;}
}
const elements=new Map();const document={getElementById(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);},createElement(){return new Element();}};
const el=id=>document.getElementById(id);el('range').value='30';el('group').value='day';
const window=new Element(),requests=[];let fail=false,pending=null;
const date=new Date().toISOString().slice(0,10),rev='a'.repeat(64);
const health={state:{details_since:'2020-01-01',heartbeat:new Date().toISOString(),backup_success:'2026-10-23'},facets:{tool:['search_kujo_catalog'],topic:['agents'],revision:[rev]},first_day:'2020-01-01',last_day:date,heartbeat:'recent',database_read:'ok',backups_configured:true,collection_note:'Best effort'};
const context=vm.createContext({document,window,Intl,Date,Math,AbortSignal,URLSearchParams,fetch:async(url,options)=>{
 requests.push({url,options});if(pending)return pending;if(fail)return {ok:false,status:401};
 const q=new URL(url,'https://example.com').searchParams;
 let data=url.includes('/health')?health:{rows:q.get('dataset')==='clients'?[{day:date,client:'codex',method:'tools/call',tool:'search_kujo_catalog',outcome:'empty',source:'user_agent',count:3}]:q.get('dataset')==='details'?[{day:date,tool:'search_kujo_catalog',topic:'agents',outcome:'empty',latency:'under_10ms',revision:rev,item:'',profile:'',results:'zero',count:2}]:[{day:date,dimension:'calls',value:'tool',count:7}],next_cursor:null};
 return {ok:true,async json(){return data;}};
}});
vm.runInContext(await readFile('src/cloudflare/vendor/dashboard-bundle.js','utf8'),context);
await new Promise(resolve=>setImmediate(resolve));
assert.equal(el('dashboard').hidden,false);assert.equal(el('summary').children[0].children[1].textContent,'7');assert.equal(el('downloads').children.length,10);
assert.equal(requests[0].options.credentials,'same-origin');assert.equal(requests[0].options.redirect,'error');assert.equal(requests[0].options.headers,undefined);
assert(JSON.stringify(el('clients')).includes('Codex'));assert(JSON.stringify(el('clients')).includes('Unknown'));assert(JSON.stringify(el('clients')).includes('Other'));assert(el('downloads').children.some(n=>n.href?.includes('dataset=clients')));
el('tool').value='search_kujo_catalog';await el('refresh').listeners.click();assert.equal(el('summary').children[0].children[1].textContent,'2');assert.equal(el('summary').children[2].children[1].textContent,'100.0%');assert(el('downloads').children[0].href.includes('dataset=details'));assert(el('downloads').children[0].href.includes('tool=search_kujo_catalog'));
el('range').value='all';el('range').listeners.change();assert.equal(el('from').value,'2020-01-01');
el('range').value='custom';el('from').value='2026-01-10';el('to').value='2026-01-01';await el('refresh').listeners.click();assert(el('status').textContent.includes('valid UTC date'));assert.equal(el('dashboard').hidden,true);
el('range').value='30';el('range').listeners.change();fail=true;await el('refresh').listeners.click();assert.equal(el('dashboard').hidden,true);assert.equal(el('summary').children.length,0);assert.equal(el('reauth').hidden,false);
fail=false;let resolve;pending=new Promise(r=>{resolve=r;});const loading=el('refresh').listeners.click();el('logout').listeners.click();resolve({ok:true,async json(){return health;}});await loading;assert.equal(el('dashboard').hidden,true);
pending=null;await el('refresh').listeners.click();assert.equal(el('dashboard').hidden,false);window.listeners.pagehide();assert.equal(el('dashboard').hidden,true);assert.equal(el('downloads').children.length,0);
console.log('Dashboard filters, detailed metrics, comparisons, full/filtered downloads, date errors, expiration and stale-response clearing passed');
