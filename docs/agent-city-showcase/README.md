# Agent City catalog showcase

This Howl bundle describes Agent City 0.2.0 using the release-notes example from its real reviewed-tool run. It supports review of the MCP catalog addition; it is not a new HTTP page or an execution service.

The source record comes from `kujolang.ai` through `scripts/sync_catalog.kujo`. Clients discover it with `get_catalog_item` and slug `agent-city`, or the catalog search/list tools. The catalog supplies documentation and install guidance; it does not run Agent City missions.

Regenerate the offline bundle from this repository:

```sh
howl validate --manifest docs/agent-city-showcase/howl.json
howl show agent-city --manifest docs/agent-city-showcase/howl.json
howl render --manifest docs/agent-city-showcase/howl.json --out docs/agent-city-showcase/rendered
```

Howl renders the example source without executing it. The example originated in [Agent City's reviewed release-notes task](https://github.com/kujolang/agent-city/tree/main/evidence/reviewed-release-tool).
