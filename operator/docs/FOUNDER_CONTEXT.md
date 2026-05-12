# Founder operational identity layer

The `operator/founder/` directory holds **modular, non-secret, non-PHI** context:
identity, engineering principles, runtime preferences, deployment constraints,
and strategic goals. It is **operational metadata**, not a substitute for
clinical systems or patient records.

## For OpenClaw agents

Enable the **`operator-stack`** plugin and set `stackRoot` to this repo’s
`operator/` directory (see [Operator stack plugin](../../docs/plugins/operator-stack.md) and [https://docs.openclaw.ai/](https://docs.openclaw.ai/) for published docs).

Use the **`operator_stack_read`** tool with `relativePath` pointing at founder files, for example:

- `founder/founder-profile.json`
- `founder/runtime-preferences.json`
- `founder/deployment-constraints.json`
- `founder/strategic-goals.json`
- `founder/engineering-principles.md`
- `founder/architecture-philosophy.md`
- `founder/communication-style.md`

The gateway does **not** auto-inject these files into every turn; agents (or
system prompts you configure) should pull them when planning, architecture, or
governance context is needed.

## For operator scripts (Sasha)

- Loader: `operator/founder/load-founder-context.mjs` (`loadFounderContextSync`, `getFounderContextSummary`).
- Validation: `node operator/founder/founder-health.mjs`
- Sasha runtime health and emitted runtime plan include a **bounded** `founder` summary.

## Rules

- **No PHI**, no customer identifiers, no credentials in founder files.
- Keep content **high-level**; environment-specific values belong in secure config.

See also [../founder/README.md](../founder/README.md).
