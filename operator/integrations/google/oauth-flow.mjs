#!/usr/bin/env node
// Google integration v0 — OAuth 2.0 installed-app flow
// Runs once. Opens browser, captures authorization code via local redirect, exchanges for refresh token.
// Stores refresh_token in ~/.openclaw/credentials/google-refresh-token.json.
// Run with --force to re-auth (rotates refresh token).
//
// Zero npm deps. Uses node:http for the redirect listener, node:fetch for token exchange,
// child_process.spawn('open', url) to launch the browser on macOS.

import { spawn } from "node:child_process";
import { randomBytes, createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CREDS_DIR = path.join(os.homedir(), ".openclaw", "credentials");
const CLIENT_PATH = path.join(CREDS_DIR, "google-oauth-client.json");
const REFRESH_PATH = path.join(CREDS_DIR, "google-refresh-token.json");
const SCOPES_PATH = path.join(__dirname, "scopes.json");

const REDIRECT_PORT = 53682; // randomly chosen, unprivileged, unused locally
const REDIRECT_URI = `http://127.0.0.1:${REDIRECT_PORT}/oauth2callback`;

const force = process.argv.includes("--force");

function loadClient() {
  if (!existsSync(CLIENT_PATH)) {
    throw new Error(
      `OAuth client JSON not found at ${CLIENT_PATH}. Run discover.mjs for setup instructions.`,
    );
  }
  const raw = JSON.parse(readFileSync(CLIENT_PATH, "utf8"));
  const inner = raw.installed || raw.web || raw;
  if (!inner.client_id || !inner.client_secret) {
    throw new Error(`OAuth client JSON missing client_id or client_secret at ${CLIENT_PATH}`);
  }
  return { clientId: inner.client_id, clientSecret: inner.client_secret };
}

function loadScopes() {
  if (!existsSync(SCOPES_PATH)) throw new Error(`scopes.json missing at ${SCOPES_PATH}`);
  const data = JSON.parse(readFileSync(SCOPES_PATH, "utf8"));
  const v0 = data.v0 || {};
  const all = [];
  for (const group of Object.values(v0)) {
    if (Array.isArray(group)) for (const s of group) if (s.scope) all.push(s.scope);
  }
  if (all.length === 0) throw new Error("scopes.json has no scopes in v0");
  return all;
}

function base64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generatePkce() {
  const verifier = base64url(randomBytes(32));
  const challenge = base64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

function openBrowser(url) {
  const proc = spawn("open", [url], { stdio: "ignore", detached: true });
  proc.unref();
}

function waitForAuthCode(expectedState) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (!req.url.startsWith("/oauth2callback")) {
        res.writeHead(404).end("not found");
        return;
      }
      const url = new URL(req.url, `http://127.0.0.1:${REDIRECT_PORT}`);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      if (error) {
        res.end(`<h1>OAuth error</h1><p>${error}</p><p>Close this tab and check the terminal.</p>`);
        server.close();
        reject(new Error(`OAuth error from Google: ${error}`));
        return;
      }
      if (state !== expectedState) {
        res.end(`<h1>State mismatch</h1><p>Possible CSRF. Re-run oauth-flow.mjs.</p>`);
        server.close();
        reject(new Error("OAuth state mismatch"));
        return;
      }
      if (!code) {
        res.end(`<h1>Missing code</h1>`);
        server.close();
        reject(new Error("OAuth callback missing code"));
        return;
      }
      res.end(`<h1>Authorized.</h1><p>You can close this tab and return to the terminal.</p>`);
      server.close();
      resolve(code);
    });
    server.listen(REDIRECT_PORT, "127.0.0.1");
    server.on("error", reject);
    // 5-minute auth window
    setTimeout(
      () => {
        server.close();
        reject(new Error("OAuth flow timed out after 5 minutes"));
      },
      5 * 60 * 1000,
    ).unref();
  });
}

async function exchangeCodeForTokens({ clientId, clientSecret, code, verifier }) {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: REDIRECT_URI,
    grant_type: "authorization_code",
    code_verifier: verifier,
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${txt}`);
  }
  return await res.json();
}

function writeRefreshToken(json) {
  if (!existsSync(CREDS_DIR)) mkdirSync(CREDS_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(REFRESH_PATH, JSON.stringify(json, null, 2), { mode: 0o600 });
  try {
    chmodSync(REFRESH_PATH, 0o600);
  } catch {}
}

async function main() {
  if (existsSync(REFRESH_PATH) && !force) {
    console.log(`Refresh token already exists at ${REFRESH_PATH}. Pass --force to re-auth.`);
    process.exit(0);
  }

  const { clientId, clientSecret } = loadClient();
  const scopes = loadScopes();
  const { verifier, challenge } = generatePkce();
  const state = base64url(randomBytes(16));

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes.join(" "));
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent"); // ensure refresh_token returned
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  console.log("Opening browser for Google OAuth consent...");
  console.log(`If the browser does not open, paste this URL manually:\n  ${authUrl.toString()}\n`);
  openBrowser(authUrl.toString());

  console.log(`Waiting for redirect to ${REDIRECT_URI} (5-minute timeout)...`);
  const code = await waitForAuthCode(state);
  console.log("Authorization code received. Exchanging for tokens...");

  const tokens = await exchangeCodeForTokens({ clientId, clientSecret, code, verifier });
  if (!tokens.refresh_token) {
    throw new Error(
      "Google did not return a refresh_token. Usually means consent was previously granted; revoke at https://myaccount.google.com/permissions and re-run with --force.",
    );
  }
  const payload = {
    refresh_token: tokens.refresh_token,
    scope: tokens.scope,
    obtained_at: new Date().toISOString(),
    note: "Sensitive. Will migrate to OpenClaw Keyring (`google-refresh-token`) when Wedge 1.2 lands.",
  };
  writeRefreshToken(payload);
  console.log(`\nDone. Refresh token written to ${REFRESH_PATH} (mode 600).`);
  console.log(`Scopes granted: ${tokens.scope}\n`);
  console.log("Next: node operator/integrations/google/apply.mjs");
}

main().catch((e) => {
  console.error(`oauth-flow failed: ${e.message}`);
  process.exit(1);
});
