# SiteKit 1.2.0 catalog adoption

The catalog is regenerated from website commit `9da4684` and the existing pinned MCP framework `8ae3218`. SiteKit now resolves to version 1.2.0 and its official release URL. Synchronization also carries forward the canonical website's existing description/readiness wording corrections; no runtime capabilities or tool contracts changed.

Native assertion suites passed with Kujo 1.9.0, followed by Worker parity, analytics, dashboard, history, clients, SQLite storage, native HTTP/config failures, 271 HTTP differential cases and concurrent authentication guards. An initial attempt picked up the older default runtime in child processes; setting KUJO_BIN to the reviewed 1.9.0 runtime resolved it. Missing local test dependencies were installed with npm ci before the passing Node checks.

Deployed Worker version: `c9d2b54d-7106-4727-a044-489258cb4706`.
Live receipt: `production.json` compares all 239 catalog records, six installer profiles, discovery and health against the generated Worker. Catalog revision: `f83bfd7b12d7995fa56defa002cd8484ac509ff05359421edbd1b5afe4250769`.
