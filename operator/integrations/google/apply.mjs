#!/usr/bin/env node
// Google integration v0 — smoke tests
// 1. Fetch fresh access token from refresh token
// 2. Read latest Gmail message subject only (no body) — verifies gmail.readonly works
// 3. List next 3 calendar events (titles + start times only) — verifies calendar.readonly works
//
// Never prints the access token, refresh token, or full email bodies.

import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const CREDS_DIR = path.join(os.homedir(), ".openclaw", "credentials");
const CLIENT_PATH = path.join(CREDS_DIR, "google-oauth-client.json");
const REFRESH_PATH = path.join(CREDS_DIR, "google-refresh-token.json");

function loadClient() {
  if (!existsSync(CLIENT_PATH)) throw new Error(`Missing ${CLIENT_PATH}`);
  const raw = JSON.parse(readFileSync(CLIENT_PATH, "utf8"));
  const inner = raw.installed || raw.web || raw;
  return { clientId: inner.client_id, clientSecret: inner.client_secret };
}

function loadRefreshToken() {
  if (!existsSync(REFRESH_PATH)) {
    throw new Error(`Missing ${REFRESH_PATH} — run oauth-flow.mjs first`);
  }
  const data = JSON.parse(readFileSync(REFRESH_PATH, "utf8"));
  if (!data.refresh_token) throw new Error("refresh_token field missing");
  return data.refresh_token;
}

async function getAccessToken({ clientId, clientSecret, refreshToken }) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Access token refresh failed (${res.status}): ${txt}`);
  }
  const json = await res.json();
  if (!json.access_token) throw new Error("No access_token in refresh response");
  return json.access_token;
}

async function gmailLatestSubject(accessToken) {
  const list = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=1", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!list.ok) throw new Error(`Gmail list failed (${list.status}): ${await list.text()}`);
  const data = await list.json();
  if (!data.messages || data.messages.length === 0) return "(no messages in inbox)";
  const msg = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${data.messages[0].id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!msg.ok) throw new Error(`Gmail get failed (${msg.status}): ${await msg.text()}`);
  const m = await msg.json();
  const headers = m.payload?.headers || [];
  const subject = headers.find((h) => h.name === "Subject")?.value || "(no subject)";
  const from = headers.find((h) => h.name === "From")?.value || "(unknown sender)";
  return `${subject}  —  from ${from}`;
}

async function calendarNext3(accessToken) {
  const nowIso = new Date().toISOString();
  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", nowIso);
  url.searchParams.set("maxResults", "3");
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Calendar list failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  if (!data.items || data.items.length === 0) return ["(no upcoming events)"];
  return data.items.map((e) => {
    const start = e.start?.dateTime || e.start?.date || "(no start)";
    const summary = e.summary || "(untitled)";
    return `${start}  —  ${summary}`;
  });
}

async function main() {
  const { clientId, clientSecret } = loadClient();
  const refreshToken = loadRefreshToken();
  const accessToken = await getAccessToken({ clientId, clientSecret, refreshToken });

  console.log("Access token obtained (value redacted).\n");

  console.log("Gmail smoke test (latest message metadata):");
  const subject = await gmailLatestSubject(accessToken);
  console.log(`  ${subject}\n`);

  console.log("Calendar smoke test (next 3 events):");
  const events = await calendarNext3(accessToken);
  for (const e of events) console.log(`  ${e}`);
  console.log("\nv0 smoke tests passed.");
}

main().catch((e) => {
  console.error(`apply.mjs failed: ${e.message}`);
  process.exit(1);
});
