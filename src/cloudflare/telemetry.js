// Product-specific adapter, embedded by the Kujo generator. Never log inputs.
const analyticsTools = new Set(DATA.registry.tools.map(t => t.name));
const analyticsSlugs = new Set(DATA.items.map(i => i.slug));
const analyticsProfiles = new Set(Object.keys(DATA.registry.installations));
const analyticsSearchTools = new Set(['search_kujo_catalog','recommend_kujo_stack','list_webops_capabilities']);
const analyticsTopics = [
  ['installation', /\b(install|installation|setup|package|kennel)\b/i],
  ['agents', /\b(agent|agents|approval|approvals|orchestration)\b/i],
  ['deployment', /\b(deploy|deployment|hosting|cloudflare|server)\b/i],
  ['testing', /\b(test|tests|testing|eval|quality|debug|debugging)\b/i],
  ['webops', /\b(webops|seo|accessibility|website|content)\b/i],
  ['retrieval', /\b(rag|retrieval|embeddings|knowledge)\b/i],
  ['mcp', /\bmcp\b/i]
];
function analyticsRows(p, result, elapsed) {
  if (!object(p) || !own(p,'id') || !['initialize','tools/call'].includes(p.method) || !result) return [];
  const candidate = typeof p.params?.name === 'string' ? trimText(p.params.name) : '';
  const tool = analyticsTools.has(candidate) ? candidate : 'unknown';
  const data = result.result?.structuredContent;
  const isError = Boolean(result.error || result.result?.isError);
  const n = Array.isArray(data?.recommendations) ? data.recommendations.length : Number.isInteger(data?.returned) ? data.returned : null;
  const outcome = result.error ? 'protocol_error' : isError ? 'tool_error' : n === 0 ? 'empty' : 'success';
  const rows = [['calls',p.method === 'initialize' ? 'initialize' : 'tool'], ['outcome',outcome],
    ['latency', elapsed < 10 ? 'under_10ms' : elapsed < 50 ? '10_49ms' : elapsed < 200 ? '50_199ms' : '200ms_plus'],
    ['revision', DATA.source.snapshot_sha256]];
  if (p.method === 'initialize') return rows;
  rows.push(['tool',tool]);
  if (analyticsSearchTools.has(tool)) {
    // Classification is local and transient; only a fixed category survives.
    const raw = p.params?.arguments?.query ?? p.params?.arguments?.task ?? '';
    const text = typeof raw === 'string' ? raw.slice(0,1000) : '';
    rows.push(['topic',analyticsTopics.find(([,regex])=>regex.test(text))?.[0] || 'unclassified']);
    if (!isError) rows.push(['search_outcome',n === 0 ? 'empty' : 'nonempty']);
  }
  if (!isError) {
    if (n !== null) rows.push(['results',n === 0 ? 'zero' : n <= 5 ? '1_5' : n <= 20 ? '6_20' : '21_plus']);
    if (tool === 'get_catalog_item' && analyticsSlugs.has(data?.slug)) rows.push(['item',data.slug]);
    if (tool === 'get_installation') {
      const value = typeof p.params?.arguments?.profile === 'string' ? trimText(p.params.arguments.profile).toLowerCase() || 'default' : 'default';
      if (analyticsProfiles.has(value)) rows.push(['profile',value]);
    }

  } else if (tool === 'get_catalog_item') rows.push(['item','unknown']);
  return rows;
}
function analyticsRecord(request, env, ctx, p, result, elapsed) {
  // Caller preferences and synthetic tests are excluded, not tracked as opt-outs.
  if (!env?.ANALYTICS_DB || !ctx?.waitUntil || request.headers.get('dnt') === '1' ||
      request.headers.get('sec-gpc') === '1' || request.headers.get('x-kujo-telemetry') === 'off') return;
  try {
    const rows = analyticsRows(p,result,elapsed);
    if (!rows.length) return;
    const day = new Date().toISOString().slice(0,10);
    // No Request, payload, identity, or timestamp is passed into persistence.
    const writes = rows.map(([dimension,value]) => env.ANALYTICS_DB.prepare(
      'INSERT INTO daily_metrics(day,dimension,value,count) VALUES(?,?,?,1) ON CONFLICT(day,dimension,value) DO UPDATE SET count=count+1'
    ).bind(day,dimension,value));
    if (p.method === 'tools/call') {
      const pick = dimension => rows.find(([d])=>d===dimension)?.[1];
      const detail = [day,pick('tool'),pick('topic') || (analyticsSearchTools.has(pick('tool'))?'unclassified':'not_applicable'),pick('outcome'),pick('latency'),DATA.source.snapshot_sha256,pick('item')||'',pick('profile')||'',pick('results')||'not_applicable'];
      writes.push(env.ANALYTICS_DB.prepare('INSERT INTO daily_details(day,tool,topic,outcome,latency,revision,item,profile,results,count) VALUES(?,?,?,?,?,?,?,?,?,1) ON CONFLICT(day,tool,topic,outcome,latency,revision,item,profile,results) DO UPDATE SET count=count+1').bind(...detail));
    }
    ctx.waitUntil(Promise.resolve(env.ANALYTICS_DB.batch(writes)).catch(()=>{}));
  } catch { /* Analytics must never change an MCP response. */ }
}
// Fixed issuer: no URL or signing key is ever selected from caller input.
const analyticsIssuer = 'https://dark-lab-27db.cloudflareaccess.com';
const analyticsKeys = KujoAccessJose.createRemoteJWKSet(new URL(analyticsIssuer+'/cdn-cgi/access/certs'),
  {timeoutDuration:5000,cooldownDuration:30000,cacheMaxAge:300000});
