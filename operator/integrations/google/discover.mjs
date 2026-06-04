#!/usr/bin/env node
// Google integration v0 — prerequisites checklist + current state print
// Run this when health.mjs reports OAuth client missing. Shows King exactly what to do.

import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const CREDS_DIR = path.join(os.homedir(), ".openclaw", "credentials");
const CLIENT_PATH = path.join(CREDS_DIR, "google-oauth-client.json");
const REFRESH_PATH = path.join(CREDS_DIR, "google-refresh-token.json");

const CHECKLIST = `
==============================================================
  Google integration v0 — King's one-time prerequisite checklist
  ~10 minutes in Google Cloud Console
==============================================================

1. Pick or create a Google Cloud project.
   - https://console.cloud.google.com/projectcreate
   - Name suggestion: "dcb-sasha-ops"
   - If DCB already has a GCP project, reuse it.

2. Enable the Gmail and Calendar APIs.
   - https://console.cloud.google.com/apis/library/gmail.googleapis.com  -> Enable
   - https://console.cloud.google.com/apis/library/calendar-json.googleapis.com  -> Enable

3. Configure the OAuth consent screen.
   - https://console.cloud.google.com/apis/credentials/consent
   - User type: External  (Internal if you have a Workspace)
   - App name: "OpenClaw Sasha"
   - Support email: King's email
   - Add scopes:
       https://www.googleapis.com/auth/gmail.readonly
       https://www.googleapis.com/auth/gmail.compose
       https://www.googleapis.com/auth/calendar.readonly
       https://www.googleapis.com/auth/calendar.events
   - Test users: add King's Gmail address.  v0 stays in Testing mode.

4. Create the OAuth Client ID.
   - https://console.cloud.google.com/apis/credentials
   - Create Credentials -> OAuth client ID
   - Application type: Desktop app
   - Name: "OpenClaw Sasha CLI"
   - Click Create -> Download JSON.

5. Move the downloaded JSON to:
       ${CLIENT_PATH}
   (mkdir -p ${CREDS_DIR} first if needed)

6. Then run:
       node operator/integrations/google/oauth-flow.mjs
   A browser will open; King authorizes; refresh token stored at:
       ${REFRESH_PATH}

==============================================================
  Current state on this Mac
==============================================================
`;

function presentMark(p) {
  return existsSync(p) ? "[present]" : "[missing]";
}

process.stdout.write(CHECKLIST);
process.stdout.write(`  ${presentMark(CREDS_DIR)}  ${CREDS_DIR}\n`);
process.stdout.write(`  ${presentMark(CLIENT_PATH)}  ${CLIENT_PATH}\n`);
process.stdout.write(`  ${presentMark(REFRESH_PATH)}  ${REFRESH_PATH}\n`);

if (!existsSync(CLIENT_PATH)) {
  process.stdout.write("\n  Next step: complete prereq steps 1-5 above.\n\n");
  process.exit(1);
}
if (!existsSync(REFRESH_PATH)) {
  process.stdout.write("\n  Next step: run `node operator/integrations/google/oauth-flow.mjs`\n\n");
  process.exit(1);
}
process.stdout.write(
  "\n  Next step: run `node operator/integrations/google/apply.mjs` for smoke tests.\n\n",
);
process.exit(0);
