# Methodology

Date: 2026-10-08. Scope: Agent City read-only MCP catalog record and offline Howl showcase. Origin: https://mcp.kujolang.ai. Audience: developers and agents choosing local Kujo tools. Primary conversion: read setup guidance and inspect the versioned source release.

Source facts come from Agent City v0.2.0 and its current public setup guides. Orwell editing preserves permissions and limits while removing session history. Howl renders source-grounded artifacts offline; it does not execute the included Kujo example.

`baseline-seal.json` records the source commit and each generated file's SHA-256. The compressed raw baseline is retained locally, read-only, under `raw/`; large raw output is excluded from Git. `baseline-production.json` independently records the live before-state. Baseline data is never overwritten by the after crawl.

For HTML sites, the website repository's `scripts/seo_audit.py` inventories every generated directory page and records titles, descriptions, headings, links, images, canonicals, sitemap membership, and JSON-LD. The same parser and origin run before and after. Counts are diagnostic, not a platform score. Full inventory coverage does not establish real-world search visibility.

The MCP origin serves a read-only protocol API, not public HTML pages. HTML metadata, sitemap inclusion, and rich-result eligibility are not applicable to that endpoint. Catalog synchronization, generated Worker parity, and a live protocol lookup test its discovery contract.

Production checks distinguish 404 from 403/429 bot challenges. An unavailable or blocked external link is not labeled broken without corroboration. Browser checks cover desktop and narrow layouts, visible content, keyboard focus, image dimensions, and obvious overflow; they do not replace a human assistive-technology review.

For Kennel, directory pages redirect slashless URLs to trailing-slash URLs. The generic link-graph parser does not normalize these aliases, so its orphan count is not proof of orphaned content. Canonical targets that redirect and missing sitemap/schema coverage are existing registry-wide recommendations, outside this Agent City content addition. Package versions remain immutable.

The live baseline accidentally probed `/ecosystem/showcases/` on the main site; that 404 is retained as evidence of the probe, not a defect. The actual category is `/ecosystem/showcase/`, verified separately.

HTML-specific CSVs are intentionally omitted for this API-only host. Catalog counts and live JSON-RPC parity are the applicable before/after datasets. The root, robots, and sitemap 404 responses are expected; they are not missing product pages.
