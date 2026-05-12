#!/usr/bin/env node
/**
 * Read-only GitHub snapshot -> operator/reports/github-operator-report.md
 * Prefers REST with GITHUB_TOKEN or GH_TOKEN; otherwise public API (rate limited).
 * Without a token: optional Playwright scrape when GITHUB_SNAPSHOT_PLAYWRIGHT=1
 * or when the issues REST call returns 403/429.
 * Sequential fetches only (low RAM / thermal friendly).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const reportsDir = path.join(repoRoot, "operator", "reports");
const outMd = path.join(reportsDir, "github-operator-report.md");

const token = process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim() || "";
const repo = process.env.GITHUB_OPERATOR_REPO?.trim() || "openclaw/openclaw";

async function fetchJson(url, headers = {}) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 400) };
  }
  return { ok: res.ok, status: res.status, body };
}

const [owner, name] = repo.split("/");
if (!owner || !name) {
  process.stderr.write("Invalid GITHUB_OPERATOR_REPO; use owner/repo\n");
  process.exit(1);
}

const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

const repoUrl = `https://api.github.com/repos/${owner}/${name}`;
const issuesUrl = `https://api.github.com/repos/${owner}/${name}/issues?state=open&per_page=10`;
const pullsUrl = `https://api.github.com/repos/${owner}/${name}/pulls?state=open&per_page=10`;
const dependabotUrl = `https://api.github.com/repos/${owner}/${name}/dependabot/alerts?per_page=5`;

const repoInfo = await fetchJson(repoUrl, headers);
const defaultBranch =
  typeof repoInfo.body?.default_branch === "string" ? repoInfo.body.default_branch : "main";

const refUrl = `https://api.github.com/repos/${owner}/${name}/git/ref/heads/${encodeURIComponent(defaultBranch)}`;
const refInfo = await fetchJson(refUrl, headers);
const refObj = refInfo.body?.object;
const sha = typeof refObj?.sha === "string" ? refObj.sha : null;

let statusInfo = { ok: false, skipped: true, reason: "no sha for combined status" };
if (sha) {
  statusInfo = await fetchJson(
    `https://api.github.com/repos/${owner}/${name}/commits/${sha}/status`,
    headers,
  );
}

const issues = await fetchJson(issuesUrl, headers);
const pulls = await fetchJson(pullsUrl, headers);
const actionsRunsUrl = `https://api.github.com/repos/${owner}/${name}/actions/runs?per_page=5`;
const actionsRuns = await fetchJson(actionsRunsUrl, headers);

let dependabot = await fetchJson(dependabotUrl, headers);
let dependabotNote = "";
if (!dependabot.ok && (dependabot.status === 403 || dependabot.status === 404)) {
  dependabotNote =
    "Dependabot alerts skipped (token needs `security_events` scope or Dependabot not enabled).";
  dependabot = { ...dependabot, note: dependabotNote };
}

function summarizeIssues(body) {
  const arr = Array.isArray(body) ? body : [];
  return arr
    .filter((/** @type {{ pull_request?: unknown }} */ i) => !i.pull_request)
    .slice(0, 8)
    .map((/** @type {{ number?: number, title?: string, labels?: { name: string }[] }} */ i) => {
      const labels = (i.labels ?? []).map((l) => l.name).join(", ");
      return `- #${i.number ?? "?"} ${i.title ?? ""}${labels ? ` [${labels}]` : ""}`;
    });
}

function summarizePulls(body) {
  const arr = Array.isArray(body) ? body : [];
  return arr
    .slice(0, 8)
    .map((/** @type {{ number?: number, title?: string, user?: { login?: string } }} */ p) => {
      const who = p.user?.login ?? "?";
      return `- PR #${p.number ?? "?"} ${p.title ?? ""} (@${who})`;
    });
}

function summarizeWorkflowRuns(body) {
  const runs = body?.workflow_runs;
  if (!Array.isArray(runs)) {
    return ["_(no workflow runs in response)_"];
  }
  return runs
    .slice(0, 5)
    .map(
      (
        /** @type {{ name?: string, status?: string, conclusion?: string, html_url?: string }} */ r,
      ) => {
        return `- ${r.name ?? "workflow"}: ${r.status ?? "?"}${r.conclusion ? ` (${r.conclusion})` : ""}`;
      },
    );
}

function summarizeDependabot(body) {
  if (!Array.isArray(body)) {
    return ["_(no alerts array — check scope or Dependabot status)_"];
  }
  return body
    .slice(0, 5)
    .map((/** @type {{ number?: number, security_advisory?: { summary?: string } }} */ a) => {
      const s = a.security_advisory?.summary ?? "alert";
      return `- #${a.number ?? "?"} ${s}`;
    });
}

