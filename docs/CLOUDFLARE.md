# Cloudflare Worker deployment

The native Kujo server is the reference implementation. `scripts/generate_worker.kujo`
loads the reviewed `data/catalog.json` and renders the generic Cloudflare adapter
from `kujolang/mcp/src/cloudflare/worker_template.js`. The committed `dist/` files
are generated artifacts and must not be hand-edited.

## Local generation

```text
kujo run scripts/sync_catalog.kujo -- --site /absolute/path/to/kujolang.ai --check --json
kujo run scripts/generate_worker.kujo -- --framework /absolute/path/to/mcp
```

Generation emits `dist/worker.js`, its SHA-256 receipt, parity fixtures, and
`generation.json`. Identical inputs produce identical output. The MCP catalog remains bundled and read-only. The hosted analytics adapter has a D1
binding for daily aggregate counters and a private dashboard credential; see ANALYTICS.md.

## Deployment

`wrangler.jsonc` is intended for a free-plan Worker; it does not prove the actual account plan or a configured CPU ceiling. Connect
the GitHub repository to Workers Builds or run `wrangler deploy` from a trusted
environment. Production uses the Custom Domain `mcp.kujolang.ai`; do not add a
second DNS record when Custom Domains manages it. The adapter accepts only the exact custom hostname. The 0.2.0 configuration disables workers.dev and explicitly binds the existing custom domain; workers.dev is not an accepted alternate hostname.

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

## Reproducible refreshes

`build-inputs.json` pins the reviewed website and framework commits. CI installs
only the pinned Kujo runtime with its setup action, verifies the catalog,
executes real `test-run` assertions, regenerates the Worker, and exercises native
HTTP and Worker parity contracts. Updating a catalog requires updating its
website pin and committing the regenerated Worker receipts together.

GitHub deployment runs only when both protected Cloudflare secrets exist.
A successful validation job alone is not proof of deployment. Without those
secrets, use the existing authorized Wrangler login from a trusted maintainer
machine: run `npx wrangler@4.151.3 deploy --dry-run`, then
`npx wrangler@4.151.3 deploy`, and compare live health and exact item responses
with the committed catalog. No new credential is needed for that existing
maintainer path. The weekly refresh must complete those live checks.

See `PRODUCTION_HARDENING.md` for staged rollout, body streaming, modern metadata, compatibility corrections and unverified account controls. Local Node timing is not Cloudflare CPU measurement.
