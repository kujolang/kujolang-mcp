# Kennel release catalog update — September 13, 2026

Only the Kennel record changed: published version 1.1.0, exact GitHub Release URL, native public bootstrap command, Kujo 1.4.0 requirement and macOS/Linux boundary. Other projects, skills, workflows and installation profiles are unchanged.

- Website source: `bcd0dbb59b4b5df5e5d5c876a4222224b2b21027`.
- MCP implementation commit: `08434451f44742c7e351ca5fac04e1c6415efa83`.
- Catalog revision: `d327a84019c0c8a9357e00757ddd71fa8790d164f031da82b12fa279baff8526`.
- Cloudflare Worker version: `cee3aebe-96d3-40be-912d-92e190eb3440`.
- Catalog synchronization/check, native self-check, all four native assertion-test files, Worker contracts, native HTTP contracts and Wrangler dry-run passed.
- [Validation workflow](https://github.com/kujolang/kujolang-mcp/actions/runs/34782798184) passed.
- `node tests/production_catalog_test.mjs`: passed against `https://mcp.kujolang.ai/mcp`, comparing all 230 records and six installation profiles. Exact revision matched production health.

Production remains a stateless, anonymous, read-only catalog. Returned installer commands are information; the MCP does not execute them. No new Cloudflare resource or binding was introduced.
