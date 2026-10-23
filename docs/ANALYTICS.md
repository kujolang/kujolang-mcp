# Analytics operations

- Dashboard: https://mcp.kujolang.ai/analytics
- Notice: https://mcp.kujolang.ai/telemetry
- Data: authenticated GET /analytics/data, current plus preceding 29 UTC days.
- Storage: `ANALYTICS_DB`, D1 database `kujolang-mcp-analytics`.
- Cleanup: daily at 03:17 UTC and on each recorded request.

The login shell is public; counters are private. Use the `ANALYTICS_DASHBOARD_TOKEN`
Worker secret. The initial key is saved only on the deploying maintainer's machine at
`~/.config/kujolang-mcp/analytics-dashboard-token` (directory 0700, file 0600).
Copy it locally into the dashboard password field. Never put it in URLs, screenshots,
issues, chat, source files, or shell command arguments. Lock the dashboard when finished.
A page reload forgets the key; there is no persistent login or cookie.

To rotate, generate a cryptographically random key of at least 32 bytes, save it with
restricted permissions, and pipe its contents to:

```sh
npx wrangler@4.151.3 secret put ANALYTICS_DASHBOARD_TOKEN
```

Pipe from the restricted file rather than passing the key as a command argument.
The key is read-only authority over counters; never reuse a Cloudflare API token.

## Deployment and tests

The Kujo generator embeds the reviewed generic framework template plus
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

Optional real-browser verification: install Playwright outside the repository, then run
`tests/analytics_browser_test.mjs` with `PLAYWRIGHT_MODULE` pointing to its module entry.
It uses local Chrome and the restricted key file, verifies login/lock and mobile layout,
and saves credential-free screenshots under `/tmp/kujolang-analytics-dashboard-*.png`.
