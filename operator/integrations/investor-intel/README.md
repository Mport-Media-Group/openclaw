# operator/integrations/investor-intel

OpenClaw integration for Investor Intelligence v0 — watchlist + dossier engine for the DCB ecosystem (PorterOS Phase 3.8).

**Authoritative scope doc:** `~/.openclaw/workspace-sasha/INVESTOR_INTELLIGENCE_v0.md`.

## What's here (v0 scaffolding)

| File                  | Purpose                                               |
| --------------------- | ----------------------------------------------------- |
| `targets.json`        | Watchlist data — 9 initial targets per King's roadmap |
| `health.mjs`          | Read-only readiness probe (run anytime)               |
| `dossier-template.md` | Canonical per-target dossier shape                    |
| `dossiers/`           | One markdown file per target (created on first fetch) |
| `digests/`            | Weekly compiled digests                               |

## v0.1 added (2026-05-29)

| File                      | Purpose                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch.mjs`               | Daily Google News RSS sweep per target — appends new signals to `dossiers/<slug>.md`, prunes past 30 days, classifies material events |
| `digest.mjs`              | Weekly compile — extracts last-7-day signals from all dossiers into `digests/YYYY-WW.md`, surfaces material events at top             |
| `lib/rss.mjs`             | Minimal RSS 2.0 item extractor (zero-dep)                                                                                             |
| `lib/material-events.mjs` | Heuristic classifier — categories: `M&A`, `funding`, `executive_move`, `partnership`, `regulatory`                                    |
| `lib/dossier.mjs`         | Read/merge/prune signals section in markdown dossiers                                                                                 |
| `material-events.jsonl`   | Append-only log of classified events (created on first sweep with a hit)                                                              |

## Cron registration (2026-05-29)

Two macOS LaunchAgents installed:

| Job           | Plist                                                             | Schedule (local time) |
| ------------- | ----------------------------------------------------------------- | --------------------- |
| Daily fetch   | `~/Library/LaunchAgents/com.openclaw.investor-intel-fetch.plist`  | every day at 07:00    |
| Weekly digest | `~/Library/LaunchAgents/com.openclaw.investor-intel-digest.plist` | every Monday at 08:00 |

Log paths: `~/.openclaw/logs/investor-intel-{fetch,digest}.{out,err}.log`.

Manage with `launchctl bootout|bootstrap gui/$(id -u)/com.openclaw.investor-intel-<job>`.

## Running

```bash
# Health probe (current)
node operator/integrations/investor-intel/health.mjs

# Daily fetch (when built)
node operator/integrations/investor-intel/fetch.mjs

# Weekly digest (when built)
node operator/integrations/investor-intel/digest.mjs
```

## Governance

- **`investorMessaging`** approval required for any drafted outreach.
- **`publicPosts`** approval required for any DCB content that references a watched target by name.
- **No PHI.** Public-source data only. `health.mjs` includes a PHI sniff against dossiers.
- **No auto-DM, ever.** Drafts surface to King via the content/messaging tools that have their own gates.

## Related

- `~/.openclaw/workspace-sasha/INVESTOR_INTELLIGENCE_v0.md` — full scope
- `~/.openclaw/workspace-sasha/PORTEROS_TASKLIST.md` — Phase 3.8 source
- `~/.openclaw/workspace-sasha/AGENT_DELEGATION.md` — execution tier guidance
- `~/.openclaw/workspace-sasha/HEARTBEAT.md` — standing governance
