# Next session review — 2026-10-23

Start with `PRODUCTION_HARDENING.md` and the seven evidence reports. The hardening
branch is ready for review; the live service still runs the previously deployed
Worker. No deployment or privileged infrastructure change was authorized.

## Completed locally

- Exact Content-Type, byte-size and duplicate-header guards; depth and duplicate-key
  JSON rejection; corrected no-ID dispatch and empty notification responses.
- Bounded Worker body streaming, Origin/custom-host restrictions and native/Worker
  registry, argument, search, resource and prompt parity.
- Capped local buckets and serialized admission to prevent concurrent quota races.
- Complete accessed catalog fields, provenance URLs, tag/profile types and limits.
- Native bounded top-K selection, Worker precomputed indexes and compact JSON text;
  exact search result digests preserved across 90 baseline cases.
- CI PR validation, SHA-pinned actions, credential non-persistence, input validation,
  source hashes, deterministic generation and expanded regression/benchmark commands.
- Explicit continued support for `/mcp/v1`.

## Still open before deployment/readiness claims

1. Review corrected Worker result shapes and strict modern metadata with real clients.
   Run official conformance and at least three public clients against staging.
2. Inspect actual Cloudflare plan, custom domain, workers.dev, TLS, WAF/rate rules,
   secrets scope, logs and CPU metrics. Repository documentation is not live proof.
3. Prove edge/per-client/global overload controls. Native runtime buffers up to
   8 MiB before the catalog's 128 KiB check; validate the smaller ingress cap,
   timeouts, private routing and recovery. The runtime already exposes peer IP and
   read timeout/admission limits; the old backlog's “missing peer” claim is obsolete.
4. Prove token comparison through authenticated ingress or add a constant-time
   runtime primitive before private/privileged use. Do not add auth to the public
   read-only catalog as a substitute for abuse controls.
5. Establish required CI branch protection, signed release/deployment provenance,
   rollback rehearsal, monitoring/alerts, operator and incident ownership.
6. Obtain authorization before any deployment. Afterward compare exact live results
   with `tests/production_catalog_test.mjs` and retain deployment identity/digest.

Pagination and inverted indexes remain deferred: 237 records and bounded responses
do not justify changing public cursors or ranking. Synthetic 1k/10k/50k selection
measurements are evidence for scaling discussion, not production capacity claims.
