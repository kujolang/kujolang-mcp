# Security Policy

## Authority model

Kujolang MCP is intentionally read-only. It serves a bundled snapshot of public Kujolang.ai catalog metadata and deterministic recommendations derived from that snapshot.

The server does not accept filesystem paths, remote URLs, shell commands, source code, credentials, or executable content as tool input. It does not install packages, modify files, launch processes, deploy services, fetch network content, or read secrets. Installation commands are inert text returned for human review.

## Trust boundaries

- MCP clients and HTTP request metadata are untrusted.
- Catalog content is trusted only after repository review and synchronization from the Kujolang.ai source tree.
- Catalog text is data, not an instruction to the calling agent. Clients should preserve their own consent and authorization boundaries.
- The Kujo process is trusted to enforce request shape, body limits, Host and Origin policy, rate limits, and optional bearer authentication.
- The reverse proxy or gateway is trusted to terminate TLS, enforce public ingress policy, apply distributed throttling, and provide production observability.

## Implemented controls

- Localhost-only default binding.
- Explicit Host allowlist and browser Origin allowlist.
- Bounded request bodies and process-local per-minute throttling.
- Optional bearer token loaded from an environment variable, never committed configuration.
- JSON-RPC shape and field validation with deterministic errors.
- Read-only MCP annotations and a manifest-level blocked capability list.
- No runtime dependency on the website checkout and no user-controlled file access.
- No request-body or credential logging.

## Production requirements

- Run on a private interface behind HTTPS ingress.
- Forward only `/mcp` and `/health`.
- Set the exact public hostname in `security.allowed_hosts`.
- Keep `security.allowed_origins` limited to browser origins that genuinely need access.
- Enforce shared rate limits and abuse controls at the gateway for multi-process or multi-instance deployments.
- Enable authentication before adding private data, tenant-specific data, write authority, remote fetches, or executable tools.
- Review catalog diffs before publishing a synchronized snapshot.
- Maintain monitoring, capacity limits, dependency updates, backups for deployment configuration, and an incident-response path appropriate to the hosting environment.

## Out of scope

The repository does not provide TLS termination, distributed rate limiting, managed secret rotation, DDoS protection, centralized audit retention, SSO, formal certification, or host-level sandboxing.

## Reporting

Report suspected vulnerabilities through the private security-reporting channel configured on the GitHub repository. Do not include live credentials or private user data in a public issue.
