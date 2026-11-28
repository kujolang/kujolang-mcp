# Public Kujo MCP onboarding roadmap

The public server should help an agent go from a stated task to a verified first run. Improve recovery in the existing catalog tools, then add one read-only quickstart tool with a small set of maintained recipes. Keep installation and execution in the user's environment.

## 1. Diagnose and reduce failed discovery

- Publish example calls alongside the current schemas and in the connection guide. Show `query` for search, `task` for recommendations, a singular `kind`, and canonical slugs from catalog results. Add a short recovery hint to validation errors, with one corrected example.
- Give exact item resolution a deterministic order of canonical slug, exact title, and reviewed alias. Consider matching known catalog URLs against the bundled records without fetching them. On a miss, return a short list of candidate slugs and a search fallback. Only resolve exact, unambiguous identities automatically.
- Keep current tool names and fields compatible. Test existing and new response shapes on the native server and generated Worker. Test tool discovery and execution with representative installed clients on both advertised MCP versions. Compare the request conventions with the [published 2026 MCP specification](https://modelcontextprotocol.io/specification/2026-07-28).
- Track catalog misses separately from invalid arguments, unrecognized tools, malformed RPC calls, server faults, and transport rejections. Use fixed reason codes and bounded method and protocol-version labels in daily aggregates. Legacy rows should show their original coverage. Preserve telemetry opt-outs and the existing privacy model.
- Report calls, valid queries, empty valid queries, and errors together. Separate tool outcomes from connection events. Track `tools/list` and `server/discover` activity independently so deployment and documentation changes can be evaluated without assuming a user-level funnel.

## 2. Improve relevance before expanding search

- Maintain a versioned fixture set of realistic first tasks, exact names, aliases, spelling variants, unsupported tasks, and restrictive filters. Judge the top three by whether an agent can identify an appropriate next step. Include intentionally unsupported requests to catch false positives.
- Prefer exact identity, then reviewed aliases and capability tags, then general text matches. Provide labeled alternatives when a filter or query excludes all candidates. Apply the same relevance checks to recommendations. For WebOps, distinguish topical matches from general WebOps suggestions so a generic result cannot pass as a match.
- Use exact catalog slugs, tool or workflow role, version, scope, and source URLs in recommendation payloads. Show which profile supplies each component. Keep the payload bounded and use the catalog revision as provenance.

## 3. Ship one concrete first-run tool

**Proposed `get_kujo_quickstart`.** Accept a published recipe identifier and optional CLI environment or already-installed version. Start with agent approval, deterministic evaluation, and read-only WebOps review. Return:

- A minimal set of prerequisites and canonical catalog slugs.
- The matching profile or item-level install instructions from reviewed catalog data.
- A maintained example, an ordered first-run checklist, and a smoke check with the expected output.
- Supported versions, source URLs, catalog revision, and a next step for a missing prerequisite.

Test each recipe from a clean workspace using the documented prerequisites and pin recipes to their reviewed source versions. Make recipes available as bounded MCP resources so resource-capable hosts can open the same content directly. Keep the tool callable by hosts that expose only tools. Existing adoption prompts can link to the recipes.

**Consider after quickstart data accumulates**

| Capability | When it earns a separate tool |
| --- | --- |
| `search_kujo_docs` | Repeated task fixtures require versioned documentation beyond catalog summaries. Index reviewed source excerpts with permalinks and version metadata. |
| `get_workflow_recipe` | Users need reusable inputs, outputs, prerequisites, and dry-run guidance across many workflows. Start by adding that metadata to `get_catalog_item` and the recipe resources. |
| `check_kujo_compatibility` | Version and host mismatches become a measured cause of failed starts. Return a static compatibility decision and migration links from declared inputs. |
| Compare profiles or fetch multiple items | Profiles prove hard to choose, or measured setup examples require repeated lookup calls. Add compact profile guidance to `get_installation` and test it before exposing a new endpoint. |

## 4. Grow qualified usage

- Use the existing official and GitHub MCP registry listings, the project README, and the install docs to point to the same first successful call. Verify the published listing version and endpoint when releasing.
- Publish three end-to-end examples, one per starter recipe, with client setup, copyable first prompts, and expected outputs. Check the path from the listing through the first usable result in Codex, Claude Code, and VS Code or another verified client. Record host version and negotiated protocol for each check.
- Measure completed UTC windows. Start with counts and intervals, report search denominators, and keep task-fixture first-run success separate from live call volumes. Use weekly counts for direction and a 28-day cohort of dates for release comparisons. Low-volume tool results should include both numerator and denominator.

## Release gates and proposed targets

1. **Measurement first.** Tests reconcile reason totals with aggregate outcomes. Unsupported arguments and unexpected server faults appear separately. Recording respects telemetry opt-outs, and synthetic probes are excluded from production counts.
2. **Discovery next.** Exact lookups and documented error recovery pass in both runtimes. Set a proposed target of at least 90% top-three relevance on the versioned task suite. Keep intentional misses distinguishable from suggested alternatives.
3. **Quickstart last.** All three recipes complete from a clean environment and the tested clients can retrieve them. Compare error and valid-empty rates over complete 28-day windows. Aim for at least a 50% relative reduction in avoidable discovery errors and under 8% valid-empty search after at least 100 valid queries. Treat these as proposed product targets and revisit them once the new metrics establish a comparable baseline.
