# Analytics operations

- Dashboard: https://mcp.kujolang.ai/analytics
- Notice: https://mcp.kujolang.ai/telemetry
- Data: authenticated GET /analytics/data, current plus preceding 29 UTC days.
- Storage: `ANALYTICS_DB`, D1 database `kujolang-mcp-analytics`.
- Cleanup: daily at 03:17 UTC and on each recorded request.

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

Run `npm ci --ignore-scripts` and `npm run build:access` to reproduce the pinned jose
verifier bundle; CI checks its exact contents. Its license is retained beside the bundle.
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

D1 writes increment separate dimension counters atomically in a batch. There is no event
or session table. Each recorded request causes at most eleven statements including cleanup;
monitor D1 limits and costs before changing traffic or plan. This deployment does not upgrade
the account. Analytics quota exhaustion is an undercount, not an MCP outage. An empty
successful dashboard query does not prove the write path is healthy: check D1 metrics and
scheduled execution health in Cloudflare. Retention excludes old rows from reads even if
physical cleanup is delayed. D1 recovery backups follow the account's Time Travel policy.

To disable collection, remove the `ANALYTICS_DB` binding and deploy. MCP remains functional;
the dashboard returns unavailable. Disable the cron and manage database deletion separately
if retiring analytics. Never roll back to a configuration that re-enables request logs.

Browser verification: open `/analytics`, complete the owner Access login, check the
counters, refresh, and sign out. Signed-out HTML, JS and data requests must redirect to
Access; an authenticated different identity must be denied. Check a narrow viewport for
horizontal overflow. Do not save session cookies or login codes in test artifacts.
`node tests/dashboard_test.mjs` covers rendering, expiration and stale-response clearing
with an isolated DOM fixture, without production credentials.
