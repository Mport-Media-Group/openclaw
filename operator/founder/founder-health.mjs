#!/usr/bin/env node
/**
 * Validate founder pack: files exist, JSON parses, required keys present.
 * Writes operator/reports/founder-health-out.json (gitignored).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getFounderContextSummary, reloadFounderContext } from "./load-founder-context.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const reportsDir = path.join(repoRoot, "operator", "reports");
const outPath = path.join(reportsDir, "founder-health-out.json");

const requiredFiles = [
  "founder-profile.json",
  "runtime-preferences.json",
  "deployment-constraints.json",
  "strategic-goals.json",
  "engineering-principles.md",
  "architecture-philosophy.md",
  "communication-style.md",
  "load-founder-context.mjs",
];

function requireKeys(obj, keys, label) {
  for (const k of keys) {
    if (!(k in obj)) {
      throw new Error(`${label}: missing key "${k}"`);
    }
  }
}

function validate() {
  for (const f of requiredFiles) {
    const p = path.join(__dirname, f);
    if (!fs.existsSync(p)) {
      throw new Error(`missing file: ${f}`);
    }
  }

  const profile = JSON.parse(fs.readFileSync(path.join(__dirname, "founder-profile.json"), "utf8"));
  requireKeys(profile, ["version", "identity", "disclaimer"], "founder-profile");
  requireKeys(
    profile.identity,
    ["name", "titles", "organizations", "domains"],
    "founder-profile.identity",
  );

  const rt = JSON.parse(fs.readFileSync(path.join(__dirname, "runtime-preferences.json"), "utf8"));
  requireKeys(
    rt,
    ["version", "cloudPrimary", "preferences", "orchestration"],
    "runtime-preferences",
  );

  const dep = JSON.parse(
    fs.readFileSync(path.join(__dirname, "deployment-constraints.json"), "utf8"),
  );
  requireKeys(dep, ["version", "governance", "execution"], "deployment-constraints");

  const strat = JSON.parse(fs.readFileSync(path.join(__dirname, "strategic-goals.json"), "utf8"));
  requireKeys(strat, ["version", "productHierarchy", "goToMarket", "vision"], "strategic-goals");

  reloadFounderContext();
  const summary = getFounderContextSummary();
  if (!summary.ok) {
    throw new Error(summary.error ?? "getFounderContextSummary failed");
  }

  return { ok: true, summary, at: new Date().toISOString() };
}

let result;
try {
  result = validate();
} catch (e) {
  result = {
    ok: false,
    error: e instanceof Error ? e.message : String(e),
    at: new Date().toISOString(),
  };
}

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exit(result.ok ? 0 : 1);
