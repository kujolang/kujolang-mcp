# Hardening baseline — 2026-10-23

Base: `b40ec213726a097bbc67510a21ed91d6c57a5985` (clean main at start).
Framework build pin: `9959b8e76b70cd30a4e3a0359d033715fd6cbd19`;
accessible framework HEAD: `77180a3a6c104f0c5b185cefa1f6d0835edb704b` (template identical).
Website pin: `e3ed371e23e09b854b989954b19aa512a3124e52`.
Runtime requirement: v1.9.0; local binary reports 1.9.0, SHA-256
`4044e0ace0504b5e100c5f05b1acbcf598e33eef1ef10923f511575d03d82587`.
The PATH binary is older (1.5.0); tests explicitly select the 1.9.0 binary.
Local runtime checkout has unrelated edits and is not modified. Binary source
provenance cannot be inferred from its version; results describe this exact binary.
Node v26.12.1, macOS x86_64. No production load or deployment performed.

All four assertion suites, self-check, existing Worker contracts and native HTTP
quota test passed. See `hardening/baseline-tests.txt`. Search: 500 operations,
9038.896094 ms, 55.31648940315831 operations/s. Local Worker endpoint measurements
are in `hardening/worker-before.json` (100 measured samples after 10 warmups).

237 records; catalog revision
`73bfcb690a45974b706144ca3d528dd39e8718fa356fcecf51df683ea17394ce`.
Worker SHA-256 `70b2d122426ae2a0249d3fe327b4a95c8adc0c7f56fe217c987633ecb0001821`.
Generation receipt SHA-256 `e1d9f0c712a5c53c4c55c49bfcf1ef848515f2b34e00abd526dcf74703500588`.
Fixtures SHA-256 `746512f8750b584eae43d88a4b56c9063309973a5e6a39dc783ad3cb7a34dc2e`.

Native defaults: loopback, 128 KiB application body check, 120/minute quota,
Host allowlist, no browser origins, optional env bearer, public ingress acknowledgement.
Worker: 128 KiB check after buffering, 1 MiB response character check, public
custom hostname plus wildcard workers.dev hosts, no Origin guard or distributed
rate limit. workers_dev=true, previews=false, sampled observability=0.1.
Actual plan, WAF, routes, deployment identity, TLS controls and account settings
are **unverified**; configuration files do not prove deployed protections.

Latest server release inspected: v0.1.0 preview (2026-10-22); GitHub open-issue
query returned no entries. Recent five commits reviewed. No baseline test failures
were repaired. Existing parity covers item/profile subsets, not complete protocol.
Generated Worker duplicates registry behavior and search normalization per request.
Runtime source already bounds bodies at 8 MiB, has read timeout and concurrency
controls; the application's smaller limit still occurs after buffering.
