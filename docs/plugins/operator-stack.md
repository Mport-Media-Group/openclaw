---
summary: "Bundled tools to read enterprise operator manifests and query GitHub API rate limits."
read_when:
  - You are configuring the operator-stack plugin or operator/ directory layout
title: "Operator stack plugin"
---

# Operator stack plugin

Bundled helper plugin for the **enterprise operator stack** layout: read UTF-8
files under a configured stack root (for example repo `operator/configs/` and
`operator/agents/`), validate `models.json`, and call GitHub `rate_limit` with an
optional PAT.

## Founder context (`operator/founder/`)

When `stackRoot` points at the repo `operator/` directory, agents can use
**`operator_stack_read`** with paths under **`founder/`**, for example:

- `founder/founder-profile.json`
- `founder/runtime-preferences.json`
- `founder/deployment-constraints.json`
- `founder/strategic-goals.json`
- `founder/engineering-principles.md`

These files are **operational identity** only: no secrets, no PHI. Consumption
patterns are documented in the repo `operator/docs/FOUNDER_CONTEXT.md`.

## Enable

In `openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "operator-stack": {
        "enabled": true,
        "config": {
          "stackRoot": "/absolute/path/to/openclaw/operator"
        }
      }
    }
  }
}
```

Alternatively set `OPENCLAW_OPERATOR_STACK_ROOT` to the absolute path of the
`operator/` directory. If neither is set, the plugin falls back to `./operator`
when `operator/configs/models.json` exists relative to the process current
working directory.

## Tools

- **`operator_stack_read`** — `relativePath` under the stack root (no `..`).
- **`operator_stack_models`** — parses and validates `configs/models.json`.
- **`github_rate_limit`** — `GET /rate_limit`; uses `GITHUB_TOKEN` or `GH_TOKEN` when set.

## Operator layout

See the repo `operator/README.md` for folder layout, host setup, and security
runbooks.

## Distribution

- Package: `@openclaw/operator-stack-plugin`
- Install route: included in OpenClaw

## Surface

plugin
