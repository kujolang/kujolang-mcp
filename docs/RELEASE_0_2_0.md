# Kujolang MCP 0.2.0 publication

Tagged `v0.2.0` at `d66bc6e4b18c0d6ede004ba531644c06b80ad328` and published as a hardened preview. The release remains preview software; this does not claim full MCP conformance or independently verified account-level security controls.

Live endpoint: https://mcp.kujolang.ai/mcp. Cloudflare version `b3689a58-5f32-40ed-adbc-e4f3a819b6ba` receives 100% of traffic in deployment `3633dff0-f868-4c20-88f4-ee07348d1370`. The existing custom domain is explicitly configured; workers.dev is disabled in the applied configuration.

Post-deployment checks matched all 237 catalog items, six installer profiles, tool/resource/prompt descriptors, selected item lookups, and version 0.2.0 against the generated Worker. Nine additional live checks covered both MCP paths, initialization, modern metadata, Unicode normalization, duplicate JSON keys, non-finite numbers, decimal IDs, Accept and Origin rejection. This was bounded read-only verification, not a production load test.

The upstream decimal-precision fix was merged via [Kujo PR #28](https://github.com/kujolang/kujo/pull/28), merge `b49a4145052c8b5d7a2b4cf86b41784dceaa0f16`. The patch enables serde_json float_roundtrip and adds nine passing JSON tests including VM/interpreter coverage. The patched runtime also passed the five native MCP suites and 271 differential cases. Runtime main advanced concurrently, so the isolated branch was merged with the then-current main and re-tested before PR merge. Unrelated runtime working-tree edits were preserved.

**Runtime publication boundary:** no Kujo runtime tag or binary release was published. Public Kujo 1.9.0 still contains the older decimal parser; the MCP build pin remains that published version. The generated JavaScript Worker does not use that parser, and native MCP retains integer-token request IDs. Precision-sensitive native consumers should use a build containing the upstream fix pending a separate runtime release.

All local release checks passed: native suites, 271 differential cases, 30 config failures, auth/quota tests, Worker contracts, pinned-site freshness, byte-identical generation and Wrangler dry run. The framework full suite passed on its pinned commit during the prior pass. GitHub hosted validation run `40014625941` was still queued at publication/live verification, so it is not reported as successful. No deployment secrets were configured; deployment used the existing authorized local Wrangler login.

See `evidence/release-0.2.0/publication.json` and adjacent receipts. Rollback target, if needed, is the prior Worker version `d6c5ac27-0fd2-46f7-a2ae-cfa0ba0380b6`; re-run health and catalog checks after any rollback.
