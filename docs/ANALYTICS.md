# Analytics operations

- Dashboard: https://mcp.kujolang.ai/analytics
- Notice: https://mcp.kujolang.ai/telemetry
- Data: authenticated GET /analytics/data, retained daily history with keyset pagination.
- Exports: authenticated GET /analytics/export (CSV/JSON, streaming all matching pages).
- Health: authenticated GET /analytics/health.
- Storage: `ANALYTICS_DB`, D1 database `kujolang-mcp-analytics`.
- Maintenance: hourly at minute17 UTC. No automatic counter deletion.
- Backups: private R2 bucket kujolang-mcp-analytics-backups, binding ANALYTICS_BACKUPS.

Cloudflare Access protects `/analytics` and all child paths. The self-hosted application
`Kujolang MCP Analytics` permits only the existing account owner through the configured
One-time PIN identity provider. Sessions last 30 minutes. Cookies are HttpOnly,
SameSite=Lax, path-scoped, and use the binding cookie. The application is hidden from
the launcher. Public `/mcp`, `/health`, and `/telemetry` remain unauthenticated.

The Worker independently validates Cloudflare's signed `Cf-Access-Jwt-Assertion` using
pinned jose: RS256 signature against the fixed team-domain JWKS, exact issuer and
`ANALYTICS_ACCESS_AUD`, expiry, issued-at, 30-minute maximum age, application token type,
and owner email stored in the `ANALYTICS_OWNER_EMAIL` Worker secret. It never trusts an
email header or an unverified JWT. Missing configuration, invalid tokens and key-fetch
failures fail closed. JWKS requests have a five-second timeout and bounded caching.
`ctx.access` was absent on this deployed path-based Access route, so it is not required.
The old shared key is retired; no bearer fallback exists. The dashboard uses same-origin
Access cookies and provides Cloudflare sign-out. Email OTP is not phishing-resistant MFA;
an owner-managed SSO provider with enforced MFA can replace it later.

Application ID: `ac8e5a76-1c41-4a2b-b078-94a157c84d90`.
Owner-only policy ID: `73ce2d96-1426-4271-bbe4-444220442230`.
Keep the Access audience in wrangler.jsonc aligned with this application. When changing
owner access, update both the exact-email Access policy and the Worker owner secret.
Do not add bypass policies or public Worker/preview routes. Never disable Access to
work around a login problem. Cloudflare handles operator login cookies and authentication
logs separately from the aggregate D1 counters. No operator identity is written to D1.

## Deployment and tests

Run `npm ci --ignore-scripts`, `npm run build:access`, and `npm run build:dashboard`
to reproduce the pinned verifier and dashboard bundles; CI checks its exact contents. Its license is retained beside the bundle.
The Kujo generator embeds this verifier, the reviewed generic framework template plus
`src/cloudflare/telemetry.js`, `dashboard.html`, `dashboard.js`, and `docs/TELEMETRY.md`.
It records the rendered adapter hash in `dist/generation.json`. Never hand-edit dist.
The framework remains unmodified; its exact upstream commit is in build-inputs.json.

```sh
kujo run scripts/generate_worker.kujo --interpreter -- --framework /path/to/pinned/mcp
node tests/analytics_test.mjs
python3 tests/analytics_storage_test.py
npx wrangler@4.151.3 d1 migrations apply ANALYTICS_DB --remote
npx wrangler@4.151.3 deploy --dry-run
npx wrangler@4.151.3 deploy
node tests/production_catalog_test.mjs
node tests/production_release_test.mjs
```

Provision migrations before deploying code that uses new columns. Existing CI deploys
only when Cloudflare deployment secrets exist; the authorized local Wrangler login is
currently the operational deployment path. Never commit credentials to enable CI.

D1 writes increment historical dimension totals and a bounded detailed aggregate atomically in a batch. There is no event
or session table. Each recorded request causes at most twelve statements, including its detailed counter;
monitor D1 limits and costs before changing traffic or plan. This deployment does not upgrade
the account. Analytics quota exhaustion is an undercount, not an MCP outage. An empty
successful dashboard query does not prove the write path is healthy: check D1 metrics and
scheduled execution and backup health in Cloudflare. History is retained until explicitly removed. D1 recovery backups follow the account's Time Travel policy.

To disable collection, remove the `ANALYTICS_DB` binding and deploy. MCP remains functional;
the dashboard returns unavailable. Disable the cron and manage database and private backup deletion separately
if retiring analytics. Never roll back to a configuration that re-enables request logs.

Browser verification: open `/analytics`, complete the owner Access login, check the
counters, refresh, and sign out. Signed-out HTML, JS and data requests must redirect to
Access; an authenticated different identity must be denied. Check a narrow viewport for
horizontal overflow. Do not save session cookies or login codes in test artifacts.
`node tests/dashboard_test.mjs` covers rendering, expiration and stale-response clearing
with an isolated DOM fixture, without production credentials.

