# Protocol and compatibility evidence

Authority checked 2026-10-23:
- https://modelcontextprotocol.io/specification/2025-06-18/basic/transports
- https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle
- https://modelcontextprotocol.io/specification/2026-07-28/basic/index
- https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http

Local Node Fetch clients and native Kujo HTTP were tested for both advertised
versions, negotiation, discovery, calls, every resource and prompt, installer
profiles, bad envelopes, unsafe IDs, duplicate keys, depth, Unicode byte limits,
Origin/Host, media type, Accept, metadata binding, encoded Mcp-Name, notifications,
unknown methods, aliases and recovery. See `hardening/http-tests.txt` and the
executable corpus in `tests/hardening_http_test.mjs`. JSON object key ordering and
JSON text serialization whitespace are normalized; no security field is removed.

Complete tool schemas and static surfaces now originate in Kujo and compare
exactly. Corrected Worker resource envelopes, recommendation shape and WebOps
filtering intentionally converge on the native API. Compact tool text retains
both MCP representations; clients should prefer structured content.

Compatibility limitations: permissive headerless legacy requests remain accepted;
no sessions, SSE event delivery, subscriptions, HTTP+SSE legacy transport, or STDIO
launcher is implemented by this catalog. HTTP GET remains 405. Native runtime
unmatched paths have a framework-produced 404 without all application headers;
Worker 404s have defensive headers. Runtime admission-generated 503s similarly
originate outside application response helpers. Neither contains secrets.

The official conformance runner and interactive Codex/Cursor/Claude Desktop
sessions were not run against this catalog. Framework host tests prove their own
Ability package, not this server's host certification. The 2026 client metadata
is version-bound but full clientInfo/clientCapabilities schema validation and
capability-negotiation conformance remain unproven. Do not equate the local corpus
with complete specification certification.
