# Hardening findings and threat model — 2026-10-23

## Scope and trust boundaries

Reviewed all application sources, synchronization/generation scripts, test/benchmark
sources, configuration/manifests, CI workflow, generated artifact and its framework
template. Reviewed runtime HTTP body/headers/peer/admission code, not the entire
Kujo compiler or all framework modules. Existing framework suite supplies broader
regression evidence; it is not a comprehensive compiler security audit.

Untrusted external clients cross HTTP framing and JSON parsing into the dispatcher
and read-only handlers. Cloudflare owns edge/TLS/admission; native ingress must own
the smaller pre-buffer limit and public quotas. Catalog snapshots cross a separate
review boundary: website frontmatter/installer → synchronizer → schema/digests →
Kujo generator → framework template → CI artifact → authorized deployment. GitHub
runners, pinned actions and deployment credentials can replace published code;
least privilege and reproducibility reduce, but do not eliminate, that risk.
Downstream AI agents must treat descriptions, tags, scope notes and install text as
data and retain their own consent boundaries. No new tool can fetch URLs, execute
commands, read paths, install packages, deploy or read credentials.

Attackers considered: anonymous malformed/flood clients, compromised consuming
agents, malicious source/catalog editors, compromised dependencies/builds and future
accidental privileged functionality. Availability and correctness findings below
are separated from unverified operational risks and defense-in-depth changes.
No critical remote execution, credential disclosure or private-data access was found
in the reviewed read-only surface. This is not proof of absence or certification.

## Findings

### H01 — Worker buffers whole body before checking length

- Classification: Medium / availability.
- Affected source (fixed revision): `src/cloudflare/worker_template.js:121` in `kujolang/mcp`.
- Evidence, exploitability and mitigations: Anonymous chunked streams could allocate beyond 128 KiB before rejection; Cloudflare platform limits remain outer mitigation. Stream test now cancels after the third 64 KiB chunk.
- Disposition: Fixed: streamed byte limit, declared-length checks and fatal UTF-8 decoding.

### H02 — Native no-ID calls dispatch then disappear

- Classification: Medium / correctness and abuse.
- Affected source (fixed revision): `src/protocol.kujo:57` in `kujolang/kujolang-mcp`.
- Evidence, exploitability and mitigations: A no-ID tools/call previously evaluated handlers before HTTP 202. Read-only catalog limits impact to wasted work and misleading transport success.
- Disposition: Fixed: validate envelope/ID before dispatch; invalid notifications 400, accepted notifications empty 202.

### H03 — Concurrent quota bypass

- Classification: Medium / availability, loopback scope.
- Affected source (fixed revision): `src/runtime.kujo:122` in `kujolang/kujolang-mcp`.
- Evidence, exploitability and mitigations: 40 concurrent requests against quota 20 admitted 32 before the fix. Public native mode already disallows this limiter.
- Disposition: Fixed: serialized runtime admission when local limiter is enabled; quota state shared across aliases; excess overlap 503. Health shares overload admission.

### H04 — Host, media-type and byte-count ambiguity

- Classification: Low / validation.
- Affected source (fixed revision): `src/http_security.kujo:91` in `kujolang/kujolang-mcp`.
- Evidence, exploitability and mitigations: Native prefix accepted application/json-unexpected; len(string) counted characters, so a 132 KiB UTF-8 request passed the 128 KiB cap. Duplicate singleton headers and malformed ports were not rejected.
- Disposition: Fixed: exact media type, raw byte count, singleton multiplicity, controls and bounded host/port grammar. IPv6 literal matching remains exact allowlist matching, not generalized equivalence.

### H05 — Worker/native argument and result divergence

- Classification: Medium / protocol correctness.
- Affected source (fixed revision): `src/cloudflare/worker_template.js:50` in `kujolang/mcp`.
- Evidence, exploitability and mitigations: Worker accepted invalid limits/filters, selected unrelated WebOps entries, and returned different recommendations/resources/prompts. Existing tests only covered selected items/profiles.
- Disposition: Fixed: Kujo-exported metadata/static results and native-equivalent validation/selection, exercised by complete surface differential corpus. Shape corrections are staging compatibility gates.

### H06 — Worker Origin and wildcard host acceptance

