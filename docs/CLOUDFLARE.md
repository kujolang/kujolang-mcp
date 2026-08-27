# Cloudflare Worker deployment

The native Kujo server is the reference implementation. `scripts/generate_worker.kujo`
loads the reviewed `data/catalog.json` and renders the generic Cloudflare adapter
from `kujolang/mcp/src/cloudflare/worker_template.js`. The committed `dist/` files
are generated artifacts and must not be hand-edited.

## Local generation

```text
kujo run scripts/sync_catalog.kujo --interpreter -- --site /absolute/path/to/kujolang.ai --check --json
kujo run scripts/generate_worker.kujo --interpreter -- --framework /absolute/path/to/mcp
```

Generation emits `dist/worker.js`, its SHA-256 receipt, parity fixtures, and
`generation.json`. Identical inputs produce identical output. The Worker has no
runtime network subrequests, storage bindings, credentials, or user data.

## Deployment

`wrangler.jsonc` targets the free Workers plan with a 10 ms CPU ceiling. Connect
the GitHub repository to Workers Builds or run `wrangler deploy` from a trusted
environment. Production uses the Custom Domain `mcp.kujolang.ai`; do not add a
second DNS record when Custom Domains manages it. Keep the `workers.dev` preview
for verification until the custom domain passes its live checks.

Required protected CI values are `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID`; neither is needed by the Worker at runtime. The token
must be scoped to this Worker and the `kujolang.ai` zone only.

## Operations and rollback

- Health: `GET https://mcp.kujolang.ai/health`.
- MCP: `POST https://mcp.kujolang.ai/mcp` with `Content-Type: application/json`.
- Compare the health `catalog_revision` with `data/catalog.json`.
- Deploy the last known-good Git commit to roll back; verify health and a
  `tools/list` response before announcing recovery.
- During abuse, use the Cloudflare Worker disable/rollback control. Do not add
  paid bindings or enable storage, writes, authentication, or execution without
  explicit architectural review.

Cloudflare's current Free plan provides 100,000 Worker requests per day and 10 ms
CPU per invocation. Reassess before sustained traffic approaches that allowance,
CPU or bundle budgets, or any requirement for private data or persistent state.
