# Privacy-friendly catalog analytics

The public MCP endpoint uses aggregate activity to improve catalog coverage and reliability.
We do not count unique people or track sessions, repeat visitors, or individual journeys.

## What is stored

Daily UTC counters for initialization and tool calls, fixed tool names, coarse outcomes,
fixed topic categories, validated public catalog slugs, installation profiles, result-count
buckets, dispatch-time buckets and catalog revision. These are separate aggregate totals,
not per-request records. Topics are classified with local rules; query text is discarded.
Unknown item names are recorded only as "unknown". Errors never include messages or inputs.

No raw queries, prompts, request/response bodies, IP addresses (including hashes), user-agent
strings, client names, request IDs, credentials, cookies or persistent identifiers are
written to the analytics database. The dashboard has no external assets or browser storage.

## Choice and scope

Send `X-Kujo-Telemetry: off`, `DNT: 1`, or `Sec-GPC: 1` to exclude a request.
Our production verification requests use the opt-out header. Health checks, notifications,
pings, discovery, dashboard visits and requests rejected before RPC dispatch are not counted.
Unmarked automated clients cannot be distinguished from other usage without tracking them.
The native server does not collect these counters.

## Retention and access

Only the current and preceding 29 UTC calendar days are visible. Older counters are deleted
on writes and by a daily scheduled cleanup; a cleanup outage can delay physical deletion.
Cloudflare D1 recovery backups may retain deleted aggregate counters under the account's
Time Travel policy. No raw event data is ever written for recovery to retain.
Dashboard data is restricted to the operator using a high-entropy bearer key, sent only in
an Authorization header. It is never placed in URLs or persisted in browser storage.

Worker observability logs and traces are disabled to avoid automatically persisting request
URLs and request context. Cloudflare still processes connection data to deliver and protect
the service and supplies infrastructure-level metrics; this notice describes our application
analytics, not a promise that the network provider processes no connection information.

## Interpretation

Counters are unsampled and best effort, not billing records. Opt-outs, outages and quotas can
cause undercounting. Nonempty results are a coverage signal, not proof of relevance or task
success. No inferred agent rating is presented as human feedback. Topic classification is
approximate. No automatic feedback collection or cross-request funnel is implemented.

Analytics runs after dispatch without delaying responses. Database failures do not affect
MCP results. Operators should check D1 health and cleanup execution separately when counters
appear stale. No paid-plan upgrade is required or performed by this implementation.
