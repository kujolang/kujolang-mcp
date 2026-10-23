# Kujolang MCP hardening report — 2026-10-23

## Executive summary

Implemented transport, parser, quota, catalog and CI hardening while preserving
read-only authority, Kujo application code and generated Worker architecture.
The generic Worker fixes are in the isolated `kujolang/mcp` branch; the catalog
pins that exact framework commit. No production deployment was performed.

## Findings

[Threat model and twelve classified findings](hardening-findings.md) include
severity, affected source lines, exploitability, mitigations and disposition.
Confirmed availability/correctness issues were fixed. Native pre-buffer enforcement
at 128 KiB and optional constant-time authentication remain deployment gates.

## Changes implemented

- Native `src/http_security.kujo`, `src/runtime.kujo`, `src/protocol.kujo`: byte and
  header guards, bounded JSON, pre-dispatch ID validation, correct notifications,
  negotiation, modern header binding, alias methods and serialized local quotas.
- `src/catalog.kujo`, `src/catalog_source.kujo`, `src/registry.kujo`: complete accessed
  field validation, poisoning defenses, stable top-K and compact dual tool content.
- `scripts/generate_worker.kujo` plus upstream `src/cloudflare/worker_template.js`:
  Kujo-exported canonical contracts, bounded Worker streams and native parity.
- CI SHA pins, PR validation, dependency-update configuration, provenance hashes,
  deterministic generation, regression suites and post-deployment smoke command.

## Security results

[Security evidence](security-test-results.md): five native assertion suites, expanded
HTTP differential corpus, startup-failure matrix, raw header/auth tests, concurrent
quota/recovery tests, stream cancellation, exact search results and full framework
suite pass. Generated artifacts reproduce exactly. No production stress was sent.

## Performance results

[Measured before/after tables and methodology](performance-comparison.md) retain
raw p50/p95/p99, throughput, response bytes, Node CPU/peak RSS, cold imports and
three-run variance. Native top-K preserves 90 exact result cases; Worker repeated
normalization is removed. Compact listing is 429564 bytes versus 462499 before.
Cold initialization and some native endpoints regress; no universal speedup or
Cloudflare CPU claim is made. Synthetic scaling covers 237/1k/10k/50k candidates.

## Compatibility results

[Protocol evidence](protocol-conformance.md): local Fetch and native HTTP exercised
2025-06-18 and 2026-07-28. Headerless legacy clients and both endpoint aliases remain.
Worker resource/recommendation/WebOps shapes now match native and require staging
client review. Actual major-client certification and official full conformance
remain open; framework host tests do not certify this catalog.

## Remaining risks

Actual Cloudflare plan/rate policies, native smaller pre-buffer ingress limit,
constant-time private authentication, production CPU/cold-start behavior, required
branch protection, signed publisher/deployment provenance and operational ownership
need external evidence. Details and the exact upstream lower-body-cap proposal are
in [production hardening](../docs/PRODUCTION_HARDENING.md). A read-only live health
request confirmed only the existing catalog digest, not deployment of these fixes.

## Release recommendation

**Ready for review.** Local fixes, regressions, benchmarks, catalog integrity and
reproducible artifacts are verified. Deploy only after explicit authorization and
the documented staging/operational gates. Source/provenance links are in
[release provenance](release-provenance.md).