const lines = [];
lines.push(`# GitHub operator snapshot`);
lines.push("");
lines.push(`- Generated: ${new Date().toISOString()}`);
lines.push(`- Repo: ${repo}`);
lines.push(`- Auth: ${token ? "token present (not shown)" : "none (public API)"}`);
lines.push(`- Default branch: ${defaultBranch}`);
lines.push("");

lines.push(`## Summary`);
lines.push("");
lines.push(`### Open issues (sample)`);
for (const line of summarizeIssues(issues.body)) {
  lines.push(line);
}
lines.push("");
lines.push(`### Open pull requests (sample)`);
for (const line of summarizePulls(pulls.body)) {
  lines.push(line);
}
lines.push("");
lines.push(`### Combined status (last commit on default branch)`);
lines.push(`- SHA: ${sha ?? "unknown"}`);
lines.push(`- HTTP: ${statusInfo.status ?? "n/a"} ok=${statusInfo.ok}`);
lines.push("");
lines.push(`### Recent workflow runs`);
for (const line of summarizeWorkflowRuns(actionsRuns.body)) {
  lines.push(line);
}
lines.push("");
lines.push(`### Dependabot alerts (sample)`);
if (dependabotNote) {
  lines.push(`_${dependabotNote}_`);
  lines.push("");
}
for (const line of summarizeDependabot(dependabot.body)) {
  lines.push(line);
}
lines.push("");

lines.push(`## Repository (JSON)`);
lines.push("");
lines.push("```json");
lines.push(
  JSON.stringify({ ok: repoInfo.ok, status: repoInfo.status, body: repoInfo.body }, null, 2),
);
lines.push("```");
lines.push("");

lines.push(`## Open issues (JSON)`);
lines.push("");
lines.push("```json");
lines.push(JSON.stringify({ ok: issues.ok, status: issues.status, body: issues.body }, null, 2));
lines.push("```");
lines.push("");

lines.push(`## Pull requests (JSON)`);
lines.push("");
lines.push("```json");
lines.push(JSON.stringify({ ok: pulls.ok, status: pulls.status, body: pulls.body }, null, 2));
lines.push("```");
lines.push("");

lines.push(`## Combined status (JSON)`);
lines.push("");
lines.push("```json");
lines.push(JSON.stringify(statusInfo, null, 2));
lines.push("```");
lines.push("");

lines.push(`## Actions runs (JSON)`);
lines.push("");
lines.push("```json");
lines.push(JSON.stringify(actionsRuns, null, 2));
lines.push("```");
lines.push("");

lines.push(`## Dependabot alerts (JSON)`);
lines.push("");
lines.push("```json");
lines.push(JSON.stringify(dependabot, null, 2));
lines.push("```");
lines.push("");

const wantPlaywright =
  !token &&
  (process.env.GITHUB_SNAPSHOT_PLAYWRIGHT === "1" ||
    (!issues.ok && (issues.status === 403 || issues.status === 429)));

if (wantPlaywright) {
  lines.push(`## Public issues page (Playwright; no login; no token)`);
  lines.push("");
  lines.push(
    `_Limited HTML-derived excerpt only. Set \`GITHUB_SNAPSHOT_PLAYWRIGHT=1\` to force this path when the REST issues call succeeds._`,
  );
  lines.push("");
  const pw = await scrapePublicIssuesPage();
  lines.push("```json");
  lines.push(JSON.stringify(pw, null, 2));
  lines.push("```");
  lines.push("");
}

lines.push(`_Read-only. No pushes, merges, or branch deletes._`);

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(outMd, `${lines.join("\n")}\n`, "utf8");
process.stdout.write(`Wrote ${path.relative(repoRoot, outMd)}\n`);

if (process.env.GITHUB_SNAPSHOT_MEMORY !== "0") {
  try {
    const { logGithubSummary } = await import("../../memory/task-history.mjs");
    logGithubSummary({
      report: "github-operator-report.md",
      repo,
      issuesOk: issues.ok,
      pullsOk: pulls.ok,
      at: new Date().toISOString(),
    });
  } catch {
    /* optional memory layer */
  }
}

/**
 * @returns {Promise<{ ok: boolean; url?: string; title?: string; excerpt?: string; error?: string }>}
 */
async function scrapePublicIssuesPage() {
  const url = `https://github.com/${owner}/${name}/issues`;
  let browser;
  try {
    const { chromium } = await import("playwright-core");
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    const title = await page.title();
    const excerpt = await page.evaluate(() => {
      const t = document.body?.innerText ?? "";
      return t.replace(/\s+/g, " ").trim().slice(0, 2000);
    });
    return { ok: true, url, title, excerpt };
  } catch (e) {
    return { ok: false, url, error: String(e) };
  } finally {
    await browser?.close();
  }
}
