---
name: sasha-content-program
description: Canva, LinkedIn, and newsletter content operations for Sasha — intake checklist, approval-gated publishing, browser drafts, and executive governance. Use when planning or drafting public posts, carousels, DCB/AgentEcos social, newsletters, or DM outreach.
metadata: { "openclaw": { "emoji": "📣" } }
---

# Sasha content program

Use when King asks for **Canva**, **LinkedIn**, **newsletter**, or **governance/content** work. **Public tone only** — load `sasha-persona` for private voice but do not use bedroom humor or "King" in external drafts. Public posts are **`publicPosts`** approval-gated; investor copy is **`investorMessaging`**. Default: **draft + queue**, publish only after **"Approved to publish."**

## Before any scaffold or automation

1. Read `content-program/OPERATIONS.md` (canonical spec), `INTAKE.md`, and `DECISIONS.md` in this workspace.
2. Read `HEARTBEAT.md` standing instructions (no PHI, read-only first).
3. Run **Sasha readiness** per `HEARTBEAT.md` § Sasha readiness before content or executive work beyond drafts; report gaps, do not assume integrations are live.
4. Run read-only health:
   - `node operator/integrations/canva/health.mjs` (from OpenClaw repo root)
   - `node operator/integrations/linkedin/health.mjs`
5. `executive_status` — confirm `browser.linkedinDraftsOnly` and governance approval classes.

After editing this skill in the repo, sync to the workspace: `cp -R skills/sasha-content-program ~/.openclaw/workspace-sasha/skills/` (or restart gateway).

Do **not** publish, send connection blasts, or post newsletters until intake is complete **and** the user says publish.

## Three blocking decisions (must be recorded in DECISIONS.md)

| #   | Decision                    | Options                                                                                                  |
| --- | --------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1   | **LinkedIn posting method** | (a) drafts for manual publish, (b) browser automation in logged-in profile, (c) LinkedIn API app + OAuth |
| 2   | **LinkedIn identity**       | Personal (Michael) vs company page (DCB / AgentEcos / Mport Media Group)                                 |
| 3   | **Newsletter platform**     | LinkedIn Newsletter, Substack, Beehiiv, Mailchimp, Buttondown, other                                     |

Until all three are chosen, only produce **intake forms**, **draft copy**, and **checklists** — no live posts.

## Surface playbooks

### Canva

- **Access:** Canva Connect API (`CANVA_CLIENT_ID` / `CANVA_CLIENT_SECRET` in `~/.openclaw/.env`) preferred; else documented Pro login via browser profile `canva` under `operator/browser-automation/.profiles`.
- **Collect:** brand kit (logo paths, hex colors, fonts), format list (square, carousel, story, banner, newsletter header), template reuse list.
- **Output:** design brief + asset checklist; use browser plugin for draft edits if profile exists; never export/post without approval.

### LinkedIn

- **Policy:** `linkedinDraftsOnly: true` in executive-ops — no autonomous mass DMs, scraping, or connection campaigns.
- **Collect:** account choice, audience, tone guardrails, DM scope (connections vs 1st-degree vs InMail), do-not-contact list.
- **Methods:** (a) markdown/Google Doc drafts for manual paste; (b) browser profile `linkedin` drafts only; (c) API only after user creates LinkedIn app and secrets live in vault/env.
- **Optional ClawHub:** `typefully-social-media` for cross-platform draft scheduling (still human publish for LinkedIn unless user overrides with approval).

### Newsletter

- **Collect:** platform, subscriber source, cadence, target length, standing sections (e.g. "This month at DCB", "Michigan signal", "What we're reading").
- **Output:** issue outline + draft in workspace `content-program/drafts/`; no list import or send without **`publicPosts`** + **`emails`** approval as applicable.

### Governance / editorial

- **Collect:** 1–3 month topic backlog, approver names + SLA, hard never-publish rules (beyond no-PHI), KPIs (impressions, replies, demos, signups).
- **Use:** `dcb-governance` for PHI and approval classes; `executive_repo_plan` with `surface: "browser"` or `"dcb"` for milestone checklists.
- **Store operational answers** in `content-program/INTAKE.md` only — no subscriber emails or hospital names in git.

## Env / vault (names only in chat)

| Variable                                 | Surface                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------ |
| `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET` | Canva Connect                                                                        |
| `MATON_API_KEY`                          | Zoho CRM skill (related CRM lists)                                                   |
| `SUPABASE_*`                             | Executive memory (optional editorial log)                                            |
| LinkedIn API                             | User-created app; store tokens in 1Password / `~/.openclaw/.env` after user provides |

## Workflow summary

1. **Intake** — fill gaps in `INTAKE.md` via numbered questions (user can reply with digits).
2. **Decisions** — lock the three blocking choices in `DECISIONS.md`.
3. **Plan** — `executive_repo_plan` with goal + surface `browser` or `dcb`.
4. **Draft** — write to `content-program/drafts/<slug>.md`; state approval class on top.
5. **Publish** — only after Michael says exactly **"Approved to publish."** (LinkedIn, newsletter, Canva exports, video, PDFs, investor materials, outreach).

## Related

- `dcb-governance`, `dcb-operator`
- `docs/plugins/executive-ops.md`
- `operator/integrations/canva/README.md`, `operator/integrations/linkedin/README.md`
