# Kujolang MCP — Next Session Review

Date: 2026-08-25

This repository is a strong read-only preview, but it is not yet universally production-ready or enterprise-certified. The current session closed the application-level algorithmic denial-of-service and global rate-counter findings, moved runtime implementation under `src/`, strengthened protocol/config/catalog validation, added defensive HTTP behavior, expanded tests, and added a repeatable search benchmark.

The remaining work is primarily deployment proof, interoperability proof, operational maturity, and release provenance. Work top-to-bottom unless a hosted-launch dependency changes the order.

## P0 — Required before a public hosted launch

- [ ] Add a reviewed production ingress example for the selected platform (Caddy, nginx, Cloudflare, or equivalent) that enforces TLS, exact Host, body bytes, connection/read timeouts, per-client throttling, a global overload ceiling, and forwarding-header overwrite.
  - Acceptance: an automated smoke test proves oversized, slow, wrong-Host, spoofed-identity, and over-quota requests are rejected before reaching Kujo.
- [ ] Add a production service/container definition with a fixed working directory, non-root user, read-only filesystem, explicit resource limits, health check, restart policy, and private-only Kujo listener.
  - Acceptance: deployment starts from a clean checkout with `KUJOLANG_MCP_CONFIG` explicitly set and passes `/health` plus MCP discovery.
- [ ] Add structured request/error telemetry without bodies, bearer values, prompt arguments, or catalog text.
  - Acceptance: dashboards expose request volume, latency, status/error classes, throttling, restarts, saturation, and catalog/server versions; alerts have owners.
- [ ] Run capacity and abuse tests through the real ingress.
  - Acceptance: publish p50/p95/p99 latency, sustainable throughput, memory ceiling, overload behavior, and recovery behavior for representative list/search/read calls.
- [ ] Complete an end-to-end hosted security review after infrastructure exists.
  - Acceptance: validate TLS, DNS, route exposure, ingress bypass resistance, secrets, logs, network policy, deployment identity, and incident procedures against the deployed environment.

## P1 — Interoperability and release confidence

- [ ] Build a Kujo-only HTTP integration harness that starts the server, exercises real headers/status codes/notifications, and stops it deterministically.
  - Acceptance: cover Content-Type, mandatory Host, allowed/disallowed Origin, bearer mode, strict 2026 headers, 202 acceptance for notifications, parse errors, body limits, health exemption, and `/mcp/v1` compatibility.
- [ ] Run the official or ecosystem MCP conformance suites against both advertised protocol versions and at least three major agent clients.
  - Acceptance: record client/version matrices, known deviations, and reproducible connection configurations.
- [ ] Decide whether `/mcp/v1` remains a supported compatibility endpoint.
  - Acceptance: either document/test a deprecation window or include it explicitly in ingress and compatibility tests.
- [ ] Add CI that runs `kujo test`, self-check, catalog freshness, manifest consistency, and the benchmark smoke path using only Kujo project commands.
  - Acceptance: protected `main` requires all checks, and releases cannot publish stale catalog data.
- [ ] Add signed, immutable release artifacts and catalog provenance.
  - Acceptance: release metadata binds source commit, catalog digest, Kujo version, build inputs, and signature verification instructions.

## P2 — Universal usefulness

- [ ] Add cursor pagination for catalog resources and broad list responses before the catalog grows beyond one bounded snapshot response.
- [ ] Improve stack recommendations from flat term ranking to deterministic capability coverage with explicit “why,” conflicts, maturity, and minimal-install rationale.
- [ ] Add catalog facets for stability, runtime requirements, supported platforms, license, maintenance state, and last verified release.
- [ ] Add machine-readable install-plan output that separates command text, profile members, prerequisites, verification, rollback, and source-review URL.
- [ ] Add resource templates for exact item lookup and filtered catalog access if supported by the finalized Kujo MCP framework contract.
- [ ] Publish copy-paste client configurations only after each is tested against the live endpoint.

## P3 — Kujo/runtime opportunities

- [ ] Add a Kujo HTTP primitive for pre-buffer body limits and connection/read timeouts so applications do not depend entirely on ingress for memory protection.
- [ ] Expose a trustworthy socket peer address or trusted-proxy identity primitive to route handlers.
- [ ] Add first-class constant-time secret comparison and standard bearer-challenge response helpers.
- [ ] Add reusable MCP HTTP integration-test helpers and conformance fixtures to the separate `kujolang/mcp` framework.
- [ ] Evaluate VM-primary compatibility; current repository tests pass through interpreter fallback.

## Exit criteria for “production-ready” wording

Do not describe `kujolang-mcp` as production-ready until every P0 item is complete, the P1 conformance and CI items are complete, no open high/critical security finding remains, the live deployment has an owner and incident path, and the README links to current operational evidence. “Enterprise-grade” additionally requires documented availability objectives, change/release controls, support ownership, audit retention policy, and any certifications demanded by the target customer—not just application code quality.
