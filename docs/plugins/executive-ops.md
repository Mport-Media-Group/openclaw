---
summary: "executive-ops: cloud-first executive control-plane contracts for GitHub, Cursor ACP, governance, vault, memory, and later browser/DCB stages"
read_when:
  - You are configuring the bundled executive-ops plugin
  - You want the executive control plane status surface in the Control UI
  - You are wiring GitHub and Cursor as the first executive milestone
title: "Executive ops plugin"
---

# Executive ops plugin

`executive-ops` is a bundled plugin that turns OpenClaw into a lightweight
executive control plane for a constrained local machine.

It does **not** try to host heavy local models or replace core orchestration.
Instead it adds:

- executive control-plane config contracts
- read-only status surfaces for Control UI and operator workflows
- GitHub executive snapshots
- deterministic repo-plan drafting for GitHub/Cursor/dashboard/memory/governance work
- governance defaults for approval classes and role-scoped integrations
- vault and Supabase memory contracts without storing secrets in git

## Design goals

- Keep the Mac as an orchestration node, not a compute server.
- Reuse existing OpenClaw seams such as task flows, ACP sessions, cron, Control UI, and the browser plugin.
- Separate read-only monitoring from approval-gated mutations.
- Keep later browser, Canva, and DCB modules staged behind explicit config and governance.

## First milestone

The initial milestone focuses on GitHub + Cursor:

- `executive_github_snapshot`
- `executive_repo_plan`
- `executive_status`
- `executive.status` Gateway method for Control UI
- `executive.githubSnapshot` Gateway method for operator-grade read-only GitHub summaries

Use the existing ACP path for Cursor execution itself. `executive-ops` reports
whether the `acpx` backend and Cursor harness are ready, but it does not replace
the native ACP runtime.

## Config

Put config under `plugins.entries["executive-ops"].config`:

```json
{
  "plugins": {
    "entries": {
      "executive-ops": {
        "enabled": true,
        "config": {
          "identity": {
            "organizationLabel": "DCB",
            "workspaceLabel": "Executive OS"
          },
          "controller": {
            "controllerId": "exec-main",
            "ownerSessionKey": "main",
            "taskFlowOwner": "main",
            "autoCreateManagedFlow": true,
            "wakeupCronTag": "executive-heartbeat"
          },
          "github": {
            "repository": "openclaw/openclaw",
            "watchPullRequests": true,
            "watchReviews": true
          },
          "cursor": {
            "runtime": "acp",
            "harnessId": "cursor",
            "cwd": "/absolute/path/to/worktree"
          },
          "vault": {
            "provider": "1password",
            "account": "my.1password.com",
            "vault": "OpenClaw",
            "githubItem": "GitHub executive token"
          },
          "memory": {
            "provider": "supabase",
            "projectUrlEnvVar": "SUPABASE_URL",
            "serviceRoleEnvVar": "SUPABASE_SERVICE_ROLE_KEY",
            "schemaName": "executive_ops",
            "tableName": "executive_memory"
          }
        }
      }
    }
  }
}
```

Keep actual credentials in environment variables or 1Password, not in this repo.

## Control UI

When the plugin is enabled, the Control UI overview loads `executive.status` and
renders an Executive OS card with:

- GitHub repo/token readiness
- Cursor ACP readiness
- 1Password CLI readiness
- Supabase memory readiness
- managed-flow controller state
- governance role and approval summaries

## Tools

- `executive_status` - executive readiness, controller ownership, governance, vault, memory, and staged surfaces
- `executive_github_snapshot` - read-only repo summary with issues, pull requests, and recent workflows
- `executive_repo_plan` - deterministic checklist for GitHub, Cursor, dashboard, memory, governance, browser, DCB, or broad executive milestones

## Related docs

- [ACP agents](/tools/acp-agents)
- [Operator stack plugin](/plugins/operator-stack)
- [Browser plugin](/plugins/reference/browser)
