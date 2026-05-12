# Multi-agent mapping (Sasha, DCB, …)

OpenClaw’s first-class multi-agent surface is the **`openclaw agents`** CLI and
per-agent workspaces under `~/.openclaw/`. Treat [operator/agents/registry.json](../agents/registry.json) as **operator metadata** (roles, suggested approval tier, naming); wire routing with bindings.

## Create agents and workspaces

From the OpenClaw repo (or any shell with `openclaw` on `PATH`):

```bash
openclaw agents add sasha --workspace ~/.openclaw/workspace-sasha
openclaw agents add dcb --workspace ~/.openclaw/workspace-dcb
openclaw agents add devops --workspace ~/.openclaw/workspace-devops
openclaw agents add git --workspace ~/.openclaw/workspace-git
```

Add more names from the registry as needed (`linkedin`, `canva`, `zoho`, `iris`, `research`).

## Channel bindings

Pin inbound traffic to an agent (example):

```bash
openclaw agents bind --agent dcb --bind telegram:ops
openclaw agents bindings --json
```

See the canonical CLI reference: [docs/cli/agents.md](../../docs/cli/agents.md) (published: [Agents](https://docs.openclaw.ai/cli/agents)).

## Skills per agent

Use `agents.defaults.skills` and `agents.list[].skills` in `openclaw.json` when agents need different skill visibility (see [Skills config](https://docs.openclaw.ai/tools/skills-config)).
