#!/usr/bin/env node
// Investor Intelligence v0 — readiness probe
// Reports: targets file valid, dossier+digest dirs present, Google News RSS reachable, no PHI/identifiers in dossiers.
// Read-only. Safe to run anytime. Never prints secret values (there are no secrets in this module).

import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TARGETS_PATH = path.join(__dirname, "targets.json");
const DOSSIERS_DIR = path.join(__dirname, "dossiers");
const DIGESTS_DIR = path.join(__dirname, "digests");

function status(ok, label, detail) {
  return { ok, label, detail };
}

function loadTargets() {
  if (!existsSync(TARGETS_PATH)) {
    return { ok: false, error: "targets.json missing" };
  }
  try {
    const raw = readFileSync(TARGETS_PATH, "utf8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data.targets) || data.targets.length === 0) {
      return { ok: false, error: "targets.json has no targets" };
    }
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: `targets.json parse error: ${e.message}` };
  }
}

async function probeRss(url, timeoutMs = 5000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctl.signal, redirect: "follow" });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: e.name === "AbortError" ? "timeout" : e.message };
  } finally {
    clearTimeout(t);
  }
}

function scanDossiersForPhi() {
  if (!existsSync(DOSSIERS_DIR)) return { ok: true, files: 0, warnings: [] };
  const files = readdirSync(DOSSIERS_DIR).filter((f) => f.endsWith(".md"));
  const warnings = [];
  const phiHints =
    /\b(MRN|medical record number|date of birth|DOB|SSN|social security|patient[ -]?id)\b/i;
  for (const f of files) {
    const text = readFileSync(path.join(DOSSIERS_DIR, f), "utf8");
    if (phiHints.test(text)) {
      warnings.push(`dossier ${f} contains possible PHI/identifier terms — manual review required`);
    }
  }
  return { ok: warnings.length === 0, files: files.length, warnings };
}

async function main() {
  const checks = [];

  // 1. targets.json
  const t = loadTargets();
  if (!t.ok) {
    checks.push(status(false, "targets.json", t.error));
  } else {
    checks.push(status(true, "targets.json", `${t.data.targets.length} target(s) loaded`));
  }

  // 2. dirs
  checks.push(
    status(
      existsSync(DOSSIERS_DIR),
      "dossiers/ dir",
      existsSync(DOSSIERS_DIR) ? "present" : "missing",
    ),
  );
  checks.push(
    status(
      existsSync(DIGESTS_DIR),
      "digests/ dir",
      existsSync(DIGESTS_DIR) ? "present" : "missing",
    ),
  );

  // 3. Google News RSS reachability (use first target as probe; never fetch all in health)
  if (t.ok) {
    const sample = t.data.targets[0];
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(sample.newsQuery)}&hl=en-US&gl=US&ceid=US:en`;
    const probe = await probeRss(url);
    checks.push(
      status(
        probe.ok,
        "google-news-rss",
        probe.ok ? `reachable (${probe.status})` : `unreachable: ${probe.error || probe.status}`,
      ),
    );
  }

  // 4. PHI sniff
  const phi = scanDossiersForPhi();
  checks.push(
    status(
      phi.ok,
      "phi-sniff",
      phi.warnings.length === 0
        ? `${phi.files} dossier(s), no PHI markers`
        : phi.warnings.join("; "),
    ),
  );

  const allOk = checks.every((c) => c.ok);
  const report = {
    ok: allOk,
    generatedAt: new Date().toISOString(),
    module: "investor-intel",
    version: "v0",
    checks,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  process.stderr.write(`${e.stack || e.message || String(e)}\n`);
  process.exit(2);
});
