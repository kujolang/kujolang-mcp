# Performance comparison — local measurements

Environment: macOS x86_64, Intel Core i7-9750H @ 2.60 GHz, Node v26.12.1; Kujo binary identity in baseline. Measurements were taken on a shared workstation with variable contention; they are not isolated-lab or production capacity results.

## Worker endpoint measurements

100 measured samples after 10 warmups, sequential requests per endpoint. p50/p95/p99 in milliseconds; throughput includes request construction and warmups. Responses are fully consumed. Raw CPU user/system milliseconds, throughput, min/max, response bytes, module-import time and process peak RSS are retained in the JSON receipts. No remote load was sent.

| Endpoint | Before p50/p95/p99 ms | After p50/p95/p99 ms | Before/after bytes |
|---|---:|---:|---:|
| health | 0.078/0.141/0.169 | 0.073/0.107/0.155 | 216/242 |
| initialize | 0.098/0.163/0.231 | 0.110/0.152/0.164 | 292/525 |
| tools | 0.113/0.172/0.401 | 0.094/0.144/0.327 | 4670/5060 |
| item | 0.076/0.127/0.164 | 0.099/0.152/0.176 | 2760/2662 |
| search | 18.536/24.120/27.988 | 0.399/0.826/2.021 | 26963/24238 |
| stack | 13.352/30.615/47.368 | 0.333/0.409/0.437 | 16806/14618 |
| listing | 3.584/6.740/14.149 | 1.613/2.035/2.151 | 462499/429564 |
| installation | 0.079/0.314/0.869 | 0.060/0.069/0.086 | 1534/1566 |
| resource | 1.538/6.203/14.670 | 0.610/0.926/1.114 | 152286/152298 |
| malformed | 0.060/0.348/3.129 | 0.036/0.042/0.049 | 75/106 |
| overlimit | 0.378/0.971/2.602 | 0.137/0.157/0.160 | 51/51 |

Module import: 27.424 → 36.496 ms. Process peak RSS: 214003712 → 153362432 bytes. These include Node and the full benchmark process, not an individual Worker request. Larger generated canonical registry content increases cold initialization; this is a measured tradeoff, not a cold-start improvement.

Two additional fresh-process runs per version are in `worker-before-repeat*.json` and `worker-after-repeat*.json`. Search p50 range across all three runs:
- before: 18.536–27.684 ms.
- after: 0.359–0.399 ms.

## Native measurements

The same endpoint harness used local HTTP against a spawned native server with quota disabled. Native cold start includes startup, catalog validation and first health response with 20 ms polling. CPU/RSS in native JSON receipts describe the Node client only; native server peak RSS and CPU were not instrumented.

| Endpoint | Before p50/p95/p99 ms | After p50/p95/p99 ms |
|---|---:|---:|
| health | 8.869/15.682/32.898 | 10.544/11.873/13.665 |
| initialize | 25.161/45.380/62.104 | 25.941/51.061/59.567 |
| tools | 22.756/41.222/65.470 | 20.859/56.401/74.347 |
| item | 20.775/30.590/34.419 | 21.619/22.854/25.297 |
| search | 116.654/187.353/253.880 | 29.574/32.284/37.360 |
| stack | 79.628/134.859/205.421 | 28.356/43.210/62.087 |
| listing | 67.960/101.108/163.599 | 33.281/35.971/37.734 |
| installation | 20.290/31.154/44.725 | 20.918/23.130/25.269 |
| resource | 49.320/107.255/157.813 | 27.962/29.712/32.326 |
| malformed | 9.847/14.107/22.149 | 12.240/13.962/15.267 |
| overlimit | 5.884/11.946/23.918 | 9.713/12.087/12.807 |

Native startup before/after: 853.667/365.332 ms. Several native endpoints regress with added guards and shared-machine noise; do not claim an across-the-board latency improvement. Exact repeated native endpoint distributions need an isolated staging runner before setting an SLA.

## Search algorithm and scaling

Three interleaved native runs, 500 operations each over five queries, preserve 90 baseline exact result digests (including filters, ties, prefixes and K=1/10/50). Raw timings are in `search-interleaved.json`. The initial baseline and unpaired trials remain recorded; the first paired run overlapped the tail of other local validation, so use ranges rather than a precise universal speedup.

| Variant | 500-operation elapsed range ms | Median ms | Median operations/s |
|---|---:|---:|---:|
| before | 15075.765–27803.852 | 18589.179 | 26.897 |
| after | 5562.551–8348.233 | 7400.201 | 67.566 |

Native search retains only K winning candidates and materializes public items after selection. Worker search uses the native precomputed index, filters before scoring, computes search once, and uses stable sorting. `selection.json` separately compares repeated scans, one sort and bounded top-K at 237/1,000/10,000/50,000 records with K=10/50 and stable ties. Those synthetic selection-only results do not measure full Kujo search or realistic future catalog size. The current catalog has only 237 records; inverted indexes and cursor pagination are deferred.

Tool responses keep both structured and text content for compatibility. Compact JSON removes pretty-print whitespace. The largest measured broad listing is 429564 UTF-8 bytes, below the 1 MiB Worker response cap. This is the measured current snapshot maximum listing, not a guarantee for arbitrary future content. Context-token counts were not measured.

## Reproduction

At the baseline commit and this branch, respectively, run:

```sh
kujo run benchmarks/search_benchmark.kujo --interpreter
kujo run benchmarks/search_contract.kujo --interpreter
node benchmarks/worker_benchmark.mjs
KUJO_BIN=/path/to/kujo-1.9.0 node benchmarks/native_benchmark.mjs
node benchmarks/selection_benchmark.mjs
```

Use the new benchmark scripts in the old checkout when comparing. Record environment and competing workload. The Worker harness emulates Fetch in Node; actual Cloudflare plan, per-invocation CPU/cold start, memory and request distribution remain unverified. Native/Worker validation is prioritized over synthetic throughput; no paid bindings or databases were introduced.