async function analyticsAuthorized(request, env) {
  if (!/^[a-f0-9]{64}$/.test(env?.ANALYTICS_ACCESS_AUD || '') || !env?.ANALYTICS_OWNER_EMAIL) return false;
  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token || token.length > 16384) return false;
  try {
    const {payload} = await KujoAccessJose.jwtVerify(token,analyticsKeys,{
      issuer:analyticsIssuer,audience:env.ANALYTICS_ACCESS_AUD,algorithms:['RS256'],
      requiredClaims:['exp','iat','sub','email'],maxTokenAge:'30 minutes',clockTolerance:5
    });
    return payload.type === 'app' && payload.email === env.ANALYTICS_OWNER_EMAIL;
  } catch { return false; }
}
const analyticsHtml = __ANALYTICS_HTML__;
const analyticsJs = __ANALYTICS_JS__;
const analyticsNotice = __ANALYTICS_NOTICE__;
function analyticsResponse(body, type, status=200) {
  return new Response(body,{status,headers:{'content-type':type,'cache-control':'no-store',
    'content-security-policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
    'x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY',
    'x-robots-tag':'noindex, nofollow'}});
}
async function analyticsRoute(request, env, ctx) {
  const path = new URL(request.url).pathname;
  if (!['/analytics','/analytics/app.js','/analytics/data','/analytics/health','/analytics/export','/telemetry'].includes(path)) return null;
  if (request.method !== 'GET') return analyticsResponse('Method not allowed','text/plain',405);
  if (request.headers.has('origin') && request.headers.get('origin') !== 'https://mcp.kujolang.ai') return analyticsResponse('Forbidden','text/plain',403);
  if (path === '/telemetry') return analyticsResponse(analyticsNotice,'text/plain; charset=utf-8');
  if (!await analyticsAuthorized(request,env)) return analyticsResponse('{"error":"Unauthorized"}','application/json',401);
  if (path === '/analytics') return analyticsResponse(analyticsHtml,'text/html; charset=utf-8');
  if (path === '/analytics/app.js') return analyticsResponse(analyticsJs,'text/javascript; charset=utf-8');
  if (!env?.ANALYTICS_DB) return analyticsResponse('{"error":"Analytics unavailable"}','application/json',503);
  try {
    if (path === '/analytics/health') return analyticsResponse(JSON.stringify(await analyticsHealth(env)),'application/json');
    const query=analyticsQuery(new URL(request.url).searchParams);
    if (path === '/analytics/export') return analyticsExport(env,query,new URL(request.url).searchParams.get('format')||'json');
    return analyticsResponse(JSON.stringify(await analyticsPage(env,query)),'application/json');
  } catch(error) { return analyticsResponse(JSON.stringify({error:error instanceof RangeError?'Invalid analytics query':'Analytics unavailable'}),'application/json',error instanceof RangeError?400:503); }
}
