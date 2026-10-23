# Security validation

Run with the exact Kujo 1.9.0 binary identified in the baseline, Node v26.12.1,
loopback native server and in-process generated Worker. No adversarial production
traffic was sent. Raw concise outputs are under `evidence/hardening/`.

- Twelve malformed/missing configuration and corrupt catalog startup cases fail deterministically.
- Five assertion suites: catalog, protocol, HTTP security, generation and added
  hardening assertions. Fresh-digest catalog mutations cover accessed field types,
  URL poisoning, and malformed registry state. Seven added hardening blocks cover
  media type, JSON depth/duplicate decoded keys, dispatch ordering, Host/singleton
  headers, bucket bound/rollover and bearer scheme quota identity.
- 225-case differential HTTP corpus covers all seven tools, six resources, three prompts,
  profiles, 50 deterministic malformed-type fuzz cases, UTF-8 byte/depth/key-count
  boundaries, encoded modern headers, aliases, Accept, Origin and concurrent recovery.
  Results and defensive headers compare after only JSON text/order normalization.
- Worker stream test supplies an endless source and proves cancellation after the
  third 64 KiB chunk, before EOF/full buffering. Forbidden workers.dev host tested.
- Native raw sockets test duplicate Host/Authorization; optional bearer challenge,
  malformed/empty/wrong tokens and logging exclusion tested. 40 concurrent requests
  cannot exceed a 20-request quota, and sequential draining verifies exact exhaustion.
  Scheme case and spoofed X-Forwarded-For cannot obtain new quota.
- Existing worker item/profile contracts and persistent native alias quota test pass.
- 90 native search baseline cases have the same SHA-256 result digest after top-K.
- Entire framework suite passes, including security, endpoint, generation and its
  independent Ability host tests. Missing worktree dependency was restored at the
  lockfile pin. An existing test assumes directory basename `mcp`; the isolated
  worktree was moved to that basename rather than changing unrelated tests.
- Catalog freshness is checked against the exact pinned website, not its current
  moving checkout. Generated artifacts reproduce byte-for-byte and hashes verify.

Pre-fix failures observed: invalid Content-Type prefix accepted; no-ID tool processing
preceded 202; over-limit multibyte request returned 200; concurrent quota 20 admitted
32 requests; Worker streaming did not cancel before read completion. Existing tests
passed before these cases were added, illustrating their previous coverage gaps.

Limits: no formal property-testing engine or mutation-score tool was run; deterministic
type fuzzing, adversarial boundary cases and catalog mutations are the actual tests.
No native slow-client/staging ingress proof or Cloudflare CPU limit enforcement test
was performed. Native transport-generated 404/503 responses differ in headers from
application responses. No production or major-client certification is implied.
