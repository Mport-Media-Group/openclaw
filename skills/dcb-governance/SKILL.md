---
name: dcb-governance
description: Governance, PHI safety, and approval gates for Discharge Bridge and executive-ops work — investor messaging, compliance monitors, legal docs, and deployment pushes.
metadata: { "openclaw": { "emoji": "🛡️" } }
---

# DCB governance

Use for **policy, approvals, audit, and compliance** on Discharge Bridge work — especially before writes, deploys, outbound investor/legal content, or enabling monitors.

## Non-negotiables

- **No PHI** and no customer/patient identifiers in operator repos, skills, prompts, or committed artifacts.
- **No secrets in git** — credentials in 1Password / `~/.openclaw/.env` / channel cred dirs only.
- **Human approval** for: deployment pushes, legal documents, investor-facing messaging, public posts (even drafts routed through browser/LinkedIn flows).

## Executive-ops approval classes

Configured under `plugins.entries["executive-ops"].config.governance.approvalClasses`.

| Class                           | DCB relevance                              |
| ------------------------------- | ------------------------------------------ |
| `deploymentPushes`              | Cloud Run, Firebase rules, infra IaC       |
| `legalDocs`                     | Contracts, compliance filings, policy docs |
| `investorMessaging`             | Updates, decks sent externally             |
| `publicPosts`                   | Marketing/social (often drafts-only)       |
| `credentialChanges`             | Keys, vault items, auth profiles           |
| `githubWrites` / `cursorWrites` | Code and automation mutations              |

`executive_repo_plan` with `surface: "dcb"` attaches **`deploymentPushes`** and **`legalDocs`** to the plan metadata.

## DCB monitor flags

In `config.dcb`:

- `investorMonitoringEnabled` — keep **false** until founder enables automated investor signals.
- `complianceMonitoringEnabled` — keep **false** until compliance workflow is defined.

Enabling either requires explicit user request and a documented audit trail.

## Sasha and operator scripts

Operator script tiers: `node operator/sasha/approval-engine.mjs <scriptPath>` — exit **2** means blocked.

- **SAFE**: read-only health, emit-runtime-plan
- **ELEVATED** / **ADMIN**: per `operator/agents/registry.json` defaultApproval

DCB agent registry entry: `dcb_operator` → **ELEVATED** default. Do not downgrade gates to speed up work.

## Audit mode

`governance.auditMode: "append_only"` in executive-ops config — prefer additive logs and reports under `operator/reports/` (gitignored) over silent state changes.

## Response pattern

1. State which approval classes apply.
2. Propose read-only verification first (`dcb-cloud-health`, `executive_status`).
3. Ask for explicit approval with a one-line summary of blast radius.
4. After action, record what ran (commands/tools), not secrets.

## Related

- `dcb-operator` — milestones and tools
- `operator/docs/FOUNDER_CONTEXT.md` — founder identity consumption
- `docs/plugins/executive-ops.md` — full plugin contract
