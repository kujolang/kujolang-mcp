# Kujolang.ai MCP Server

`kujolang-mcp` is a read-only Model Context Protocol server for discovering Kujo projects, primitives, tooling, showcases, agent skills, workflows, and reviewed installation guidance. The complete runtime and every custom utility are written in Kujo.

This repository is the Kujolang.ai catalog server, not the reusable [`kujolang/mcp`](https://github.com/kujolang/mcp) framework. It follows that framework's conventions while remaining independently deployable and product-specific.

## Readiness

The repository is currently a **preview**, not a claim of universally production-ready or formally enterprise-certified software. The application surface is bounded, tested, read-only, and suitable for controlled deployments. A public production service still requires a real ingress, TLS, pre-buffer request limits, per-client abuse controls, monitoring, capacity testing, deployment automation, and an incident-response owner.

The planned public URL is `https://mcp.kujolang.ai/mcp`. Do not configure clients with that URL until the hosted service is announced as live. Local use is available now.

## What agents can do

- Understand Kujo and the current public catalog.
- List and search projects, primitives, tooling, showcases, skills, and workflows.
- Retrieve exact records with source links, install text, versions, and scope notes.
- Receive small deterministic stack recommendations for concrete work.
- Inspect default, grouped, and complete installer profiles without executing them.
- Discover WebOps capabilities without unrelated search results consuming the result limit.

All seven tools are read-only, deterministic, and idempotent. There is no write tool, arbitrary URL fetcher, filesystem-path input, shell input, package installer, deployment action, or secret-reading capability.

## Quick start

Use a Kujo runtime with `run`, `test`, and the HTTP standard library:

```bash
cd /path/to/kujolang-mcp
kujo run server.kujo --interpreter --self-check
kujo run server.kujo --interpreter
```

The local endpoint is `http://127.0.0.1:8941/mcp`; `/mcp/v1` is a compatibility alias and `/health` is the health endpoint.

For a local Streamable HTTP client:

```json
{
  "mcpServers": {
    "kujolang": {
      "type": "http",
      "url": "http://127.0.0.1:8941/mcp"
    }
  }
}
```

The server advertises MCP `2026-07-28` and handshake-era `2025-06-18`. Production configuration enables strict `Mcp-Method` and `Mcp-Name` binding for 2026 requests.

## MCP surface

| Tool | Purpose |
|---|---|
| `get_kujo_overview` | Explain Kujo, catalog counts, discovery flow, and the trust boundary |
| `list_ecosystem` | Filter projects, skills, and workflows by kind or category |
| `search_kujo_catalog` | Search released public catalog metadata |
| `get_catalog_item` | Retrieve one exact item and its source-backed guidance |
| `recommend_kujo_stack` | Return a compact deterministic match set for a task |
| `get_installation` | Return default, core, AI, quality, showcase, operating, or complete install guidance |
| `list_webops_capabilities` | Search only the WebOps capability collection |

Six resources expose overview, project, skill, workflow, installation, and safety data. Three prompts guide stack selection, adoption planning, and WebOps discovery.

## Repository layout

```text
server.kujo                         Thin stable launcher
src/runtime.kujo                    Configuration, modes, and HTTP routing
src/http_security.kujo              Transport guards and security headers
src/protocol.kujo                   JSON-RPC and MCP dispatch
src/registry.kujo                   Tools, resources, and prompts
src/catalog.kujo                    Catalog validation, indexing, and search
data/catalog.json                   Reviewed deterministic catalog snapshot
scripts/sync_catalog.kujo           Kujo-only catalog synchronization
scripts/weekly_refresh.kujo         Guarded GitHub/deployment refresh workflow
benchmarks/search_benchmark.kujo    Kujo-only search benchmark
tests/                              Kujo test suites and snapshots
```

Root-level manifests, policy, configuration, license, documentation, and the thin launcher remain at the root because package managers, operators, and repository hosts discover them there. Application implementation lives under `src/`.

## Catalog integrity and synchronization

The bundled catalog is validated at startup for schema, item shape, unique slugs, counts, and a SHA-256 content digest. Production requests never read a sibling website checkout or fetch remote URLs.

Regenerate or verify it from a reviewed Kujolang.ai checkout:

```bash
kujo run scripts/sync_catalog.kujo --interpreter -- --site /path/to/kujolang.ai
kujo run scripts/sync_catalog.kujo --interpreter -- --site /path/to/kujolang.ai --check
```

The synchronizer rejects duplicate or malformed slugs and unexpected source URL schemes. Installer profile membership is parsed from the website's public installer instead of duplicated by hand. The catalog revision covers both records and installation profiles; it detects accidental snapshot corruption but is not a substitute for signed releases or human review.

For a guarded weekly GitHub refresh, deployment adapter contract, live digest verification, and copy/paste scheduled-task prompt, see [`docs/WEEKLY_REFRESH.md`](docs/WEEKLY_REFRESH.md).

## Security and performance controls

- Search fields are length-bounded and normalized query terms are deduplicated and capped before catalog work.
- Search text and identity fields are indexed once when the catalog loads.
- Host is mandatory and allowlisted; browser Origin is exact-allowlisted when present.
- JSON requests require `application/json`, bounded body configuration, validated envelopes, object parameters, and deterministic errors.
- Responses include defensive no-store, no-sniff, frame, referrer, resource, and content security headers.
- Local rate limiting uses isolated request buckets when the runtime supplies a peer address; health checks do not consume the quota.
- Non-loopback startup fails unless trusted ingress limits are explicitly acknowledged, and public listeners refuse the application-local limiter because the current runtime cannot reliably identify anonymous socket peers.

The application body check happens after the current Kujo HTTP runtime buffers the request. Production ingress must reject oversized bodies and enforce connection/read timeouts before forwarding.

## Verification

```bash
kujo run scripts/sync_catalog.kujo --interpreter -- --site /path/to/kujolang.ai --check
kujo run scripts/weekly_refresh.kujo --interpreter -- --help
kujo run server.kujo --interpreter --self-check
kujo test
kujo run benchmarks/search_benchmark.kujo --interpreter
```

## Production deployment contract

Select the production configuration explicitly:

```bash
KUJOLANG_MCP_CONFIG=mcp-server.production.example.json \
  kujo run server.kujo --interpreter
```

The trusted ingress must:

- terminate TLS and be the only network peer allowed to reach the Kujo listener;
- enforce body bytes, connection/read timeouts, per-client throttling, and a global overload ceiling before proxying;
- overwrite or discard spoofable client identity headers;
- forward only `/mcp` and `/health` with the exact public Host;
- provide access/error metrics, alerting, capacity limits, and incident-response routing.

The public catalog intentionally requires no user credentials. If private or tenant data, remote fetching, writes, or execution are ever introduced, this authority model must be redesigned and authentication becomes mandatory.

See [`SECURITY.md`](SECURITY.md) for the complete boundary and [`docs/NEXT_SESSION_REVIEW.md`](docs/NEXT_SESSION_REVIEW.md) for the next production-readiness work list.

## License

MIT
