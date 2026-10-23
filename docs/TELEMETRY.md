# Privacy-friendly catalog analytics

The public MCP endpoint uses aggregate activity to improve catalog coverage and reliability.
We do not count unique people or track sessions, repeat visitors, or individual journeys.

## What is stored

Daily UTC counters for initializations and tool calls, fixed tool names, coarse outcomes,
fixed topic categories, validated public catalog slugs, installation profiles, result-count
buckets, dispatch-time buckets and catalog revision. Historical totals are separate counters.
The detailed-analytics upgrade also records aggregate combinations of tool, topic, outcome,
latency bucket, revision, public item/profile and result-count bucket for each UTC day.
These are incremented counts, not individual event records. Topics are classified with local
rules; query text is discarded. Unknown item names are recorded only as "unknown".

No raw queries, prompts, request/response bodies, IP addresses (including hashes), user-agent
strings, raw client names or versions, request IDs, credentials, cookies or persistent identifiers are
written to analytics storage or its backups. Errors never include messages or inputs.
Operational health records contain scheduled-check and backup timestamps/status, not
individual request timestamps. The dashboard has no external assets or browser storage.

## Choice and scope

Send `X-Kujo-Telemetry: off`, `DNT: 1`, or `Sec-GPC: 1` to exclude a request.
Our production verification requests use the opt-out header. Health checks, notifications,
pings, discovery, dashboard visits and requests rejected before RPC dispatch are not counted.
Unmarked automated clients cannot be distinguished from other usage without tracking them.
The native server does not collect these counters.

## Retention, backups and access

Daily aggregates are now retained long-term, until explicitly removed by the operator,
so months and years can be compared. The former rolling 30-day deletion policy is retired.
This preserves existing counters; deleted data and previously uncollected combinations
cannot be reconstructed. Detailed coverage begins at the upgrade timestamp shown in the dashboard.

An hourly scheduled job copies daily aggregates into a separate private Cloudflare R2 bucket,
with content-addressed snapshots, checksums and read-back verification. It catches up older
days, refreshes yesterday, and snapshots today provisionally. Earlier verified snapshots are
retained, with no automatic expiration configured. Storage limits, costs and backup failures
must be monitored. D1 recovery backups also follow the account's Time Travel policy.
Downloads and backups contain only these aggregates; no raw events are saved for recovery.

Dashboard pages, data, exports and health are restricted through Cloudflare Access and
independent signed-token validation. Cloudflare uses operator authentication cookies and
processes login identity and access logs separately; none enter our analytics database.
Public MCP users do not need this login and receive no application tracking cookies.
Worker observability logs and traces remain disabled. Cloudflare still processes connection
data to deliver and protect the service; this notice describes application analytics.

## Interpretation

Counters are unsampled and best effort, not billing records. Opt-outs, outages and quotas can
cause undercounting. A successful heartbeat verifies a scheduled database write/read, not
that every request was counted. Quiet traffic and missing writes cannot always be distinguished.
Today and the first collection day are partial; live exports may change while traffic arrives.

Nonempty results are a coverage signal, not proof of relevance or task success. Catalog item
and installation-profile requests show interest, not downstream installations or actual use.
Topics are approximate. Dispatch latency excludes network and database time. There is no
automatic satisfaction rating, raw-query collection or cross-request funnel.
Analytics runs asynchronously; storage failures do not affect MCP responses.

## Calling application categories

We also count fixed client categories (Codex, Claude Code, Claude Duet, Grok Bot,
Muse, Pi, CommandCode, Other and Unknown). Initialization uses the declared
`clientInfo.name`; individual tool calls use only a recognizable User-Agent on that
same request. These are unverified, spoofable application labels, not model or person
identities. Other means an unrecognized initialization name; missing names and generic
or unrecognized request headers are Unknown. We discard the original name, version and
header. No persistent identifier, fingerprint or session linkage is created, and a
client's initialization never labels its later requests. The same opt-outs, private
access, long-term aggregate retention and backups apply. Older traffic is not attributed
retroactively. Client counters overlap existing totals and must not be added to them.
