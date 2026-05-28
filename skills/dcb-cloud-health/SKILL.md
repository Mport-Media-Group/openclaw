---
name: dcb-cloud-health
description: Read-only health and configuration probes for Discharge Bridge GCP, Firebase, Firestore, and Cloud Run via executive-ops and operator runtime scripts. Use before any DCB deploy or infra change.
metadata: { "openclaw": { "emoji": "☁️" } }
---

# DCB cloud health

Use when checking **DCB infrastructure readiness** (Google Cloud, Firebase, Cloud Run) without making changes.

## Rules

- **Read-only by default.** No `gcloud deploy`, Firebase rules pushes, or Firestore writes without explicit approval (`deploymentPushes`).
- Do not print API keys, service account JSON, or patient/customer identifiers.
- Prefer config + health tools over guessing project IDs.

## Config sources

1. **`plugins.entries["executive-ops"].config.dcb`** in `openclaw.json`:
   - `gcpProjectId`, `firebaseProjectId`, `firestoreDatabase`, `cloudRunServices[]`
2. **Environment** (operator executive health also reads):
   - `GOOGLE_CLOUD_PROJECT` or `GCP_PROJECT`
   - `FIREBASE_PROJECT`
   - `CLOUD_RUN_SERVICE`
3. **`executive_status`** / Gateway `executive.status` — merged DCB block when plugin enabled.

Fill missing project IDs in config (not in git) before expecting rich status.

## Probes (in order)

### 1) Executive plugin status

Call **`executive_status`** and inspect `dcb`:

- `enabled`, project IDs, `cloudRunServices`, investor/compliance monitor flags

### 2) Operator runtime snapshot (repo root)

```bash
node operator/executive/runtime-health.mjs
```

Inspect stdout or `operator/reports/executive-runtime-health.json` → `dcb.googleCloudProject`, `dcb.firebaseProject`, `dcb.cloudRunService`.

### 3) Optional CLI (only if user approves shell on machine with gcloud)

Read-only examples:

```bash
gcloud config get-value project
gcloud run services list --project="${GCP_PROJECT}" --format='table(name,region,status)' 2>/dev/null | head -20
```

If `gcloud` is missing or auth fails, report the gap; do not install or login without approval.

### 4) Supabase / memory (executive memory contract)

When DCB ops need executive memory: confirm `plugins.entries["executive-ops"].config.memory` env vars exist in `~/.openclaw/.env` (names only in chat — never values).

## When unhealthy

1. Document which signal is missing (config vs env vs CLI auth).
2. Run **`executive_repo_plan`** with `surface: "dcb"` and goal like "restore read-only cloud health probes".
3. Escalate mutations separately with `dcb-governance` approval rules.

## Pair with

- `dcb-operator` — product and milestone context
- `dcb-governance` — deploy and compliance gates
