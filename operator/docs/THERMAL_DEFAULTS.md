# Thermal and RAM defaults (Intel 8GB)

- **Ollama**: `OLLAMA_NUM_PARALLEL=1`, `OLLAMA_MAX_LOADED_MODELS=1`.
- **pnpm test**: run one filter at a time; avoid parallel Vitest shards on this machine (`OPENCLAW_VITEST_MAX_WORKERS=1` per repo `AGENTS.md`).
- **Gateway**: avoid long-running Docker Desktop stacks locally; prefer cloud runners for broad suites.
- **Plugins**: enable only channels you use; lazy-load by keeping unused `plugins.entries.*.enabled` false.
- **Node**: use **22.16+** so `openclaw doctor` and builds match `engines` in root `package.json`.
