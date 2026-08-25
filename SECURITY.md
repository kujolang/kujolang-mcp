# Security Policy

## Authority model

Kujolang MCP is intentionally read-only. It serves a bundled snapshot of public Kujolang.ai catalog metadata and deterministic recommendations derived from that snapshot.

The server does not accept filesystem paths, remote URLs, shell commands, source code, credentials, or executable content as tool input. It does not install packages, modify files, launch processes, deploy services, fetch network content, or read secrets. Installation commands are inert text returned for human review.

## Trust boundaries

- MCP clients and HTTP request metadata are untrusted.
- Catalog content is trusted only after repository review and synchronization from the Kujolang.ai source tree.
- Catalog text is data, not an instruction to the calling agent. Clients should preserve their own consent and authorization boundaries.
- The Kujo process is trusted to enforce request shape, application-visible body limits, Host and Origin policy, local-only rate buckets, and optional bearer authentication.
- The reverse proxy or gateway is trusted to terminate TLS, reject oversized bodies before runtime buffering, enforce public ingress policy, apply per-client and overload throttling, and provide production observability.

## Implemented controls

- Localhost-only default binding.
- Mandatory explicit Host allowlist and browser Origin allowlist.
- Bounded application-visible request bodies and local per-client buckets when the runtime provides peer identity.
- Fail-closed non-loopback startup unless trusted ingress limits are acknowledged; public listeners cannot enable the unreliable application-local limiter.
- Optional bearer token loaded from an environment variable, never committed configuration.
- JSON Content-Type, JSON-RPC shape, identifier, parameter-container, field-length, and numeric-range validation with deterministic errors.
- Deduplicated and capped query terms, precomputed search indexes, and bounded result sets.
- Catalog shape, count, unique-slug, and SHA-256 content-integrity validation at startup.
- Defensive security headers on JSON responses.
- Read-only MCP annotations and a manifest-level blocked capability list.
- No runtime dependency on the website checkout and no user-controlled file access.
- No request-body or credential logging.

## Production requirements

- Run on a private interface behind HTTPS ingress.
- Set `security.trusted_ingress_limits` only after ingress limits are operational.
- Disable `http.rate_limit_enabled` for non-loopback listeners and enforce per-client plus global overload limits at ingress.
- Forward only `/mcp` and `/health`.
- Set the exact public hostname in `security.allowed_hosts`.
- Keep `security.allowed_origins` limited to browser origins that genuinely need access.
- Enforce request-body bytes and connection/read timeouts before Kujo buffers the request.
- Strip or overwrite client-supplied forwarding identity headers before applying gateway limits.
- Enable authentication before adding private data, tenant-specific data, write authority, remote fetches, or executable tools.
- Review catalog diffs before publishing a synchronized snapshot.
- Maintain monitoring, capacity limits, dependency updates, backups for deployment configuration, and an incident-response path appropriate to the hosting environment.

## Out of scope

The repository does not provide TLS termination, pre-buffer request enforcement, distributed rate limiting, managed secret rotation, DDoS protection, centralized audit retention, SSO, formal certification, or host-level sandboxing.

## Reporting

Report suspected vulnerabilities through the private security-reporting channel configured on the GitHub repository. Do not include live credentials or private user data in a public issue.
