# GitHub operator workflow (read-only)

Run from repo root:

```bash
node operator/workflows/github/operator-snapshot.mjs
```

## Environment

| Variable                       | Purpose                                                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GITHUB_TOKEN` or `GH_TOKEN`   | Optional bearer for REST (higher limits; never logged).                                                                                                 |
| `GITHUB_OPERATOR_REPO`         | Default `openclaw/openclaw` (`owner/name`).                                                                                                             |
| `GITHUB_SNAPSHOT_PLAYWRIGHT=1` | When **no** token, also open the public issues page in headless Chromium and append a short HTML excerpt to the report (extra RAM; one browser launch). |
| `GITHUB_SNAPSHOT_MEMORY`       | Set to `0` to skip appending a small summary row to `operator/memory/data/github_summaries.jsonl`.                                                      |

Without a token, the script uses the **public** GitHub REST API first. If that returns **403** or **429**, it automatically runs the Playwright path (still no login) to capture limited public-page text.

Output: `operator/reports/github-operator-report.md` (gitignored). No push, merge, or delete operations.
