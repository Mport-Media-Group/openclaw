# Security and execution gates

## Secrets

- Store channel and provider secrets under `~/.openclaw/credentials/` per OpenClaw conventions.
- Model auth profiles live under `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
- Never commit `.env` files; use `operator/env/*.example.*` only as templates.

## Approval tiers (operator convention)

Map human intent to tool exposure in **gateway and agent config**, not only in JSON:

| Tier           | Typical use                | Tooling                                  |
| -------------- | -------------------------- | ---------------------------------------- |
| **SAFE**       | Read-only, drafts          | Docs, rate limits, operator file reads   |
| **ELEVATED**   | CRM/email, PRs with review | OAuth-backed APIs with user confirmation |
| **ADMIN**      | Infra, IRIS, secrets       | Narrow allowlists, break-glass only      |
| **AUTONOMOUS** | Unattended loops           | Avoid on constrained laptops by default  |

`operator/agents/registry.json` includes a `defaultApproval` hint for runbooks;
OpenClaw enforcement comes from **which tools are enabled** per agent and your
operational process.

## Shell and browser automation

- Log operator actions under `operator/logs/` (gitignored).
- Prefer remote isolation (Testbox/Crabbox) for heavy or broad shell suites per repo `AGENTS.md`.
- LinkedIn and similar browser flows should stay **human-in-the-loop** unless legal and ToS review says otherwise.

## Reference config

See [configs/tool-policy.example.json](../configs/tool-policy.example.json) for a machine-readable sketch you can adapt into `openclaw.json` and internal runbooks.
