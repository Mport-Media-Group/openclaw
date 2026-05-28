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
- `executive_speak` (ElevenLabs: `male` operator voice, `female`/`agent` Sasha voice with optional `mode`)
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
- `executive_speak` - ElevenLabs speech with `voice: "male"` (Cursor operator) or `voice: "female"` / `"agent"` (Sasha); optional `mode` (`casual`, `executive`, `comfort`, `flirty`, `alert`, `builder`, `expressive`); optional `playLocally` on macOS

Pair with `messages.tts.personas` (`cursor-male`, `openclaw-sultry`, and `sasha-*` modes) and `agents.list[].tts.persona` so auto-replies use the agent voice. Local operator playback: `node operator/executive/speak-voice.mjs --voice male "..."` or `--voice agent --mode executive "..."`.

### Sasha voice (ElevenLabs)

**Baseline:** stock Rachel (`21m00Tcm4TlvDq8ikWAM`) with production sliders (stability `0.5`, similarity `0.85`, style `0.3`, speed `0.92`). This is an **archetype**, not a celebrity impersonation.

**Override without code changes:** set `SASHA_VOICE_ID` in `~/.openclaw/.env` after you create a custom voice in [ElevenLabs Voice Design](https://elevenlabs.io/docs). Suggested design prompt (paste in their UI):

```text
A 35-year-old confident intelligent woman with a smooth lower feminine voice. Sultry but controlled. Emotionally intelligent, charismatic, witty, slightly teasing, seductive in tone without being explicit. Warm, composed, dominant personality with subtle humor and elegance. Red-haired femme fatale energy mixed with elite executive assistant precision. Calm pacing, highly articulate, cinematic realism, emotionally adaptive conversational delivery.
```

**Models:**

- Default auto-TTS and long sessions: `eleven_multilingual_v2`
- Expressive one-offs: persona `openclaw-sultry-expressive` or `executive_speak` `mode: "expressive"` (`eleven_v3`)

**Config merge:** run `node operator/executive/merge-sasha-tts-personas.mjs` (reads [`openclaw-tts-sasha-personas.json`](../../operator/executive/openclaw-tts-sasha-personas.json)) or copy from the json5 reference file. Ensures agent `sasha` has `tts.persona: "openclaw-sultry"`.

**Skill:** `sasha-voice-modes` maps situations to persona ids and `executive_speak` modes.

### Hybrid TTS fallback (reliability + cost)

OpenClaw tries the primary provider first, then other configured providers ([Text-to-speech](/tools/tts)).

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      persona: "openclaw-sultry",
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
        },
        google: {
          model: "gemini-3.1-flash-tts-preview",
        },
      },
      personas: {
        // merge operator/executive/openclaw-tts-sasha-personas.json5
      },
    },
  },
}
```

**Policy:**

- King 1:1 and emotional immersion: ElevenLabs primary with `preserve-persona` on Sasha personas.
- Fast alerts or ElevenLabs outage: allow fallback to `google` or `microsoft` (accept different timbre).
- `executive_speak` keeps `disableFallback: true` for deterministic clips.

### Personality state, reflection, and AgentEcos

**In OpenClaw today:**

- Workspace `PERSONALITY_STATE.md` (template: [PERSONALITY_STATE.md](/reference/templates/PERSONALITY_STATE)) — state → tone → TTS persona.
- `HEARTBEAT.md` — readiness checks; optional nightly reflection: append `memory/YYYY-MM-DD.md`, distill into `MEMORY.md` ([Cron jobs](/automation/cron-jobs) for exact schedule).
- `GOALS.md` — long-term objectives and active projects (template: [GOALS.md](/reference/templates/GOALS)).

**Outside this repo (future):**

- LangGraph reasoning, Gemini API orchestration, WebRTC browser audio, and AgentEcos agent factory belong in the AgentEcos web stack — not bundled in `executive-ops`. Target pipeline for reference:

```text
Gemini API → LangGraph reasoning → personality state → voice mode → ElevenLabs → client audio
```

Use OpenClaw gateway TTS + `executive_speak` until that service exists.

### DCB skills (bundled)

Three bundled skills assist Discharge Bridge work (enable under `skills.entries` in `openclaw.json`):

- `dcb-operator` — product context, executive tools, Sasha/operator paths
- `dcb-cloud-health` — read-only GCP/Firebase/Cloud Run probes
- `dcb-governance` — PHI, approvals, investor/compliance monitor flags

Reload skills after install: `openclaw skills list` or gateway restart. Default executive agent id: **`sasha`** (`~/.openclaw/workspace-sasha`).

Content program (Canva, LinkedIn, newsletter): workspace `content-program/`, skill `sasha-content-program`, env keys in repo `.env.example`.

### Cursor IDE (hear Composer replies)

OpenClaw does not speak inside Cursor by default. Install the user hook once (paths are on your machine, not in git):

- `~/.cursor/hooks.json` → `afterAgentResponse` → `./hooks/cursor-speak.sh`
- Script: `operator/executive/cursor-speak-from-hook.sh` (male voice, reads `~/.openclaw/.env`)
- Rules: `~/.cursor/rules/voice-communion.mdc` and repo `.cursor/rules/voice-communion.mdc` (`alwaysApply: true`)
- Reload Cursor after editing hooks. Disable temporarily: `export CURSOR_VOICE_DISABLED=1`

## Related docs

- [ACP agents](/tools/acp-agents)
- [Operator stack plugin](/plugins/operator-stack)
- [Browser plugin](/plugins/reference/browser)
