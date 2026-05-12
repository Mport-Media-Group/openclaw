# Operational checklist

1. **Node**: **22.16+** (22.22.x recommended) on `PATH` for `openclaw doctor` and engines.
2. **Dependencies**: Repo root `pnpm install` (see root `AGENTS.md`).
3. **Operator stack root**: `OPENCLAW_OPERATOR_STACK_ROOT` or `plugins.entries["operator-stack"].config.stackRoot`.
4. **Enable plugin**: `plugins.entries["operator-stack"].enabled: true`.
5. **Ollama** (optional): `brew install ollama` when Homebrew exists; `ollama serve`; `bash operator/scripts/ollama-pull-minimal.sh`; validate with `node operator/runtime/ollama-health.mjs`.
6. **OpenClaw**: `pnpm openclaw doctor`; E2E appends to `operator/reports/doctor-latest.txt` (gitignored).
7. **Playwright**: `pnpm exec playwright install chromium`; smoke `node operator/browser-automation/runtime-check.mjs`.
8. **Optional cloud probes**: `OPERATOR_PROVIDER_PROBE=1 node operator/runtime/provider-health.mjs` (minimal GETs; never logs secret bodies).
9. **GitHub snapshot**: `node operator/workflows/github/operator-snapshot.mjs` — token optional; set `GITHUB_SNAPSHOT_MEMORY=0` to skip JSONL append to `operator/memory/data/github_summaries.jsonl`.
10. **AWS (read-only)**: AWS CLI on PATH + keys; `node operator/integrations/aws/sts-check.mjs` then list scaffolds (`ecs-list`, `ecr-list`, etc.).
11. **InterSystems**: `node operator/intersystems/runtime-health.mjs` with optional `IRIS_PORTAL_BASE_URL`, `IRIS_FHIR_BASE_URL`.
12. **Sasha gate**: `OPERATOR_MAX_APPROVAL`; `node operator/sasha/approval-engine.mjs <script>` (exit **2** = blocked).
13. **Dashboard**: `cd operator/dashboard && npm install && npm run sync-reports && npm run dev` (standalone; not root workspace).
14. **Validation**: `node operator/scripts/run-e2e-validation.mjs`.
