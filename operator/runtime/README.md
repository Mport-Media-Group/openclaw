# Operator runtime (local)

This folder holds **operator-side** hints and diagnostics only. OpenClaw’s
**authoritative** model and provider routing lives in `openclaw.json` and
bundled provider plugins—nothing here overrides the gateway.

- [provider-router.mjs](provider-router.mjs) — local-first execution **plan**
  (ordered steps, timeouts, token budget hints, retry constants). Callers must
  run providers **sequentially** (`SEQUENTIAL_EXECUTION_POLICY`); no
  `Promise.all` for multi-provider calls.
- [provider-health.mjs](provider-health.mjs) — env set/unset map + Ollama
  `/api/tags` ping. Optional live probes when **`OPERATOR_PROVIDER_PROBE=1`**
  (OpenAI + HF minimal GET; response bodies are never logged).
- [ollama-health.mjs](ollama-health.mjs) — sequential tag check + one tiny
  generate per minimal model (shared with `operator/scripts/test-local-models.mjs`).

Gateway configuration: [https://docs.openclaw.ai/gateway/configuration](https://docs.openclaw.ai/gateway/configuration)
