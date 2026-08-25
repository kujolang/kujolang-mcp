# Weekly catalog refresh

The weekly workflow keeps three copies of the public catalog aligned:

1. the reviewed `kujolang.ai` source checkout;
2. `data/catalog.json` on the `kujolang-mcp` GitHub branch;
3. the catalog served by the live MCP endpoint.

The workflow is implemented in Kujo. It uses fixed argument arrays for Git and Kujo subprocesses and never evaluates shell text.

## One-time setup

Keep clean local checkouts of `kujolang.ai` and `kujolang-mcp`. The scheduled operator needs permission to fast-forward both repositories and push `kujolang-mcp` to `origin/main`.

Create an operator-owned Kujo deployment adapter outside the repository. The adapter is deliberately deployment-platform-specific and is not committed here because the repository does not yet know whether production will use a container platform, VM, or managed service. The weekly runner invokes it as:

```text
kujo run /secure/operator/deploy_kujolang_mcp.kujo --interpreter -- \
  --repository /path/to/kujolang-mcp \
  --branch main \
  --catalog-revision <sha256> \
  --health-url https://mcp.kujolang.ai/health
```

The adapter must deploy the supplied repository commit, wait for rollout completion, and exit nonzero on failure. It must read credentials from the deployment platform's secret store, never from committed files. Keep its commands fixed and pass arguments as arrays to `spawn_process`; do not accept or evaluate shell command strings.

The live `/health` response must include the `catalog_revision` emitted by the current server. That revision covers both catalog records and installer profiles, so verification detects either kind of drift.

## Weekly command

Once the live deployment adapter exists:

```bash
kujo run scripts/weekly_refresh.kujo --interpreter -- \
  --site /absolute/path/to/kujolang.ai \
  --branch main \
  --update-source \
  --publish \
  --deploy-script /secure/operator/deploy_kujolang_mcp.kujo \
  --live-health-url https://mcp.kujolang.ai/health \
  --require-live
```

Before hosting is configured, omit the final three live options. The workflow will still update, test, commit, and push the GitHub catalog, while its receipt reports `live_verified: false` rather than pretending deployment occurred.

The command fails closed when either checkout is dirty, a branch cannot fast-forward, source metadata is invalid, the tests fail, unexpected files change, the push fails, deployment fails, or the live digest differs. If catalog content has not changed, it creates no empty commit. A live adapter may still run so an out-of-date service can converge on the repository revision.

## Copy/paste scheduled-task prompt

Replace every value in angle brackets before saving this as a weekly task:

```text
Maintain the public Kujolang MCP catalog using only the repository's Kujo workflow.

Repository: <ABSOLUTE_PATH_TO_KUJOLANG_MCP>
Website source: <ABSOLUTE_PATH_TO_KUJOLANG_AI>
Branch: main
Live health URL: https://mcp.kujolang.ai/health
Deployment adapter: <ABSOLUTE_PATH_TO_PRIVATE_KUJO_DEPLOY_ADAPTER>

From the repository root, run exactly:

kujo run scripts/weekly_refresh.kujo --interpreter -- --site <ABSOLUTE_PATH_TO_KUJOLANG_AI> --branch main --update-source --publish --deploy-script <ABSOLUTE_PATH_TO_PRIVATE_KUJO_DEPLOY_ADAPTER> --live-health-url https://mcp.kujolang.ai/health --require-live

Do not repair dirty working trees, force-push, rewrite history, bypass a failed test, edit generated catalog data by hand, expose credentials, or substitute a shell script. If the command fails, leave evidence intact and report the failing phase and its error. Success requires the final JSON receipt to have ok=true and live_verified=true. Report whether source data changed, whether a commit was published, the commit SHA, catalog revision, counts, and live verification result.
```

## Operator checks

Retain the JSON receipt in the scheduler history. Alert on a nonzero exit, a missing receipt, or `live_verified: false`. Periodically compare the receipt's item counts with expected ecosystem growth; a successful zero-count or sharply reduced catalog should be treated as suspicious even if schema validation passes.

Use a single active scheduled run at a time. The clean-tree and fast-forward guards prevent concurrent jobs from silently overwriting one another, but overlapping jobs will fail noisily and should be investigated.
