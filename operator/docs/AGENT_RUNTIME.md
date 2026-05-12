# Agent runtime (Sasha, DCB, …)

OpenClaw does not use a separate in-repo process supervisor for named agents. Use:

- **`openclaw agents`** for workspaces, identities, and channel bindings (see [docs/cli/agents.md](../../docs/cli/agents.md)).
- **`operator/agents/registry.json`** as operator metadata (approval tier hints, suggested workspace paths).
- **Gateway tool policy** and per-agent `tools` config for enforcement (see repo docs on per-sender tool policies).

Spawning, delegation, and logging are owned by the gateway and channel plugins; extend behavior via new **SDK plugins** rather than patching core.
