# Run OpenClaw without Cursor

Use this when you want Sasha (Discord, etc.) without the IDE agent.

## Quick start (one command)

```bash
cd ~/openclaw
./operator/run-standalone.sh
```

That builds if needed, installs the global `openclaw` CLI, installs the macOS gateway service, restarts it, probes Discord, and opens the dashboard in your browser.

## One-time setup

### 1. CLI on your PATH

From the OpenClaw repo (after `pnpm install` and `pnpm build`):

```bash
cd ~/openclaw
npm install -g .
openclaw --version
```

Or add to `~/.zshrc` (no global install):

```bash
export OPENCLAW_REPO="$HOME/openclaw"
alias openclaw='node "$OPENCLAW_REPO/openclaw.mjs"'
```

Reload: `source ~/.zshrc`

### 2. Secrets and config

- Config: `~/.openclaw/openclaw.json`
- Secrets: `~/.openclaw/.env` (`ELEVENLABS_API_KEY`, `DISCORD_BOT_TOKEN`, `ANTHROPIC_API_KEY`, etc.)
- Agent workspace: `~/.openclaw/workspace-sasha`

### 3. Background gateway (macOS LaunchAgent)

```bash
cd ~/openclaw
openclaw gateway install
openclaw gateway restart
openclaw gateway status
```

Expect: **Service loaded**, **Listening: 127.0.0.1:18789**, Discord/WhatsApp channels connected in `openclaw channels status --probe`.

Logs: `/tmp/openclaw/openclaw-gateway.log` or `openclaw logs --follow`

## Daily use (no Cursor)

| Task                        | Command                                                                        |
| --------------------------- | ------------------------------------------------------------------------------ |
| Is gateway up?              | `openclaw gateway status`                                                      |
| Dashboard                   | Open http://127.0.0.1:18789/                                                   |
| Channel health              | `openclaw channels status --probe`                                             |
| Approve Discord DM          | `openclaw pairing list discord` then `openclaw pairing approve discord <CODE>` |
| Voice on Discord            | Send a **voice message** to @Sasha, or `/tts audio …`                          |
| Restart after config change | `openclaw gateway restart`                                                     |
| Stop gateway                | `openclaw gateway stop`                                                        |
| Start gateway               | `openclaw gateway start`                                                       |
| Fix config drift            | `openclaw doctor --fix`                                                        |

Talk to Sasha on **Discord** (@Sasha) once the probe shows connected — no Cursor required.

## Control other PCs on your network

See **[NETWORK-NODES.md](./NETWORK-NODES.md)** — pair each machine as an OpenClaw node, approve devices, then `/exec host=node` so Sasha runs commands there.

## AgentEcos GCP

See **[AGENTECOS-GCP.md](./AGENTECOS-GCP.md)** — project `bridgeview-vwsdz`; run `gcloud auth login` once, then Sasha can probe Cloud Run / Firebase via `agentecos-gcp` skill.

## ChatGPT history for Sasha

See **[CHATGPT-ARCHIVE.md](./CHATGPT-ARCHIVE.md)** — export from ChatGPT, then `import-chatgpt-export.sh`; Sasha searches via `wiki_search`.

## Dev mode (optional)

While hacking the repo:

```bash
cd ~/openclaw
pnpm gateway:watch
```

Stop the LaunchAgent first if port 18789 conflicts: `openclaw gateway stop`

## Troubleshooting

- **Port in use:** `openclaw gateway status` — kill stray `gateway run` or use `openclaw gateway install --force`
- **Discord token:** must be in `~/.openclaw/.env` as `DISCORD_BOT_TOKEN=...` and referenced in config
- **Discord shows typing but no reply:** run `openclaw models status`. Common causes: Claude Code **session limit** (wait for reset), or Anthropic API **billing** (add credits or use `claude-cli` via `claude auth login` on the gateway host). Check `openclaw logs --follow` while sending a test DM.
- **Voice optional:** `messages.tts.auto` is `inbound` (voice when you send voice); use `/tts audio …` anytime.

Docs: https://docs.openclaw.ai/gateway
