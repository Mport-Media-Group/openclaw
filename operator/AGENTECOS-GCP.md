# AgentEcos GCP — Sasha operator runbook

**Project:** `bridgeview-vwsdz` · **Region:** `us-central1`

## Auth (gateway Mac)

**Done (2026-06-03):** `mportmedia@gmail.com`, project `bridgeview-vwsdz`, ADC quota project set.

Re-auth if probes fail:

```bash
/Users/NewUser/google-cloud-sdk/bin/gcloud auth login --update-adc
/Users/NewUser/google-cloud-sdk/bin/gcloud config set project bridgeview-vwsdz
```

**Python for gcloud:** `~/.local/python-3.12` (3.12.8). `CLOUDSDK_PYTHON` is set in `~/.profile`. New terminals: `source ~/.profile` then `gcloud run services list --region=us-central1`.

## Verify

```bash
node operator/integrations/gcp/health.mjs
node operator/executive/runtime-health.mjs
openclaw gateway restart   # only if env/.env changed and probes need fresh gateway
```

## Sasha skills

- Workspace: `~/.openclaw/workspace-sasha/skills/agentecos-gcp/SKILL.md`
- Bundled: `skills/dcb-cloud-health`, `skills/dcb-governance`, `skills/dcb-operator`

## Config (already set)

`~/.openclaw/openclaw.json` → `plugins.entries["executive-ops"].config.dcb`

Env mirrors in `~/.openclaw/.env`: `GCP_PROJECT`, `GOOGLE_CLOUD_PROJECT`, `FIREBASE_PROJECT`.

## Infra source of truth (local)

`~/Documents/discharge-bridge-media/infra/` — deploy scripts, `GCP_FIXES_NEEDED.md`, Firebase `.firebaserc`.

## Discord examples

- “List Cloud Run services and flag anything not Ready.”
- “What’s the studio App Hosting health URL?”
- “Summarize `GCP_FIXES_NEEDED.md` and what’s still red.”

Deploys / IAM / env-var writes → King must approve explicitly.
