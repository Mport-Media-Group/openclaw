# Founder operational identity layer

This directory holds **non-secret, non-PHI** operational context so OpenClaw agents
and operator-local tooling (Sasha) share a consistent view of founder identity,
engineering philosophy, infrastructure preferences, and strategic hierarchy.

## Rules

- **No PHI**, no customer identifiers, no credentials, no API keys in these files.
- Prefer **high-level** statements; project IDs and env-specific values live in
  vaults and `openclaw.json`, not here.

## Loading (operator scripts)

- `import { getFounderContextSummary, loadFounderContextSync } from "./load-founder-context.mjs"`
- Validation: `node operator/founder/founder-health.mjs`

## OpenClaw agents (`operator-stack` plugin)

With `plugins.entries["operator-stack"].config.stackRoot` pointing at this
`operator/` tree, use **`operator_stack_read`** with paths such as:

- `founder/founder-profile.json`
- `founder/runtime-preferences.json`
- `founder/deployment-constraints.json`
- `founder/strategic-goals.json`
- `founder/engineering-principles.md`

See [../docs/FOUNDER_CONTEXT.md](../docs/FOUNDER_CONTEXT.md) for the full consumption guide.
