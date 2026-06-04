# operator/integrations/google

Sasha's Gmail + Google Calendar integration (PorterOS Phase 3.7 — Founder Executive Assistant).

**Authoritative scope doc:** `~/.openclaw/workspace-sasha/GOOGLE_INTEGRATION_v0.md`.

## What's here (v0 scaffold)

| File             | Purpose                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| `scopes.json`    | Declared OAuth scopes per use case (v0 + explicitly excluded)                                            |
| `health.mjs`     | Readiness probe — never prints credential values                                                         |
| `discover.mjs`   | King's prerequisite checklist + current-state print                                                      |
| `oauth-flow.mjs` | One-time installed-app OAuth dance (browser → local redirect → token exchange → refresh-token file)      |
| `apply.mjs`      | Smoke tests — fetch access token, read latest Gmail subject (metadata only), list next 3 calendar events |

Zero npm deps. Node 22 built-ins only (`fetch`, `node:http`, `node:crypto`, `node:fs`, `node:child_process`).

## Activation (King's path)

1. **Check current state:**
   ```bash
   node operator/integrations/google/health.mjs
   ```
2. **If OAuth client JSON missing, run the discover script for the full checklist:**
   ```bash
   node operator/integrations/google/discover.mjs
   ```
3. **Once `~/.openclaw/credentials/google-oauth-client.json` is in place, run the OAuth flow once:**
   ```bash
   node operator/integrations/google/oauth-flow.mjs
   ```
4. **Verify with smoke tests:**
   ```bash
   node operator/integrations/google/apply.mjs
   ```

## Governance

- **`emails`** approval class required for any Gmail send. v0 does NOT request `gmail.send` scope — drafts only.
- **`emails`** + per-event approval for calendar mutations on existing events. Tentative new events are OK.
- **No PHI / patient identifiers** in any logs.
- **No printing of access_token, refresh_token, or email bodies.** Subject + From only in `apply.mjs`.

## Storage

- OAuth client JSON: `~/.openclaw/credentials/google-oauth-client.json` (mode 600)
- Refresh token: `~/.openclaw/credentials/google-refresh-token.json` (mode 600)
- Both files migrate to OpenClaw Keyring (`google-oauth-client`, `google-refresh-token`) once Wedge 1.2 ships.

## Related

- `~/.openclaw/workspace-sasha/GOOGLE_INTEGRATION_v0.md` — full scope, governance, v0→v1 path
- `~/.openclaw/workspace-sasha/PORTEROS_TASKLIST.md` — Phase 3.7 source
- `~/.openclaw/workspace-sasha/AGENT_DELEGATION.md` — execution tier guidance
- `~/.openclaw/workspace-sasha/HEARTBEAT.md` — standing approval gates
