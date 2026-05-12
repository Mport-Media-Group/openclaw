# Final status (operator stack — Phase 2 expansion)

Last full gate: `node operator/scripts/run-e2e-validation.mjs` with **Node 22.22.x**
(re-generate `operator/reports/last-validation.json` locally; file is gitignored).

## Required checks

| Step                                  | Result                                                              |
| ------------------------------------- | ------------------------------------------------------------------- |
| Parse `operator/configs/models.json`  | Pass                                                                |
| Parse `operator/agents/registry.json` | Pass (9 agents)                                                     |
| `pnpm test extensions/operator-stack` | Pass                                                                |
| `pnpm openclaw doctor`                | Pass (append-only `operator/reports/doctor-latest.txt`, gitignored) |

## Advisory checks

| Step                    | Result                                                                            |
| ----------------------- | --------------------------------------------------------------------------------- |
| Node 22.16+             | Pass when using 22.22.x on `PATH`                                                 |
| `ollama` CLI on PATH    | Often **WARN** until `brew install ollama` + `ollama serve`                       |
| `ollama_model_probe`    | **WARN** until Ollama reachable; uses shared `operator/runtime/ollama-health.mjs` |
| Playwright smoke        | Pass after `pnpm exec playwright install chromium`                                |
| Sasha runtime plan emit | Pass                                                                              |

## Phase 2 operator-local additions

| Area                            | Location                                                                                               | Notes                                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Ollama health module            | `operator/runtime/ollama-health.mjs`                                                                   | Tags + sequential generates, retries, `ollama-health-out.json`                                                                       |
| Provider execution hints        | `operator/runtime/provider-router.mjs`                                                                 | `buildProviderExecutionPlan`, `RETRY_POLICY`, cloud fallback order                                                                   |
| Optional cloud probes           | `operator/runtime/provider-health.mjs`                                                                 | `OPERATOR_PROVIDER_PROBE=1` for minimal OpenAI/HF GET (no bodies logged)                                                             |
| Memory / embeddings stub        | `operator/memory/embeddings.mjs`, `semantic-search.mjs`                                                | Multi-namespace keyword search; Chroma still optional                                                                                |
| Operator records                | `operator/memory/task-history.mjs`, `workflow-memory.mjs`                                              | `github_summaries`, `report_refs`, `browser_sessions` JSONL                                                                          |
| AWS read-only CLI               | `operator/integrations/aws/*.mjs`                                                                      | STS / ECS / ECR / Logs / Secrets list scaffolds; [README](../integrations/aws/README.md)                                             |
| InterSystems rollup             | `operator/intersystems/runtime-health.mjs`                                                             | Portal + FHIR metadata ping + HL7 stubs                                                                                              |
| GitHub snapshot                 | `operator/workflows/github/operator-snapshot.mjs`                                                      | Issues, PRs, combined status, Actions runs, Dependabot (scope-aware), optional memory append (`GITHUB_SNAPSHOT_MEMORY=0` to disable) |
| Sasha routing metadata          | `operator/sasha/provider-routing.mjs`                                                                  | Wraps router + registry; `runtime-health` includes `routing`                                                                         |
| Dashboard                       | `operator/dashboard/`                                                                                  | Standalone **npm** + Vite build; [README](../dashboard/README.md)                                                                    |
| Vendor health + Playwright hint | `operator/integrations/{zoho,linkedin,canva}/health.mjs`, `browser-automation/public-page-snippet.mjs` | `OPERATOR_INTEGRATION_PLAYWRIGHT=1` only                                                                                             |

## Thermal / execution rules

- Scripts use **sequential** `await` chains; avoid parallel provider or Ollama calls.
- Playwright: one browser per script; always `finally` close (see `runtime-check.mjs`, `operator-snapshot.mjs`, `public-page-snippet.mjs`).

## Bundled plugin

- `operator-stack`: tools `operator_stack_read`, `operator_stack_models`, `github_rate_limit` (`docs/plugins/operator-stack.md`).
