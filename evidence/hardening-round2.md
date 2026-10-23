# Second hardening pass — 2026-10-23

Base: product `961200c55fc34a5d753ae20ab385e2d777d06717`; framework `1654f84888ae01bfee58c105b15d19bee7fefc9a`. Framework fix: `91f9abce8e14d75d232c2b719adb39dee008804a`. Native startup fix: `bdc1e61`. Continued the existing review branches; no deployment or infrastructure changes.

## Reproduced defects and fixes

| Defect | Impact and correction |
| --- | --- |
| Native unknown config keys and string coercion | `security: {auth_enabld: true}` passed self-check with authentication disabled. Reject unknown keys at all config levels, duplicate decoded JSON keys, non-string host/path/environment names, invalid environment identifiers and config text above 64 KiB. This is operator-misconfiguration protection, not a remotely writable configuration vulnerability. |
| Accept quality validation | `application/json;q=garbage`, out-of-range and duplicated q weights returned success. Both transports now reject malformed weights, honor valid zero-to-one values with up to three decimals and preserve specific exclusions over wildcards. Equally specific ranges no longer depend on their order. Grammar source: [RFC 9110 §12.4.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-12.4.2). |
| Worker cancellation awaited | An oversize stream whose cancel promise never resolves prevented the rejection response; rejected cancellation could replace 413 with a parse error. Cancellation is best-effort with rejection handled, and 413 returns without waiting. Framework tests cover both hostile cancellation behaviors with a one-second deadline. This is adapter robustness; actual Cloudflare internal stream behavior was not assumed. |
| Worker empty stream framing | A null body bypassed the declared-length equality check. A positive Content-Length on an absent stream now returns 400. |
| Worker Unicode divergence | BOM-prefixed JSON and escaped unpaired surrogates were accepted while native parsing rejected them. Preserve BOM during decoding and validate decoded string scalar sequences. Valid surrogate pairs remain supported. |
| Worker metadata truthiness | False, zero and null protocol metadata were replaced with an absent-value fallback, bypassing the mismatch check enforced natively. Presence checks now preserve malformed values and reject them consistently. |

The public read-only behavior, catalog snapshot and successful response bytes remain unchanged. Worker fixes live in the framework template and were generated with Kujo; no generated implementation was hand-edited. Unknown native configuration keys are intentionally no longer accepted: fix spelling errors or remove unused keys before startup.

## Verification

- Official Kujo v1.9.0 binary `/tmp/kujolang-hardening-runtime/kujo`, SHA-256 `657879720c5f51e9598715ec4b5455f51d18774cc89b919b8863b41db4cfc007`.
- Five native assertion suites; native HTTP, authentication, duplicate singleton and quota tests passed.
- 244 native/Worker differential cases (was 225); 30 startup rejection cases (was 12).
- Worker contracts and full framework `bash tests/run_all_tests.sh` passed, including new cancellation, framing, Accept and Unicode tests.
- All four generated artifacts are byte-identical after repeat generation; JavaScript syntax and native self-check passed.
- Raw receipts are in `evidence/hardening-round2/`. One initial Worker-contract invocation accidentally used PATH's unsupported Kujo 1.5.0; it was rerun successfully with the pinned official binary. The saved contract receipt is that successful run.

## Local measurement

One before/after pair, 100 warm samples after 10 warmups per operation, separate Node processes on the shared workstation. No claim of statistically significant performance improvement or Cloudflare CPU compliance. Added Unicode validation performs extra bounded string work. All eleven measured response sizes stayed identical.

| Operation | Before p50 ms | After p50 ms |
| --- | ---: | ---: |
| health | 0.093 | 0.092 |
| initialize | 0.146 | 0.177 |
| tools | 0.125 | 0.139 |
| item | 0.130 | 0.138 |
| search | 0.525 | 0.547 |
| stack | 0.465 | 0.445 |
| listing | 2.206 | 2.240 |
| installation | 0.073 | 0.075 |
| resource | 0.789 | 0.819 |
| malformed | 0.045 | 0.047 |
| overlimit | 0.179 | 0.185 |

Cold import: 49.412 → 48.336 ms; whole-process peak RSS: 156110848 → 154333184 bytes. Raw receipts retain p95/p99, throughput and CPU measurements.

## Remaining boundaries

Earlier H11 (native runtime buffers up to 8 MiB before the application's 128 KiB guard) and H12 (optional bearer comparison lacks a constant-time runtime primitive) remain open, with ingress requirements and the exact upstream body-limit proposal in `docs/PRODUCTION_HARDENING.md`. Account controls, full MCP conformance, staging clients and production deployment are still unverified. This round does not claim exhaustive proof against every malformed input.

SignalBox: no new captures warranted. Resolved changes are recorded here and in Strata; the previously tracked body-limit issue remains the existing capture/signal, without duplication.
