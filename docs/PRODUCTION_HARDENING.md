# Production hardening contract

Status: ready for review, not deployment certification. No production deployment,
credential rotation, DNS change, firewall change or Cloudflare account mutation
was performed in this pass. See the evidence documents for measured results.

## Authority and supported behavior

The service remains an anonymous, read-only public catalog. Native handlers and
all custom generation/synchronization code remain Kujo. The Worker is generated
from the framework adapter and Kujo-exported registry definitions; never patch
`dist/worker.js`. Installer commands and catalog prose are inert, reviewed data.
A digest proves equality, not publisher authenticity or absence of prompt injection.
Downstream agents must obtain their own user's approval before executing commands.

`/mcp` and `/mcp/v1` remain supported. Requests without a protocol header retain
legacy compatibility. Explicit 2026 requests bind method, name/URI, and body
protocol metadata to headers; mismatch returns 400/-32020. Null or unsafe numeric
IDs are rejected. Initialization negotiates a supported version for unknown
client proposals. No-ID tool calls are rejected before dispatch. Recognized legacy
notifications return empty 202. Duplicate JSON keys, more than 1024 keys per object, and nesting deeper than 64
are rejected before full parsing. Missing Accept and legacy wildcard Accept remain
accepted; a header that excludes JSON returns 406. The server emits JSON only.

The catalog generator v2 exports schemas, discovery, resources, installation
profiles and prompt templates from Kujo, avoiding divergent hand-maintained
metadata. Resource JSON follows native `{items:[...]}` envelopes; this corrects
the older Worker's bare-array discrepancy. Stack recommendations and WebOps
results now follow native shapes/ranking. Tool text remains alongside structured
content for old clients, but uses compact JSON. These shape corrections require
staging client checks before deployment; no major-client certification is claimed.

## Resource limits

Worker reads a stream incrementally, cancels above 131072 UTF-8 bytes, rejects
misleading lengths and invalid UTF-8, then parses bounded JSON. Responses are
bounded at 1048576 UTF-8 bytes. Catalog normalization occurs at generation, not
per search. Both native and Worker keep all seven tools read-only.

Native Kujo 1.9.0 source already has an 8 MiB transport body bound, 10 s default
read timeout and bounded handler admission. The catalog applies its smaller
128 KiB limit using `body_bytes`. This smaller cap still occurs **after** runtime
buffering. Before public native hosting, prove ingress enforcement of 128 KiB,
slow-client deadlines, request rate and total concurrency. Merely setting
`trusted_ingress_limits=true` is an acknowledgement, not evidence.

The local limiter has at most 1024 buckets per minute, uses runtime peer IP, ignores
forwarding headers and shares state across aliases. With the local limiter on,
the application sets `KUJO_HTTP_SERVER_MAX_IN_FLIGHT=1` before listening: the
runtime admission gate prevents concurrent read-modify-write counter races.
Excess overlapping requests receive 503; exhausted quota receives 429. Health
bypasses the quota but shares the admission gate. With the limiter off, the runtime
retains its configured admission limit; public instances require ingress quotas.
There is no Worker/global/distributed limiter in this repository.

Optional native bearer tokens are read from an environment variable and never
logged. Duplicate Authorization is rejected, scheme comparison is insensitive,
and 401 includes a Bearer challenge. String equality is not constant-time: keep
privileged/private deployment gated on a reviewed constant-time runtime primitive
or an authenticated ingress. Public read-only access remains unauthenticated.

## Operator validation gates (not applied)

1. Export the actual Worker configuration, zone route/custom-domain binding,
   workers.dev setting, plan and WAF/rate-limit rules using a read-only account.
   Compare with the reviewed source, not just `/health`. The Worker source accepts
   only `mcp.kujolang.ai`; wildcard workers.dev host acceptance has been removed.
2. In Cloudflare, set per-source request throttling and an overall traffic/CPU
   alert appropriate to the actual plan. Verify feature entitlement first. No paid
   service is required by this patch and no account rule is claimed to exist.
3. For native hosting, place the listener behind private ingress. Configure a
   128 KiB body limit, 10 s body/header read deadlines, 120 requests/minute/client,
   and a measured concurrency ceiling (start with 16). Strip client forwarding
   headers and set the exact upstream Host. Test 131071/131072/131073-byte and
   chunked requests, slow streams, spoofed identities, aliases and quota recovery
   against **staging**, while recording whether rejected bytes reached Kujo.
4. Keep the public endpoint limited to the two MCP paths and health. Terminate TLS
   at ingress; verify redirects/TLS configuration independently. Do not assume
   DNS/domain protection covers a separate workers.dev route.
5. Require the validation CI job in branch protection, restrict production tokens,
   and protect the deployment environment. These GitHub/Cloudflare settings were
   not inspected with administrative access. Actions are SHA-pinned; dependabot
   proposes reviewed updates. Validation on PRs never obtains deployment secrets.
6. Only after authorized deployment, run
   `RECEIPT_PATH=evidence/live.json node tests/production_catalog_test.mjs`.
   This compares the exact current source Worker with live discovery, resources,
   profiles and items. Health digest equality alone does not verify executable code.
7. For rollback, select the last reviewed source commit and its exact framework,
   website and runtime inputs; regenerate/verify, deploy only with authorization,
   then run the same smoke command. Preserve the deployment ID and Worker digest.

## Remaining release gates

Official conformance runner and three real public client sessions, edge CPU and
cold-start profiling, actual account rate limits, branch protections, signed
release/deployment attestation, native ingress enforcement and operational owners
remain unverified. Node benchmarks are local emulation, not Cloudflare CPU billing
or sustainable production throughput. Keep the release recommendation at **ready
for review** until these gates have evidence.

## Exact upstream runtime change proposal

For a reusable lower native cap, change
`kujolang/kujo/src/http_request_utils.rs::read_bounded_http_request_body_bytes` to
obtain `maximum` from a new `routed_http_max_body_bytes()` helper. Parse
`KUJO_HTTP_SERVER_MAX_BODY_BYTES` as `usize`, default to
`runtime_limits::MAX_NETWORK_BODY_BYTES`, and clamp to `1024..=MAX_NETWORK_BODY_BYTES`.
Keep the existing declared-length early rejection and `maximum + 1` read bound.
Apply the helper to both VM/interpreter paths through that shared reader. Unit-test
absent/invalid/zero/overflow values and below/at/above limits for declared and chunked
bodies; socket-test both execution modes before publishing a new runtime. Then set
128 KiB before this application's listener starts and pin the verified runtime.
This proposal is **not implemented or tested** in this session; the runtime checkout
contains unrelated active work and the currently pinned released binary cannot
provide this lower cap. Proven ingress remains a native deployment gate.

## Second-pass compatibility checks

Native configuration now rejects unknown settings, duplicate keys, invalid string types and invalid environment-variable names instead of silently falling back to defaults. Use the checked-in config examples as the schema reference. The config JSON text limit is 64 KiB. Both transports validate Accept quality weights; the Worker also rejects malformed Unicode and metadata consistently with native parsing. See `evidence/hardening-round2.md` for reproduced cases, measurements and retained production gates.

## Third-pass numeric and Unicode contract

Bounded integer tool arguments accept whole-valued decimal/exponent JSON numbers. Request IDs remain restricted to string or safe integer **tokens**: decimal/exponent IDs are rejected on both transports because the pinned Kujo runtime can round boundary decimal values incorrectly. Unicode normalization uses Rust/Kujo White_Space semantics in both transports. Catalog website routes and source collections must match item identity. See `evidence/hardening-round3.md` for compatibility details and the independently reproduced upstream precision defect.