Daily activity, tool, topic and outcome charts use the source-vendored Dither Kit 0.1.1
paint engine. Its MIT license and source hashes live in src/cloudflare/vendor/dither-kit.
Exact counts remain accessible in tables, zero values have zero-height bars, and no chart
requests external scripts, fonts or tracking endpoints. Category plots show the top eight
entries in the same order as their tables; all category rows remain visible in those tables.

## Long-term queries and exports

`from` and `to` are inclusive YYYY-MM-DD UTC dates. `dataset=totals|details|clients`,
`group=day|week|month` (Monday weeks), optional `tool`, `topic`, `revision` filters for
`details` and `clients` only. Invalid dates, filters or cursor/query combinations return400.
`/analytics/data` returns at most500 grouped rows plus `next_cursor`; continue until null.
There is no silent row truncation. API keyset order includes every aggregation key.
`/analytics/export` accepts the same filters plus `format=csv|json`, and streams all pages.
CSV fields are quoted and spreadsheet-formula prefixes escaped. Downloads are owner-only,
no-store, with no credential in URLs. Today's data is provisional and can change between
pages; historical days are normally stable. Stop/retry interrupted downloads.

The dashboard compares the preceding equal-length UTC range, shows partial coverage,
and offers day/week/month grouping. Tool/topic/revision filters switch to the detailed
counter dataset. Initializations are not in that dataset and display as unavailable.
Older totals remain usable without filters; historical details cannot be inferred from
separate totals. All-history exports include separate totals, details and clients files; preserve
all three without adding their overlapping counts together. A dashboard view has a100,000-row memory guard;
narrow or group a large view, or use streamed downloads which have no such row cap.

## Backups and recovery

The hourly Worker cron writes/reads a health heartbeat, then backs up at most seven pending
historical days, rechecks yesterday for delayed writes, and snapshots today. Each day contains
all pages of totals/details/clients (up to50,000 rows per dataset per day; exceeding that fails visibly,
never truncates). The content SHA256 identifies `v2/objects/YYYY-MM-DD/<sha>.json`;
read-back must match before publishing `v2/days/YYYY-MM-DD.json`. Earlier content-addressed
objects survive later snapshots. `v2/index.json` records first day, archive progress and the
latest provisional object. No lifecycle expiry or public access is configured.

A backup failure records a fixed status message without raw exceptions or request data.
The last success is preserved. A missing/stale heartbeat (>150 minutes) is a warning;
"recent" verifies only this scheduled path. Last traffic day can also be old on a quiet
server. Always check historical archive progress as well as latest snapshot success.
Do not claim complete collection or an independently audited restore from these indicators.
Monitor Cloudflare storage/operation quotas and cost; long-term storage is not unbounded free
capacity. This change does not enable Workers request logs or introduce visitor identifiers.

To recover, download `v2/index.json`, the day manifests you need, and the immutable objects
they reference using the authenticated Cloudflare account/R2 tooling. Example:

```sh
npx wrangler@4.151.3 r2 object get kujolang-mcp-analytics-backups/v2/index.json --remote --file index.json
```

Verify each object's SHA256 against its manifest before using it. The JSON schema is
`{schema_version:2,day,totals:[{day,dimension,value,count}],details:[{day,tool,topic,outcome,latency,revision,item,profile,results,count}]}`.
Restore into a fresh database created with migrations0001,0002 and0003, not over the live database.
Import one selected snapshot per day (never sum snapshots or overlapping datasets), validate
row counts/sums, then deliberately switch the binding after review. Recreate operational
health state rather than presenting old heartbeats as fresh. Local automated tests restore
backed-up aggregates into fresh SQLite; live deployment verification also checks real R2 content.

Do not roll back to the pre-history Worker: it deletes older totals. Roll forward on a defect,
or stop collection before any rollback that would restore the old retention behavior.

## Client attribution (schema 3)

Migration0003 adds daily_clients and clients_since, preserving earlier datasets.
Client categories use a conservative exact alias allowlist. Only initialization may use
clientInfo.name; other calls inspect a bounded User-Agent for an exact known product
name, optionally followed by a slash version. Generic SDK headers remain Unknown.
The sources client_info/user_agent/none are aggregate labels. No model inference or
session correlation is performed. Names are self-reported, not authenticated. The dashboard
shows initialization and tool-call counts separately, explicitly includes Other/Unknown,
and breaks tool calls down by client/tool/outcome. Dates and tool/topic/revision filters
apply; tool/topic filters naturally exclude initializations. Client collection starts
at clients_since; older history has no client dataset and is not backfilled.

Download clients as well as totals and details to preserve all datasets. Schema3 backups
retain the existing v2 storage prefix and add a clients array of
{day,client,method,tool,outcome,source,topic,revision,count}. Schema2 snapshots have no
clients array; restore those with an empty client dataset, not invented attribution.
Restore schema3 clients into daily_clients after migration0003, independently of the
overlapping totals/details. The same retention, pagination and daily backup limits apply.
Tests: node tests/clients_test.mjs, plus history and dashboard regression suites.
