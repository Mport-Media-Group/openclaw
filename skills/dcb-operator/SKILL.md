---
name: dcb-operator
description: Discharge Bridge (DCB) executive workflows — product context, governance, executive-ops tools, Sasha orchestration, and operator stack reads. Use for DCB milestones, hospital-to-post-acute coordination, AgentEcos, and Michigan-first GTM work.
metadata: { "openclaw": { "emoji": "🏥" } }
---

# DCB operator

Use this skill when the user mentions **Discharge Bridge**, **DCB**, **AgentEcos**, hospital/post-acute coordination, investor-grade architecture, or executive control-plane work scoped to DCB.

## Product context (non-PHI)

- **Discharge Bridge**: healthcare orchestration layer (hospital → post-acute), interoperability-first.
- **AgentEcos**: multi-agent governance and runtime alignment.
- **Sasha**: meta-intelligence / operator control plane (orchestration metadata, not a second gateway).
- **GTM**: Michigan-first regional depth before national scale.
- **Never** store or echo PHI, customer identifiers, or credentials in operator repos, skills, or chat logs.

Founder/strategic hierarchy (read-only): `operator_stack_read` → `founder/strategic-goals.json`, `founder/founder-profile.json`.

## Agents and workspaces

Operator registry: `operator/agents/registry.json` — DCB role is `dcb_operator` → OpenClaw agent name **`dcb`**, workspace **`~/.openclaw/workspace-dcb`**.

If `dcb` is not provisioned yet:

```bash
openclaw agents add dcb --workspace ~/.openclaw/workspace-dcb
openclaw agents bind --agent dcb --bind <channel>:<account>   # when routing is ready
```

Default executive agent is **`sasha`**; route DCB-specific long-running work to **`dcb`** when bindings exist.

## Executive-ops (bundled plugin)

Config lives under `plugins.entries["executive-ops"].config` in `openclaw.json`. DCB block:

- `dcb.enabled`, `gcpProjectId`, `firebaseProjectId`, `firestoreDatabase`, `cloudRunServices[]`
- `investorMonitoringEnabled`, `complianceMonitoringEnabled` (off until explicitly enabled)

**Tools** (require `executive-ops` enabled):

| Tool                        | Use for DCB                                                   |
| --------------------------- | ------------------------------------------------------------- |
| `executive_status`          | Readiness: DCB surface, governance, vault, memory             |
| `executive_repo_plan`       | `surface: "dcb"` — deterministic checklist for DCB milestones |
| `executive_github_snapshot` | Repo/issue/PR watch (read-only)                               |
| `executive_speak`           | TTS; agent voice `female` / `agent`, operator `male`          |

**Approval classes** for `surface: "dcb"`: `deploymentPushes`, `legalDocs`. Treat investor messaging and public posts as human-approved even when drafting.

**Repo plan themes** (from executive-ops): scope GCP/Firebase/Cloud Run/investor/compliance as plugin-owned modules; governance-first; **health/reporting probes before mutating deploys**.

## Operator stack (read-only files)

With `operator-stack` plugin and `stackRoot` → repo `operator/`:

- `operator_stack_read` paths: `docs/MULTI_AGENT.md`, `docs/FOUNDER_CONTEXT.md`, `agents/registry.json`, `founder/*`, `reports/SYSTEM_TOPOLOGY.md`
- Local JSON health (from repo root): `node operator/executive/runtime-health.mjs` → `operator/reports/executive-runtime-health.json` (gitignored)
- Sasha: `node operator/sasha/runtime-health.mjs`, `node operator/sasha/emit-runtime-plan.mjs`

## Workflow

1. **Clarify** goal (monitoring vs plan vs mutation). Default to read-only.
2. **`executive_status`** or runtime-health for current DCB/GCP signals.
3. **`executive_repo_plan`** with `surface: "dcb"` and a short `goal` for structured next steps.
4. **Mutations** (deploy, legal, investor sends): state approval class, get explicit human approval, then execute via the right plugin/CLI — never bypass governance.
5. **Proof**: command output summaries, no secrets; link GitHub/Cloud console paths when available.

## Related skills

- `dcb-cloud-health` — GCP/Firebase/Cloud Run env and probes
- `dcb-governance` — PHI, approvals, compliance/investor flags
- `taskflow` — durable multi-step DCB jobs with owner context
- `github` — repo operations when DCB code lives on GitHub

## Docs

- `docs/plugins/executive-ops.md`
- `operator/docs/MULTI_AGENT.md`
- `operator/founder/README.md`
