# Third hardening pass — 2026-10-23

Product base `06a1875f4815da5ce413e9c3b15f92b7087d211c`; framework base `91f9abce8e14d75d232c2b719adb39dee008804a`. Continued existing review branches. Framework implementation: `8ae321844dece12d5e5f5c33614e7806555ad021`. Product implementation: `ef955a2`, `8bb1094`, `286eb6b`.

## Implemented changes

- **Tool integer schema mismatch:** native rejected `1.0`, `1e0`, and `10e-1` for bounded integer tool arguments while the Worker accepted them. Native now checks numeric integrality and bounds before converting to an integer. Fractional, string, boolean and out-of-range values remain errors. This matches the advertised [JSON Schema integer semantics](https://json-schema.org/understanding-json-schema/reference/numeric).
- **Unicode normalization divergence:** JavaScript trim/whitespace rules treated U+0085 NEL and U+FEFF BOM differently from Rust/Kujo. Queries with NEL could return no Worker results but ten native results. Worker tool/prompt/resource names and argument normalization now use Unicode White_Space; term lengths use code points. Valid body strings containing BOM are preserved rather than silently trimmed. Body-level BOM remains a parse error from the prior round.
- **Non-finite parsed numbers:** Worker JSON.parse accepted `1e400` as Infinity even in unused request fields; native returned a parse error. Worker parsing rejects non-finite numbers before dispatch.
- **Request ID parity and precision containment:** native already rejects decimal/exponent ID tokens. Worker now does likewise, returning -32600 with null ID, including `1.0`, `1e0`, and decimal forms at the safe-integer boundary. This is an intentional Worker compatibility restriction while the pinned runtime has the precision defect below. Use integer-token IDs or string IDs. This policy is distinct from tool argument schema semantics and is not a claim of full protocol conformance. Native header errors now reuse the protocol's ID sanitizer.
- **Catalog identity/provenance:** freshly re-digested snapshots could attach another item's website route, a traversal/newline URL suffix, or a different content collection to a valid item. Website URLs must now exactly match kind and slug; source collections must match kind. Existing reviewed catalog bytes and digest are unchanged. These checks constrain metadata consistency, not publisher authenticity or arbitrary prompt-injection content.

Registry, catalog, synchronization, transport, generator and existing CI gates were reviewed. Public capabilities remain read-only. No new dependencies were added to either application repository; the small Rust dependency probe is evidence only. Worker changes were made in the framework and generated through Kujo. Generation receipts now also hash the numeric helper source.

## Verification

- Official Kujo v1.9.0 binary SHA-256 `657879720c5f51e9598715ec4b5455f51d18774cc89b919b8863b41db4cfc007`.
- Five native assertion suites passed, including nine hardening test blocks.
- 271 native/Worker differential cases passed (244 previously), with explicit invalid-ID assertions and raw number literals.
- 30 startup rejection cases, native HTTP, bearer/duplicate-header/quota checks and Worker contracts passed.
- Full framework suite passed after final template changes, including Unicode, finite-number and ID regressions.
- Catalog freshness passed against archived website commit `e3ed371e23e09b854b989954b19aa512a3124e52`: 237 items, revision `73bfcb690a45974b706144ca3d528dd39e8718fa356fcecf51df683ea17394ce`.
- Repeat generation produced no diff across all four dist artifacts. Native self-check and Worker syntax passed.
- Raw receipts and reproducible precision probes: `evidence/hardening-round3/`.

## Open upstream precision defect

Official Kujo v1.9.0 parses decimal `9007199254740991.0` as `9007199254740990.0`; negative values exhibit the same one-unit loss. Integer tokens remain exact. The release source pins serde_json 1.0.151 without its [float_roundtrip feature](https://docs.rs/crate/serde_json/1.0.151/features). An isolated probe of that exact dependency reproduces the loss and corrects both signs with the feature enabled.

Proposed upstream patch to Kujo Cargo.toml:

```diff
-serde_json = "1.0"
+serde_json = { version = "1.0", features = ["float_roundtrip"] }
```

Before release, add interpreter and VM regressions for both signs, integer tokens, ordinary decimals, exponents, safe-integer boundaries and overflow rejection; run full runtime tests and parsing benchmarks. The dependency-level probe verifies the candidate mechanism, **not a complete runtime patch**. The shared runtime checkout contains unrelated active edits in JIT/VM/native ownership code and was left untouched. The deployed/pinned runtime was not upgraded. General JSON numeric precision remains an upstream bug; the application mitigation prevents decimal IDs from being rounded and echoed.

SignalBox project `kujo`: Capture `cap_5ea88a0f-7eb3-4b0c-8f34-9294be3447fe`; Signal `sig_9fdf4179-8872-4afb-86ba-4664008e9a65`. Exact-ID lookups and concept query `precision` retrieved both. Deduplication found no equivalent precision record. Resolved implementation work was rejected from capture; earlier body-cap and production gates were retained without duplicate captures. An initial multiword concept query returned no results; the shorter supported search cue verified retrieval.

## Local benchmark

One before/after pair, 100 warm samples after 10 warmups per operation in separate Node processes on a shared workstation. These are local emulation measurements, not Cloudflare CPU or statistically significant performance claims. All eleven measured response byte counts stayed identical.

| Operation | Before p50 ms | After p50 ms |
| --- | ---: | ---: |
| health | 0.132 | 0.122 |
| initialize | 0.199 | 0.221 |
| tools | 0.169 | 0.175 |
| item | 0.171 | 0.177 |
| search | 0.763 | 0.649 |
| stack | 0.583 | 0.589 |
| listing | 2.884 | 2.747 |
| installation | 0.108 | 0.101 |
| resource | 1.043 | 0.968 |
| malformed | 0.065 | 0.056 |
| overlimit | 0.238 | 0.229 |

Cold import: 62.754 → 71.962 ms; peak process RSS: 149413888 → 153505792 bytes. The cold-import regression and per-operation variance are retained in the raw receipts.

## Remaining gates

Earlier native body buffering (runtime 8 MiB versus application 128 KiB), constant-time private bearer comparison, account controls, full MCP conformance, staging clients and deployment verification remain open. No production changes, load tests, runtime source edits, DNS changes or credential changes occurred.
