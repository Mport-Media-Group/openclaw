# Memory strategy

## Default: OpenClaw workspace memory

Use the built-in Markdown memory model first:

- **`MEMORY.md`** — durable facts and preferences
- **`memory/YYYY-MM-DD.md`** — daily notes, indexed for search tools

Each agent workspace (for example `~/.openclaw/workspace-dcb`) owns its own files.
See [Memory overview](https://docs.openclaw.ai/concepts/memory) and the CLI
[memory](https://docs.openclaw.ai/cli/memory) reference.

## Optional: vector plugins

Before running a separate Chroma sidecar, evaluate bundled memory plugins
(LanceDB, wiki, core) under `docs/plugins/memory-*.md` in this repo.

## Optional: Chroma sidecar

If you need Chroma, run it as a **small FastAPI sidecar** under
`operator/python-sidecars/` (venv gitignored) and expose it only to tools you
trust—never as an unauthenticated wide-open service on the laptop.
