#!/usr/bin/env node
// Google integration v0 — readiness probe
// Read-only. Reports presence of OAuth client, refresh token, scope file, and dir layout.
// NEVER prints secret values.

import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CREDS_DIR = path.join(os.homedir(), ".openclaw", "credentials");
const CLIENT_PATH = path.join(CREDS_DIR, "google-oauth-client.json");
const REFRESH_PATH = path.join(CREDS_DIR, "google-refresh-token.json");
const SCOPES_PATH = path.join(__dirname, "scopes.json");

function check(ok, label, detail) {
  return { ok, label, detail };
}

function loadScopesSummary() {
  if (!existsSync(SCOPES_PATH)) return { ok: false, error: "scopes.json missing" };
  try {
    const data = JSON.parse(readFileSync(SCOPES_PATH, "utf8"));
    const v0 = data.v0 || {};
    const counts = Object.fromEntries(
      Object.entries(v0).map(([k, v]) => [k, Array.isArray(v) ? v.length : 0]),
    );
    return { ok: true, counts };
  } catch (e) {
    return { ok: false, error: `parse error: ${e.message}` };
  }
}

function clientShape() {
  if (!existsSync(CLIENT_PATH)) {
    return {
      ok: false,
      detail:
        "google-oauth-client.json not in ~/.openclaw/credentials/ — run discover.mjs for King's prereq checklist",
    };
  }
  try {
    const data = JSON.parse(readFileSync(CLIENT_PATH, "utf8"));
    const inner = data.installed || data.web || data;
    const hasClientId = typeof inner.client_id === "string" && inner.client_id.length > 0;
    const hasClientSecret =
      typeof inner.client_secret === "string" && inner.client_secret.length > 0;
    if (!hasClientId || !hasClientSecret) {
      return {
        ok: false,
        detail: "google-oauth-client.json present but missing client_id or client_secret",
      };
    }
    // NEVER print client_id or client_secret — only structural confirmation
    return { ok: true, detail: "client_id + client_secret present (values redacted)" };
  } catch (e) {
    return { ok: false, detail: `google-oauth-client.json parse error: ${e.message}` };
  }
}

function refreshTokenShape() {
  if (!existsSync(REFRESH_PATH)) {
    return {
      ok: false,
      detail: "google-refresh-token.json missing — run oauth-flow.mjs once to authorize",
    };
  }
  try {
    const data = JSON.parse(readFileSync(REFRESH_PATH, "utf8"));
    const hasRefresh = typeof data.refresh_token === "string" && data.refresh_token.length > 0;
    const obtained = data.obtained_at || "(unknown)";
    if (!hasRefresh) {
      return { ok: false, detail: "google-refresh-token.json present but no refresh_token field" };
    }
    return { ok: true, detail: `refresh_token present (obtained ${obtained}, value redacted)` };
  } catch (e) {
    return { ok: false, detail: `google-refresh-token.json parse error: ${e.message}` };
  }
}

async function main() {
  const checks = [];

  // 1. scopes file
  const scopes = loadScopesSummary();
  checks.push(
    check(
      scopes.ok,
      "scopes.json",
      scopes.ok
        ? `gmail=${scopes.counts.gmail ?? 0}, calendar=${scopes.counts.calendar ?? 0}`
        : scopes.error,
    ),
  );

  // 2. credentials dir
  checks.push(
    check(
      existsSync(CREDS_DIR),
      "~/.openclaw/credentials/ dir",
      existsSync(CREDS_DIR) ? "present" : "missing (run oauth-flow.mjs or mkdir manually)",
    ),
  );

  // 3. OAuth client (King's prereq)
  const client = clientShape();
  checks.push(check(client.ok, "google-oauth-client.json", client.detail));

  // 4. refresh token (post-oauth-flow)
  const refresh = refreshTokenShape();
  checks.push(check(refresh.ok, "google-refresh-token.json", refresh.detail));

  const allOk = checks.every((c) => c.ok);
  const report = {
    ok: allOk,
    generatedAt: new Date().toISOString(),
    module: "google",
    version: "v0",
    checks,
    nextStep: allOk
      ? "ready — run apply.mjs for smoke tests"
      : !client.ok
        ? "King must create GCP OAuth client and drop google-oauth-client.json into ~/.openclaw/credentials/ — see discover.mjs"
        : !refresh.ok
          ? "Run: node operator/integrations/google/oauth-flow.mjs"
          : "see failing checks above",
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  process.stderr.write(`${e.stack || e.message || String(e)}\n`);
  process.exit(2);
});
