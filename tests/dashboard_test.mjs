import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
class Element {
 constructor(){this.children=[];this.style={};this.listeners={};this.hidden=true;this.textContent='';}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=nodes;}
 getContext(){return {fillRect(){},fillStyle:""};}
 setAttribute(){}
 addEventListener(name,fn){this.listeners[name]=fn;}
}
const elements=new Map();
const document={getElementById(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);},createElement(){return new Element();}};
const window=new Element();let reply;const requests=[];
const context=vm.createContext({document,window,Intl,Date,Math,AbortSignal,fetch:async(url,options)=>{requests.push({url,options});return reply;}});
reply={ok:true,async json(){return {rows:[{day:new Date().toISOString().slice(0,10),dimension:'calls',value:'tool',count:7}]};}};
vm.runInContext(await readFile('src/cloudflare/vendor/dashboard-bundle.js','utf8'),context);
await new Promise(resolve=>setImmediate(resolve));
const el=id=>document.getElementById(id);
assert.equal(el('dashboard').hidden,false);assert.equal(el('summary').children[0].children[1].textContent,'7');
assert.equal(requests[0].options.credentials,'same-origin');assert.equal(requests[0].options.redirect,'error');assert.equal(requests[0].options.headers,undefined);
reply={ok:false,status:401};await el('refresh').listeners.click();
assert.equal(el('dashboard').hidden,true);assert.equal(el('summary').children.length,0);assert.equal(el('reauth').hidden,false);
let resolve;reply=new Promise(r=>{resolve=r;});const loading=el('refresh').listeners.click();
el('logout').listeners.click();resolve({ok:true,async json(){return {rows:[]};}});await loading;
assert.equal(el('dashboard').hidden,true);assert.equal(el('summary').children.length,0);
reply={ok:true,async json(){return {rows:[]};}};await el('refresh').listeners.click();assert.equal(el('dashboard').hidden,false);
window.listeners.pagehide();assert.equal(el('dashboard').hidden,true);assert.equal(el('daily').children.length,0);
console.log('Dashboard rendering, cookie transport, expiration, sign-out race and history clearing passed');
