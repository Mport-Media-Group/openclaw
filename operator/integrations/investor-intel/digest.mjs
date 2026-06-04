#!/usr/bin/env node
// Investor Intelligence v0.1 — weekly digest.
// Reads all dossiers, extracts signals from last 7 days, compiles per-target sections + a top
// "Material events this week" section, writes to digests/YYYY-WW.md.
//
// Zero npm deps. Node 22 built-ins only.

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readSignalsSince, bootstrapPath } from "./lib/dossier.mjs";
import { CATEGORY_PRIORITY } from "./lib/material-events.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TARGETS_PATH = path.join(__dirname, "targets.json");
const DOSSIERS_DIR = path.join(__dirname, "dossiers");
const DIGESTS_DIR = path.join(__dirname, "digests");

function isoWeek(d) {
  // ISO week: YYYY-Www. Thursday-based.
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const diff = (date.getTime() - firstThursday.getTime()) / 86_400_000;
  const week = 1 + Math.round((diff - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return { year: date.getUTCFullYear(), week };
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function compile(targets) {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const perTarget = [];
  const allMaterials = [];

  for (const target of targets) {
    const dossierPath = bootstrapPath(target, DOSSIERS_DIR);
    const signals = readSignalsSince(dossierPath, cutoff);
    if (signals.length === 0) continue;
    perTarget.push({ target, signals });
    for (const s of signals) {
      if (s.category) allMaterials.push({ ...s, target });
    }
  }

  allMaterials.sort(
    (a, b) => (CATEGORY_PRIORITY[b.category] ?? 0) - (CATEGORY_PRIORITY[a.category] ?? 0),
  );

  return { perTarget, allMaterials };
}

function renderDigest({ perTarget, allMaterials }, now) {
  const { year, week } = isoWeek(now);
  const fileBase = `${year}-W${pad2(week)}`;
  const lines = [];
  lines.push(`# Ecosystem week — ${fileBase}`);
  lines.push("");
  lines.push(`Generated: ${now.toISOString()}`);
  lines.push("");
  lines.push(
    `Coverage: ${perTarget.length} target(s) with new signals · ${allMaterials.length} material event(s)`,
  );
  lines.push("");

  if (allMaterials.length > 0) {
    lines.push("## Material events this week");
    lines.push("");
    lines.push(
      "Heuristic-classified — review carefully before any outreach. **`investorMessaging` gate applies.**",
    );
    lines.push("");
    for (const m of allMaterials) {
      lines.push(
        `- **[${m.category}]** ${m.target.name} — ${m.date} — ${m.headline}  \n  ${m.link}`,
      );
    }
    lines.push("");
  } else {
    lines.push("## Material events this week");
    lines.push("");
    lines.push("_None detected._");
    lines.push("");
  }

  lines.push("## Per-target signals");
  lines.push("");
  if (perTarget.length === 0) {
    lines.push("_No new signals this week across any target._");
    lines.push("");
  } else {
    for (const { target, signals } of perTarget) {
      lines.push(`### ${target.name}`);
      lines.push("");
      lines.push(`Type: ${target.type} · Why: ${target.why}`);
      lines.push("");
      for (const s of signals) {
        const cat = s.category ? ` _[${s.category}]_` : "";
        lines.push(`- ${s.date} — ${s.source} — ${s.headline}${cat}  \n  ${s.link}`);
      }
      lines.push("");
    }
  }

  lines.push("---");
  lines.push("");
  lines.push("Source dossiers: `operator/integrations/investor-intel/dossiers/`");
  lines.push("Drafted outreach (if any) must clear `investorMessaging` approval before send.");
  lines.push("");

  return { fileBase, content: lines.join("\n") };
}

function main() {
  if (!existsSync(TARGETS_PATH)) {
    console.error(`targets.json missing at ${TARGETS_PATH}`);
    process.exit(1);
  }
  if (!existsSync(DIGESTS_DIR)) mkdirSync(DIGESTS_DIR, { recursive: true });

  const cfg = JSON.parse(readFileSync(TARGETS_PATH, "utf8"));
  const compiled = compile(cfg.targets);
  const now = new Date();
  const { fileBase, content } = renderDigest(compiled, now);
  const outPath = path.join(DIGESTS_DIR, `${fileBase}.md`);
  writeFileSync(outPath, content, "utf8");
  process.stdout.write(`digest written: ${outPath}\n`);
  process.stdout.write(
    `coverage: ${compiled.perTarget.length} target(s) with signals · ${compiled.allMaterials.length} material event(s)\n`,
  );
}

main();
