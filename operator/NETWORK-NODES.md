# Network PCs — Sasha manages machines via OpenClaw nodes

Sasha runs on the **gateway Mac** (Discord, models, cron). Other computers join as **nodes**: they connect to the gateway WebSocket and expose `system.run` / `system.which` (and optional browser/canvas on companions).

Docs: https://docs.openclaw.ai/nodes · https://docs.openclaw.ai/cli/node

## Architecture

```
[Discord / dashboard] → Gateway (this Mac, port 18789) → Sasha agent
                              ↓ exec host=node
                    Node host on PC #2, #3, … (paired + allowlisted)
```

- **One gateway** per home (your MacBook today).
- **Each PC** runs a node host (`openclaw node install` or macOS/iOS/Android companion).
- **You approve** each machine once: `openclaw devices approve <requestId>`.
- **Exec approvals** on each node control which commands can run (`~/.openclaw/exec-approvals.json` on that machine).

## Prerequisite: remote nodes must reach the gateway

Your gateway is **`gateway.bind=loopback`** — only this Mac can connect. Pick one route:

### Option A — Same Wi‑Fi (simplest at home)

On the **gateway Mac**:

```bash
# Gateway Mac LAN IP (current): 192.168.1.182
ipconfig getifaddr en0

openclaw config set gateway.bind lan
# If startup refuses Control UI, set origins for your LAN dashboard URL, e.g.:
# openclaw config set gateway.controlUi.allowedOrigins '["http://192.168.1.42:18789"]'
openclaw gateway restart
openclaw qr --json   # must NOT say "only bound to loopback"
```

Nodes use `<LAN-IP>:18789` and the gateway token (see below).

### Option B — Tailscale (works away from home)

Keep loopback; enable Tailscale Serve on the gateway. Nodes on the tailnet connect to the MagicDNS URL. See https://docs.openclaw.ai/gateway/tailscale

### Option C — SSH tunnel (no LAN bind change)

On each remote PC:

```bash
ssh -N -L 18790:127.0.0.1:18789 king@gateway-mac-hostname
export OPENCLAW_GATEWAY_TOKEN="<from ~/.openclaw/openclaw.json gateway.auth.token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Office-PC"
```

## Enroll a PC (Windows / Linux / macOS)

On **each machine** you want Sasha to control:

1. Install Node 22+ and OpenClaw CLI (`pnpm install && pnpm build && npm i -g .` from the repo, or a release package).
2. Set gateway token (never commit this):

   ```bash
   export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
   ```

3. Install and start the node service:

   ```bash
   openclaw node install --host <gateway-ip-or-tunnel> --port 18789 --display-name "Kitchen-PC"
   openclaw node start
   ```

4. On the **gateway Mac**, approve pairing:

   ```bash
   openclaw devices list
   openclaw devices approve <requestId>
   openclaw nodes status
   openclaw nodes rename --node <id> --name "Kitchen-PC"
   ```

5. Allow safe commands (expand per machine as needed):

   ```bash
   openclaw approvals allowlist add --node "Kitchen-PC" "/usr/bin/uname"
   openclaw approvals allowlist add --node "Kitchen-PC" "/bin/hostname"
   # Windows nodes use Windows paths in allowlist — see exec-approvals docs
   ```

## Point Sasha at nodes

Default exec stays on the gateway unless you configure node routing.

**Per session (Discord or dashboard):**

```
/exec host=node security=allowlist node=<node-id-or-name>
```

**Default for Sasha (gateway config):**

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
# Optional default node when only one remote PC:
openclaw config set agents.list[0].tools.exec.node "Kitchen-PC"
openclaw gateway restart
```

**List / invoke without shell:**

```bash
openclaw nodes status
openclaw nodes describe --node <name>
openclaw nodes invoke --node <name> --command system.which --params '{"bins":["git"]}'
```

## This Mac as a node too

The gateway Mac can also run a local node host (browser automation, local `system.run`):

```bash
export OPENCLAW_GATEWAY_TOKEN="<token>"
openclaw node install --host 127.0.0.1 --port 18789 --display-name "MacBook-Gateway"
openclaw node start
openclaw devices list   # approve if prompted
```

Or use the **macOS OpenClaw app** in node mode (canvas/camera/screen) — see https://docs.openclaw.ai/nodes

## Security

- Token auth is required for non-loopback binds.
- Rotate the gateway token if it was ever pasted in chat or Notes.
- Prefer **allowlist** exec on nodes; avoid `security=full` on shared machines.
- Each PC keeps its own `exec-approvals.json` — approvals do not automatically cross machines.

## Enroll script (remote PCs)

On each **non-gateway** machine, copy `operator/enroll-remote-pc.sh` and run:

```bash
export OPENCLAW_GATEWAY_TOKEN="<from gateway ~/.openclaw/.env>"
./enroll-remote-pc.sh "Office-PC"
```

Then approve on the gateway Mac (`openclaw devices approve …`).

## This gateway (already done)

- `gateway.bind=lan` — listening on `*:18789`
- Dashboard: http://192.168.1.182:18789/
- Node host service: `MacBook-Gateway` (LaunchAgent `ai.openclaw.node`, running)
- `OPENCLAW_GATEWAY_TOKEN` added to `~/.openclaw/.env` for node installs

## Verify

```bash
openclaw nodes status          # paired + connected
openclaw channels status --probe
openclaw agent --agent sasha --message "Run hostname on node Kitchen-PC" --json
```

## Troubleshooting

| Symptom                             | Fix                                                                |
| ----------------------------------- | ------------------------------------------------------------------ |
| `Gateway is only bound to loopback` | Use Option A/B/C above                                             |
| Pending device forever              | `openclaw devices list` → approve latest `requestId`               |
| `incomplete_result` / empty reply   | Wrong model — unrelated to nodes                                   |
| Exec denied                         | Add allowlist on **that node**; check `host=node` and `node=` name |
