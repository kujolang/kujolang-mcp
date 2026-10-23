const analyticsKeysFor = dataset => dataset==='totals'?['day','dimension','value']:['day','tool','topic','outcome','latency','revision','item','profile','results'];
const analyticsToday = () => new Date().toISOString().slice(0,10);
function analyticsDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)||value<'2000-01-01'||value>'9999-12-31'||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value) throw new RangeError();
  return value;
}
function analyticsQuery(params) {
  const q={dataset:params.get('dataset')||'totals',from:analyticsDate(params.get('from')||'2000-01-01'),to:analyticsDate(params.get('to')||analyticsToday()),group:params.get('group')||'day',tool:params.get('tool')||'',topic:params.get('topic')||'',revision:params.get('revision')||'',cursor:params.get('cursor')||''};
  if (!['totals','details'].includes(q.dataset)||!['day','week','month'].includes(q.group)||q.from>q.to||q.to>analyticsToday()||q.cursor.length>4096) throw new RangeError();
  if (q.tool&&!/^[a-zA-Z0-9_]{1,128}$/.test(q.tool)||q.topic&&!['not_applicable','unclassified',...analyticsTopics.map(([t])=>t)].includes(q.topic)||q.revision&&!/^[a-f0-9]{64}$/.test(q.revision)) throw new RangeError();
  if(q.dataset==='totals'&&(q.tool||q.topic||q.revision))throw new RangeError();
  return q;
}
const analyticsQueryIdentity = q => JSON.stringify([q.dataset,q.from,q.to,q.group,q.tool,q.topic,q.revision]);
async function analyticsPage(env,q) {
  const keys=analyticsKeysFor(q.dataset), rest=keys.slice(1);
  const period=q.group==='month'?"substr(day,1,7)||'-01'":q.group==='week'?"date(day,'-'||((CAST(strftime('%w',day) AS INTEGER)+6)%7)||' days')":'day';
  const where=['day >= ?','day <= ?'],bindings=[q.from,q.to];
  for(const field of ['tool','topic','revision'])if(q[field]){where.push(field+' = ?');bindings.push(q[field]);}
  let after='';
  if(q.cursor){
    let c;try{c=JSON.parse(atob(q.cursor));}catch{throw new RangeError();}
    if(c.query!==analyticsQueryIdentity(q)||!Array.isArray(c.keys)||c.keys.length!==keys.length||c.keys.some(k=>typeof k!=='string'||k.length>128))throw new RangeError();
    after=' WHERE ('+keys.join(',')+') > ('+keys.map(()=>'?').join(',')+')';bindings.push(...c.keys);
  }
  const sql=`SELECT * FROM (SELECT ${period} AS day,${rest.join(',')},SUM(count) AS count FROM ${q.dataset==='totals'?'daily_metrics':'daily_details'} WHERE ${where.join(' AND ')} GROUP BY ${period},${rest.join(',')})${after} ORDER BY ${keys.join(',')} LIMIT 501`;
  const result=await env.ANALYTICS_DB.prepare(sql).bind(...bindings).all();
  if(result.success===false)throw Error('database unavailable');
  const rows=result.results.slice(0,500),last=rows.at(-1);
  return {schema_version:2,dataset:q.dataset,from:q.from,to:q.to,group:q.group,rows,next_cursor:result.results.length>500?btoa(JSON.stringify({query:analyticsQueryIdentity(q),keys:keys.map(k=>last[k])})):null};
}
function analyticsExport(env,q,format) {
  if(!['csv','json'].includes(format)||q.cursor)throw new RangeError();
  const keys=[...analyticsKeysFor(q.dataset),'count'],encoder=new TextEncoder();let started=false,done=false,cursor='';
  const quote=value=>'"'+String(value).replace(/^[=+@\-]/,"'"+'$&').replaceAll('"','""')+'"';
  const stream=new ReadableStream({async pull(controller){
    if(done)return;
    try{
      const page=await analyticsPage(env,{...q,cursor});let text='';
      if(!started)text=format==='csv'?keys.join(',')+'\r\n':JSON.stringify({schema_version:2,dataset:q.dataset,from:q.from,to:q.to,group:q.group,exported_at:new Date().toISOString(),live_day_provisional:true}).slice(0,-1)+',"rows":[';
      if(format==='csv')text+=page.rows.map(r=>keys.map(k=>quote(r[k])).join(',')+'\r\n').join('');
      else text+=(started&&page.rows.length?',':'')+page.rows.map(r=>JSON.stringify(r)).join(',');
      cursor=page.next_cursor;started=true;
      if(!cursor){done=true;if(format==='json')text+=']}';}
      controller.enqueue(encoder.encode(text));if(done)controller.close();
    }catch(error){done=true;controller.error(Error('Export interrupted; retry the download.'));}
  },cancel(){done=true;}});
  const response=analyticsResponse(stream,format==='csv'?'text/csv; charset=utf-8':'application/json');
  response.headers.set('content-disposition',`attachment; filename="kujo-${q.dataset}-${q.from}-${q.to}.${format}"`);return response;
}
async function analyticsState(env) {
  const result=await env.ANALYTICS_DB.prepare('SELECT key,value FROM analytics_state').bind().all();
  return Object.fromEntries(result.results.map(r=>[r.key,r.value]));
}
async function analyticsSetState(env,values){
  await env.ANALYTICS_DB.batch(Object.entries(values).map(([k,v])=>env.ANALYTICS_DB.prepare('INSERT INTO analytics_state(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(k,String(v))));
}
async function analyticsHealth(env) {
  const state=await analyticsState(env);
  const bounds=(await env.ANALYTICS_DB.prepare('SELECT MIN(day) AS first_day,MAX(day) AS last_day FROM daily_metrics').bind().all()).results[0];
  const facets={},facets_truncated=[];for(const field of ['tool','topic','revision']){facets[field]=(await env.ANALYTICS_DB.prepare(`SELECT DISTINCT ${field} AS value FROM daily_details ORDER BY ${field} LIMIT 1001`).bind().all()).results.map(r=>r.value);if(facets[field].length>1000){facets[field].length=1000;facets_truncated.push(field);}}
  return {state,...bounds,facets,facets_truncated,database_read:'ok',heartbeat:!state.heartbeat?'not_yet_verified':Date.now()-Date.parse(state.heartbeat)>150*60000?'stale':'recent',backups_configured:Boolean(env.ANALYTICS_BACKUPS),collection_note:'Heartbeat verifies database write/read, not delivery of every request. Quiet traffic and lost writes cannot always be distinguished. Today is provisional; opt-outs are excluded.'};
}
async function analyticsBackupDay(env,day) {
  const payload={schema_version:2,day,totals:[],details:[]};
  for(const dataset of ['totals','details']){
    let cursor='';do{const page=await analyticsPage(env,{dataset,from:day,to:day,group:'day',tool:'',topic:'',revision:'',cursor});payload[dataset].push(...page.rows);cursor=page.next_cursor;if(payload[dataset].length>50000)throw Error('backup day too large');}while(cursor);
  }
  const body=JSON.stringify(payload),sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body))),b=>b.toString(16).padStart(2,'0')).join('');
  const key=`v2/objects/${day}/${sha}.json`;
  await env.ANALYTICS_BACKUPS.put(key,body,{httpMetadata:{contentType:'application/json'}});
  const saved=await env.ANALYTICS_BACKUPS.get(key);
  if(!saved||await saved.text()!==body)throw Error('backup verification failed');
  await env.ANALYTICS_BACKUPS.put(`v2/days/${day}.json`,JSON.stringify({key,sha256:sha,day,verified_at:new Date().toISOString(),provisional:day===analyticsToday()}));
  return key;
}
async function analyticsMaintenance(env) {
  if(!env?.ANALYTICS_DB)return;
  const now=new Date().toISOString(),today=analyticsToday(),yesterday=new Date(Date.parse(today)-86400000).toISOString().slice(0,10);
  await analyticsSetState(env,{heartbeat:now});
  const state=await analyticsState(env);if(state.heartbeat!==now)throw Error('heartbeat readback failed');
  try{
    if(!env.ANALYTICS_BACKUPS)throw Error('backup storage missing');
    const first=(await env.ANALYTICS_DB.prepare('SELECT MIN(day) AS first_day FROM daily_metrics').bind().all()).results[0]?.first_day;
    let day=state.archive_through?new Date(Date.parse(state.archive_through)+86400000).toISOString().slice(0,10):first||today;
    // Bounded catch-up; hourly scheduling resumes from the last verified day.
    for(let i=0;day<today&&i<7;i++){
      await analyticsBackupDay(env,day);await analyticsSetState(env,{archive_through:day});day=new Date(Date.parse(day)+86400000).toISOString().slice(0,10);
    }
    // Recheck yesterday for delayed writes; preserve earlier content-addressed snapshots.
    if(first&&first<=yesterday)await analyticsBackupDay(env,yesterday);
    const key=await analyticsBackupDay(env,today);
    const after=await analyticsState(env);
    await env.ANALYTICS_BACKUPS.put('v2/index.json',JSON.stringify({schema_version:2,first_day:first||today,archive_through:after.archive_through||null,latest_day:today,latest_key:key,verified_at:now,manifest_pattern:'v2/days/YYYY-MM-DD.json'}));
    await analyticsSetState(env,{backup_success:now,backup_attempt:now,backup_error:'',backup_latest:key});
  }catch{
    await analyticsSetState(env,{backup_attempt:now,backup_error:'Backup failed; previous verified snapshots are retained.'});
    throw Error('Analytics backup failed');
  }
}