- Classification: Low / public read-only boundary.
- Affected source (fixed revision): `src/cloudflare/worker_template.js:159` in `kujolang/mcp`.
- Evidence, exploitability and mitigations: Any Origin and *.workers.dev were accepted. This catalog exposes public data only; no private-data breach demonstrated. Alternate edge routes could bypass custom-domain controls if such rules exist.
- Disposition: Fixed in source: reject Origin and require exact mcp.kujolang.ai. Deployed routes/WAF and actual bypass are unverified; do not assert production remediated.

### H07 — Unbounded depth and duplicate-key interpretation

- Classification: Medium / parser work and ambiguity.
- Affected source (fixed revision): `src/http_security.kujo:42` in `kujolang/kujolang-mcp`.
- Evidence, exploitability and mitigations: Small deeply nested JSON or duplicate escaped keys lacked an application contract. Runtime parser limits/platform memory provide partial outer bounds.
- Disposition: Fixed: depth 64, at most 1024 decoded keys/object, duplicate rejection before full parse, bounded input bytes. Exact/above-boundary and escaped-key tests added.

### H08 — Catalog accessed fields insufficiently validated

- Classification: Low / supply-chain defense.
- Affected source (fixed revision): `src/catalog.kujo:23` in `kujolang/kujolang-mcp`.
- Evidence, exploitability and mitigations: Digests can be recomputed by a source editor. Registry fields, tag elements, profiles, source paths and URL shapes were not all validated before access.
- Disposition: Fixed: shape/type/count/length/control/provenance checks and mutation tests with fresh digests. Review remains essential: validation cannot prove natural-language content free of instruction injection.

### H09 — Mutable CI action references

- Classification: Low / supply-chain defense.
- Affected source (fixed revision): `.github/workflows/deploy.yml:21` in `kujolang/kujolang-mcp`.
- Evidence, exploitability and mitigations: Checkout v4 and Wrangler v3 tags could change; existing workflow already had contents:read and deterministic generation checks.
- Disposition: Fixed: full current tag commit pins, PR validation, non-persisted checkout credentials, bounded jobs, input validation and Dependabot. Publisher compromise/branch settings remain separate risks.

### H10 — Repeated selection and normalization

- Classification: P2 / measured performance.
- Affected source (fixed revision): `src/catalog.kujo:190` in `kujolang/kujolang-mcp`.
- Evidence, exploitability and mitigations: Native repeatedly rebuilt all remaining matches; Worker repeatedly normalized/scored the same catalog and called search twice.
- Disposition: Fixed: bounded native K, native-exported index, one Worker search, compact dual representations. Exact ordering preserved; measured tradeoffs and native regressions in performance report.

### H11 — Native smaller body bound is post-buffer

- Classification: Medium / operational gate.
- Affected source (fixed revision): `src/runtime.kujo:90` in `kujolang/kujolang-mcp`.
- Evidence, exploitability and mitigations: Kujo source has an 8 MiB transport cap, but the 128 KiB application limit is after transport buffering. Proven smaller ingress enforcement is unavailable here.
- Disposition: Open: require staging proof of 128 KiB ingress, read deadlines and overload; exact upstream lower-cap patch proposal in production guide. No runtime checkout was modified.

### H12 — Optional native bearer uses ordinary equality

- Classification: Low / conditional secret timing.
- Affected source (fixed revision): `src/http_security.kujo:113` in `kujolang/kujolang-mcp`.
- Evidence, exploitability and mitigations: No constant-time primitive was found. Public endpoint has no secret and is intentionally anonymous. Optional private auth deployments require further review.
- Disposition: Open: authenticated ingress or reusable constant-time runtime primitive before privileged deployment. No credential extraction or timing attack performed.

## Explicitly unverified / deferred

Actual edge plan, CPU ceilings, WAF/global throttling, workers.dev route retirement,
TLS policy, access token scope, branch protection, operator ownership and alerting
require account/staging evidence. Official conformance and three real-client sessions
remain open. No production deployment or traffic stress was performed. One read-only
health request proved only the live catalog digest. Signed publisher/deployed-artifact
attestation was not added. Pagination/inverted indexing are deferred on current size
and measurements. Malformed configuration and corrupt snapshots fail startup; those
are operational failures, not remotely writable input.

Recommendation: **Ready for review**. Fixes are implemented and locally tested;
production readiness requires the gates in `docs/PRODUCTION_HARDENING.md`.
