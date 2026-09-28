# Kujo 1.6 catalog publication

Reviewed source: `573930d9718e22dadebfa255a14c8bf99aace0be`.
Website source: `60034b314f15c8f75e6491dd503ead11abb6e9ca`.
Runtime: published Kujo 1.6.0. Framework remains pinned to `07845898ee9f2662d0e0e364973d77cdaac04762`.

Native assertion suites, catalog synchronization check, self-check, native HTTP and Worker parity tests passed. Hosted validation: https://github.com/kujolang/kujolang-mcp/actions/runs/36479693166 (success).

Wrangler 4.130.0 dry-run passed. The first deployment request timed out at the Cloudflare API; retrying the unchanged artifact succeeded, Worker version `baef6263-5f0e-4f8f-adcc-2a87fe054fce`.

`production.json` records successful read-only comparison of all 230 catalog items, six installer profiles, exact item responses and public health against the generated Worker at `https://mcp.kujolang.ai/mcp`. Runtime version is 1.6.0; website version remains independently 1.2.10. No execution or trust capability was added.
