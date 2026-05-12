#!/usr/bin/env node
/**
 * One-shot operator checklist: doctor + skills visibility for the default agent
 * and every configured agent id.
 *
 * Usage (from repo root, after `pnpm install`):
 *   pnpm claw:max-readiness
 *   node scripts/claw-max-readiness.mjs
 *   node scripts/claw-max-readiness.mjs --skip-doctor
 *
 * Uses the same CLI entry as `pnpm openclaw` (see package.json "openclaw" script).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skipDoctor = process.argv.includes("--skip-doctor");

function banner(title) {
  process.stderr.write(`\n━━ ${title} ━━\n\n`);
}

function runOpenclaw(args, inherit = true) {
  const r = spawnSync("pnpm", ["openclaw", ...args], {
    cwd: repoRoot,
    stdio: inherit ? "inherit" : ["ignore", "pipe", "inherit"],
    encoding: inherit ? undefined : "utf8",
  });
  return r.status ?? 1;
}

function runOpenclawCapture(args) {
  const r = spawnSync("pnpm", ["openclaw", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    status: r.status ?? 1,
    stdout: r.stdout ?? "",
    stderr: r.stderr ?? "",
  };
}

function parseAgentIds(jsonText) {
  const trimmed = jsonText.trim();
  if (!trimmed) {
    return [];
  }
  let data;
  try {
    data = JSON.parse(trimmed);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) {
    return [];
  }
  const ids = [];
  for (const row of data) {
    if (row && typeof row === "object" && typeof row.id === "string" && row.id) {
      ids.push(row.id);
    }
  }
  return ids;
}

let exitCode = 0;

if (!skipDoctor) {
  banner("openclaw doctor");
  exitCode |= runOpenclaw(["doctor"]);
} else {
  process.stderr.write("(skipped openclaw doctor)\n");
}

banner("openclaw skills check (default agent)");
exitCode |= runOpenclaw(["skills", "check"]);

banner("Configured agents (JSON)");
const agentsProbe = runOpenclawCapture(["agents", "list", "--json"]);
if (agentsProbe.status !== 0) {
  process.stderr.write(
    agentsProbe.stderr ||
      "Warning: `openclaw agents list --json` failed; skipping per-agent skills checks.\n",
  );
  exitCode |= agentsProbe.status;
} else {
  const agentIds = parseAgentIds(agentsProbe.stdout);
  if (agentIds.length === 0) {
    process.stderr.write("No agent ids parsed from JSON; per-agent skills checks skipped.\n");
  } else {
    process.stderr.write(`Found ${agentIds.length} agent(s): ${agentIds.join(", ")}\n`);
    for (const id of agentIds) {
      banner(`openclaw skills check --agent ${id}`);
      exitCode |= runOpenclaw(["skills", "check", "--agent", id]);
    }
  }
}

banner("Done");
process.stderr.write(
  exitCode === 0
    ? "All steps completed with exit code 0.\n"
    : `Finished with non-zero status (${exitCode}). Fix doctor/skills issues above, then restart the gateway if you changed config.\n`,
);
process.exit(exitCode);
