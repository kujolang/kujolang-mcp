# Kujolang.ai MCP Server

A read-only public Model Context Protocol server for discovering Kujo, choosing ecosystem projects, finding agent skills and workflows, and retrieving reviewed installation guidance.

The server is written entirely in Kujo and lives separately from the reusable [`kujolang/mcp`](https://github.com/kujolang/mcp) framework. Its initial scaffold was generated with the framework's `mcp make` workflow, then narrowed to a domain-specific public catalog surface.

## What agents can do

- Understand Kujo and the current catalog shape.
- List primitives, tooling, showcases, skills, and workflows.
- Search projects and operating guidance by capability or task.
- Get exact catalog records with source links, install text, and scope notes.
- Receive a small deterministic stack recommendation for a stated need.
- Inspect one-line installer profiles without executing them.
- Discover the WebOps skill and workflow collection.

All seven tools are read-only, deterministic, and idempotent. The server has no write tool, arbitrary URL fetcher, filesystem-path argument, shell input, package installer, deployment action, or secret-reading capability.

## Run locally

Use a Kujo runtime that supports `run` and the HTTP standard library:

```bash
cd /path/to/kujolang-mcp
kujo run scripts/sync_catalog.kujo --interpreter -- --site /path/to/kujolang.ai
kujo run server.kujo --interpreter --self-check
kujo run server.kujo --interpreter
```

The endpoint is `http://127.0.0.1:8941/mcp`. `/mcp/v1` is a compatibility alias and `/health` is the operational health endpoint.

## Agent connection

For clients that accept a remote Streamable HTTP URL:

```json
{
  "mcpServers": {
    "kujolang": {
      "type": "http",
      "url": "https://mcp.kujolang.ai/mcp"
    }
  }
}
```

For local development, replace the URL with `http://127.0.0.1:8941/mcp`. The server supports the stateless MCP `2026-07-28` request shape (`server/discover`, per-request metadata, and routing headers) and the handshake-era `initialize` flow for compatible clients.

## Available tools

| Tool | Purpose |
|---|---|
| `get_kujo_overview` | Kujo description, catalog counts, discovery guidance, and trust boundary |
| `list_ecosystem` | Filter projects, skills, and workflows by kind or category |
| `search_kujo_catalog` | Search released public catalog metadata |
| `get_catalog_item` | Retrieve one exact item, source link, install text, and scope note |
| `recommend_kujo_stack` | Return a small ranked set for a task |
| `get_installation` | Return default, core, AI, quality, showcase, operating, or all-profile install guidance |
| `list_webops_capabilities` | Discover WebOps skills and workflows |

Resources expose overview, project, skill, workflow, installation, and safety data. Prompts guide stack selection, adoption planning, and WebOps discovery.

## Catalog synchronization

[`scripts/sync_catalog.kujo`](scripts/sync_catalog.kujo) reads the Kujolang.ai Markdown frontmatter and writes [`data/catalog.json`](data/catalog.json). It uses Kujo built-ins only.

```bash
kujo run scripts/sync_catalog.kujo --interpreter -- --site /path/to/kujolang.ai
kujo run scripts/sync_catalog.kujo --interpreter -- --site /path/to/kujolang.ai --check
```

The bundled data makes production requests deterministic and prevents the public server from reading a sibling checkout or fetching arbitrary remote URLs.

## Verification

```bash
kujo run scripts/sync_catalog.kujo --interpreter -- --site /path/to/kujolang.ai --check
kujo run server.kujo --interpreter --self-check
kujo test
```

## Deployment boundary

Start with [`mcp-server.production.example.json`](mcp-server.production.example.json). Run the Kujo process on a private network behind a TLS-terminating reverse proxy or API gateway. Keep the request limit bounded, enforce a shared gateway rate limit for more than one process, pass only the `/mcp` and `/health` routes, and restrict accepted Host and browser Origin values.

The public catalog does not require user data or credentials, so the production example is unauthenticated. If an operator adds any private data or non-read-only authority, authentication becomes mandatory; enable `security.auth_enabled` and provide the token through `KUJOLANG_MCP_TOKEN`, never through source control.

The process-local rate limiter is a baseline, not a distributed abuse-control system. A hosted launch still requires environment-specific ingress, capacity, monitoring, incident-response, and availability review.

See [`SECURITY.md`](SECURITY.md) for the authority model, implemented controls, production requirements, and out-of-scope boundaries.

## Protocol sources

The transport and feature contracts follow the official MCP specification and the Kujo MCP framework's security model. The implementation keeps a single POST endpoint, JSON-RPC request IDs, tools/resources/prompts capability discovery, bounded requests, local binding by default, Origin checks, and optional bearer authentication.

## License

MIT
