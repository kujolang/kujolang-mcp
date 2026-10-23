let accessKey = '';
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
async function load() {
  const generation=++requestGeneration;
  el('status').textContent='Loading aggregate counters…';
  try {
    const response=await fetch('/analytics/data',{headers:{authorization:'Bearer '+accessKey},cache:'no-store',credentials:'omit',redirect:'error',signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error(response.status===401?'Access key was not accepted.':'Analytics is unavailable. Try again later.');
    const data=await response.json();if(generation!==requestGeneration)return;
    const totals={};for(const row of data.rows){totals[row.dimension]??={};totals[row.dimension][row.value]=(totals[row.dimension][row.value]||0)+row.count;}
    const count=(d,v)=>totals[d]?.[v]||0;const searches=count('search_outcome','empty')+count('search_outcome','nonempty');
    el('summary').replaceChildren();
    for(const [label,value] of [['Tool calls',number(count('calls','tool'))],['Initializations (not people)',number(count('calls','initialize'))],['Empty searches',searches?(100*count('search_outcome','empty')/searches).toFixed(1)+'%':'No searches yet'],['Protocol / tool errors',number(count('outcome','protocol_error')+count('outcome','tool_error'))]]){const a=document.createElement('article');a.append(node('h2',label));const n=node('div',value);n.className='number';a.append(n);el('summary').append(a);}
    const days=[];for(let i=29;i>=0;i--){const date=new Date();date.setUTCDate(date.getUTCDate()-i);const day=date.toISOString().slice(0,10);days.push([day,data.rows.filter(r=>r.day===day&&r.dimension==='calls'&&r.value==='tool').reduce((sum,r)=>sum+r.count,0)]);}
    const chart=document.createElement('div');chart.className='daily-chart';chart.setAttribute('role','img');chart.setAttribute('aria-label','Daily tool calls across the last 30 UTC days. Exact counts are available below.');
    const peak=Math.max(1,...days.map(([,value])=>value));
    for(const [day,value] of days){const bar=document.createElement('div');bar.className='day-bar';bar.style.height=Math.max(1,value/peak*100)+'%';bar.title=day+': '+number(value)+' calls';chart.append(bar);}
    const caption=node('p',days[0][0]+' — '+days.at(-1)[0]+' · peak '+number(peak===1&&days.every(([,v])=>v===0)?0:peak)+' calls/day');
    const details=document.createElement('details');details.append(node('summary','Daily counts'),table(days));
    el('daily').replaceChildren(chart,caption,details);el('breakdowns').replaceChildren();
    for(const [dimension,title] of [['tool','Tools'],['topic','Search topics'],['item','Requested public items'],['profile','Installation profiles'],['outcome','Outcomes'],['results','Result counts'],['latency','Dispatch latency'],['revision','Catalog revisions']]){const a=document.createElement('article');a.append(node('h2',title));const entries=Object.entries(totals[dimension]||{}).sort((a,b)=>b[1]-a[1]);a.append(entries.length?table(entries):node('p','No recorded activity yet.'));el('breakdowns').append(a);}
    el('dashboard').hidden=false;el('login').hidden=true;el('token').value='';el('status').textContent='Updated '+new Date().toLocaleTimeString()+'. Counts are activity, not people or satisfaction.';
  } catch(error){if(generation===requestGeneration)el('status').textContent=error.message;}
}
el('unlock').addEventListener('click',()=>{accessKey=el('token').value.trim();el('token').value='';load();});
el('token').addEventListener('keydown',event=>{if(event.key==='Enter')el('unlock').click();});
el('refresh').addEventListener('click',load);
el('logout').addEventListener('click',()=>{++requestGeneration;accessKey='';el('dashboard').hidden=true;el('login').hidden=false;for(const id of ['summary','daily','breakdowns'])el(id).replaceChildren();el('status').textContent='Dashboard locked.';});
