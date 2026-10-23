import {paintColumn} from './vendor/dither-kit/dither-paint.ts';
let requestGeneration = 0;
const el = id => document.getElementById(id);
const number = n => new Intl.NumberFormat().format(n);
const node = (tag,text) => {const n=document.createElement(tag);n.textContent=text;return n;};
function table(entries,bars=false) {
  const t=document.createElement('table');const max=Math.max(1,...entries.map(([,v])=>v));
  const head=document.createElement('tr');head.append(node('th','Category'),node('th','Calls'));t.append(head);
  for(const [key,value] of entries){const tr=document.createElement('tr');const label=node('td',key);if(bars){const bar=document.createElement('div');bar.className='bar';bar.style.width=(value/max*100)+'%';label.append(bar);}tr.append(label,node('td',number(value)));t.append(tr);}
  return t;
}
function chart(entries,label) {
  const plot=document.createElement('div');plot.className='daily-chart';plot.setAttribute('role','img');plot.setAttribute('aria-label',label+' Exact counts are available in the table.');
  const peak=Math.max(1,...entries.map(([,value])=>value));
  for(const [name,value] of entries){
    const bar=document.createElement('canvas');bar.className='day-bar';bar.width=12;bar.height=80;
    bar.style.height=(value/peak*100)+'%';bar.title=name+': '+number(value)+' calls';
    const painter=bar.getContext('2d');
    if(painter&&value>0)for(let x=0;x<12;x++)paintColumn(painter,x,0,80,{fill:[220,230,224],line:[220,230,224],star:[255,255,255]},{variant:'gradient',intensity:0,dim:1,stacked:false});
    plot.append(bar);
  }
  return plot;
}
async function load() {
  const generation=++requestGeneration;
  el('status').textContent='Loading aggregate counters…';
  try {
    const response=await fetch('/analytics/data',{cache:'no-store',credentials:'same-origin',redirect:'error',signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error(response.status===401?'Your login expired. Sign in again.':'Analytics is unavailable. Try again later.');
    const data=await response.json();if(generation!==requestGeneration)return;
    const totals={};for(const row of data.rows){totals[row.dimension]??={};totals[row.dimension][row.value]=(totals[row.dimension][row.value]||0)+row.count;}
    const count=(d,v)=>totals[d]?.[v]||0;const searches=count('search_outcome','empty')+count('search_outcome','nonempty');
    el('summary').replaceChildren();
    for(const [label,value] of [['Tool calls',number(count('calls','tool'))],['Initializations (not people)',number(count('calls','initialize'))],['Empty searches',searches?(100*count('search_outcome','empty')/searches).toFixed(1)+'%':'No searches yet'],['Protocol / tool errors',number(count('outcome','protocol_error')+count('outcome','tool_error'))]]){const a=document.createElement('article');a.append(node('h2',label));const n=node('div',value);n.className='number';a.append(n);el('summary').append(a);}
    const days=[];for(let i=29;i>=0;i--){const date=new Date();date.setUTCDate(date.getUTCDate()-i);const day=date.toISOString().slice(0,10);days.push([day,data.rows.filter(r=>r.day===day&&r.dimension==='calls'&&r.value==='tool').reduce((sum,r)=>sum+r.count,0)]);}
    const dailyChart=chart(days,'Daily tool calls across the last 30 UTC days.');
    const peak=Math.max(1,...days.map(([,value])=>value));
    const caption=node('p',days[0][0]+' — '+days.at(-1)[0]+' · peak '+number(peak===1&&days.every(([,v])=>v===0)?0:peak)+' calls/day');
    const details=document.createElement('details');details.append(node('summary','Daily counts'),table(days));
    el('daily').replaceChildren(dailyChart,caption,details);el('breakdowns').replaceChildren();
    for(const [dimension,title] of [['tool','Tools'],['topic','Search topics'],['item','Requested public items'],['profile','Installation profiles'],['outcome','Outcomes'],['results','Result counts'],['latency','Dispatch latency'],['revision','Catalog revisions']]){const a=document.createElement('article');a.append(node('h2',title));const entries=Object.entries(totals[dimension]||{}).sort((a,b)=>b[1]-a[1]);if(entries.length){if(['tool','topic','outcome'].includes(dimension))a.append(chart(entries.slice(0,8),title+' — top eight categories, ordered as in the table.'));a.append(table(entries));}else a.append(node('p','No recorded activity yet.'));el('breakdowns').append(a);}
    el('dashboard').hidden=false;el('reauth').hidden=true;el('status').textContent='Updated '+new Date().toLocaleTimeString()+'. Counts are activity, not people or satisfaction.';
  } catch(error){if(generation===requestGeneration){clear();el('reauth').hidden=false;el('status').textContent='Unable to load counters. Sign in again or retry shortly.';}}
}
function clear(){el('dashboard').hidden=true;for(const id of ['summary','daily','breakdowns'])el(id).replaceChildren();}
el('refresh').addEventListener('click',load);
el('logout').addEventListener('click',()=>{++requestGeneration;clear();});
window.addEventListener('pagehide',()=>{++requestGeneration;clear();});
window.addEventListener('pageshow',event=>{if(event.persisted)load();});
load();
