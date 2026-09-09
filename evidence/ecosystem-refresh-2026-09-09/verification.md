# Ecosystem freshness verification — September 9, 2026

Public MCP deployment is current. `production-verification.json` compares every one of the 230 records and all six installer profiles against the reviewed generated Worker, checks seven read-only tools, six resources and three prompts, and confirms the live health revision. Runtime version is 1.4.0; website source version and MCP service version remain separate.

- Public source: cb91f4a8a5ca2b4bd6571513066b427140efc7d1; validation run [34375926934](https://github.com/kujolang/kujolang-mcp/actions/runs/34375926934) passed.
- Website catalog input: 163179cb751e8cd77811f5b27e189449b95dc79a; later website-only image/count correction 288ae4820f47d79db7eef5c8e237e678a0f00a09 passed and deployed in [34375139800](https://github.com/kujolang/kujolang.ai/actions/runs/34375139800).
- Framework input: 07845898ee9f2662d0e0e364973d77cdaac04762; full CI [34374553951](https://github.com/kujolang/mcp/actions/runs/34374553951) and companion workflow 34374553949 passed. The earlier isolated full local suite also passed. Running that suite against unrelated newer sibling checkouts correctly rejected stale host certification; isolated exact sources resolved the environment mismatch without weakening certification.
- Native public MCP tests: 20 assertions across four files passed using the published Kujo 1.4.0 binary. `test-run` executes assertion blocks; the old stdout-snapshot command did not. Correct execution exposed and fixed persistent HTTP quota state and oversized-query diagnostics.
- Native HTTP integration passed: quota persists across POST requests and aliases; health is exempt.
- Generated Worker contracts passed: six exact native/Worker item comparisons, all profiles, runtime overview, invalid input and HTTP guards.
- Deterministic catalog/Worker regeneration and receipt comparison passed in CI. A fixture-only run validated the production checker before its real HTTPS run.
- Wrangler 4.130.0 dry run and production deployment passed. Existing Worker version: `400108b6-383b-4f74-bf4f-108f78ea9884`; startup 6 ms; upload 418.14 KiB, gzip 59.75 KiB. No bindings or infrastructure were added.
- Live catalog revision: `49adf21a49bfa9e158ad39cabb16231417ba583f8bb620d28774fdf24406242c`.
- Worker SHA-256: `f5349d2ed10f06f3ed3b1d55924b1e1b38b68191781ad7453638eb68cec0fb25`.

`source-inventory.json` retains the public release/README/commit evidence for 86 repositories. `project-release-verification.json` checks all 50 project records; `catalog-coverage.json` checks 135 skills, 44 released workflow kits plus the existing Publishing House Operator surface, and 25 provider tags.

The existing maintainer Wrangler login performed deployment. GitHub CI currently has no Cloudflare deployment secrets; the workflow reports this explicitly and validates without claiming deployment. Future runs use the documented maintainer deployment path unless protected CI credentials are configured. No credentials were created, committed or printed.

Documentation and main-site full audits are stored in each website repository under `seo-audit/ecosystem-refresh/2026-09-09/`. Kennel's separate release remains deferred. No MCP framework release or protocol migration was required.
