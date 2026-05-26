# Enterprise operator stack (local)

This directory holds **operator metadata and docs** for a constrained MacBook
console: model routing JSON, agent role registry, runbooks, and optional Python
sidecars. It is **not** the OpenClaw TypeScript runtime; keep heavy Python venvs
under `python-sidecars/` (gitignored) or a sibling directory outside the repo.

See [docs/HOST_SETUP.md](docs/HOST_SETUP.md) for machine prep, [docs/LOCAL_VERIFY.md](docs/LOCAL_VERIFY.md) for `pnpm install` / doctor / tests, and [docs/WAVE_ROADMAP.md](docs/WAVE_ROADMAP.md) for phased delivery.

**Founder operational identity** (non-secret context for agents and Sasha): [founder/README.md](founder/README.md), [docs/FOUNDER_CONTEXT.md](docs/FOUNDER_CONTEXT.md); validate with `node operator/founder/founder-health.mjs`.

**Validation**: `node operator/scripts/run-e2e-validation.mjs` (writes `reports/validation-run.log` and `reports/last-validation.json`). Operator reports: [reports/FINAL_STATUS.md](reports/FINAL_STATUS.md) and siblings in `reports/`.

**OpenClaw CLI readiness** (run from the parent OpenClaw git repo root): `pnpm claw:max-readiness` runs `openclaw doctor` and `openclaw skills check` for the default agent and each agent in `openclaw agents list --json`. Use `--skip-doctor` on the underlying script if you only need skills checks.

**CLI tools without Homebrew** (macOS): `pnpm claw:install-cli-prereqs` installs `gh`, `jq`, `rg`, and on Intel a static `ffmpeg` into `~/.local/bin` (or `OPENCLAW_LOCAL_BIN`); prepend that directory to `PATH` for the gateway and your shell. With Homebrew present, it runs `brew install gh ffmpeg jq ripgrep` instead.

**Scripts (operator-local ESM)**:

- `node operator/browser-automation/runtime-check.mjs` — Playwright Chromium smoke + screenshot under `reports/` (gitignored).
- `node operator/scripts/test-local-models.mjs` — sequential Ollama `/api/tags` + tiny generates (advisory; needs `ollama serve`).
- `node operator/runtime/provider-health.mjs` — env presence + Ollama ping; optional `OPERATOR_PROVIDER_PROBE=1` for minimal OpenAI/HF reachability (no response bodies logged).
- `node operator/workflows/github/operator-snapshot.mjs` — read-only GitHub issue summary → `reports/github-operator-report.md` (gitignored).
- `node operator/memory/memory-health.mjs` / `node operator/sasha/runtime-health.mjs` — JSON health snapshots under `reports/` (gitignored).
- `node operator/executive/runtime-health.mjs` — Executive OS readiness snapshot for GitHub/Cursor, 1Password, Supabase, browser profiles, and staged DCB signals → `reports/executive-runtime-health.json` (gitignored).
- `node operator/sasha/emit-runtime-plan.mjs` — writes delegation graph JSON from `agents/registry.json`.
- `node operator/sasha/approval-engine.mjs <script>` — tier gate for operator scripts (exit **2** when blocked).
- `node operator/runtime/ollama-health.mjs` — full Ollama tag + generate check → `reports/ollama-health-out.json` (gitignored).
- `node operator/intersystems/runtime-health.mjs` — IRIS / FHIR / HL7 scaffold rollup.
- `operator/dashboard/` — standalone Vite + React status panels ([dashboard/README.md](dashboard/README.md)).
- `node operator/founder/founder-health.mjs` — validates founder JSON/Markdown pack → `reports/founder-health-out.json` (gitignored).

Enable the bundled `operator-stack` plugin and point it at this directory via
`plugins.entries["operator-stack"].config.stackRoot` or
`OPENCLAW_OPERATOR_STACK_ROOT` (absolute path to this `operator/` folder).
