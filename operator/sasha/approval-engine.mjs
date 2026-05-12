#!/usr/bin/env node
/**
 * Map operator script paths to required approval tier; exit 2 when blocked.
 * Usage: node operator/sasha/approval-engine.mjs <scriptPath>
 */
import path from "node:path";

function tierForScript(rel) {
  const n = rel.replaceAll("\\", "/");
  if (n.includes("test-local-models.mjs") || n.includes("ollama-health.mjs")) {
    return "ADMIN";
  }
  if (
    n.includes("operator/workflows/") ||
    n.includes("runtime-check.mjs") ||
    n.includes("public-page-snippet.mjs") ||
    n.includes("secrets-scaffold.mjs")
  ) {
    return "ELEVATED";
  }
  if (
    n.includes("run-e2e-validation.mjs") ||
    n.includes("operator/intersystems/") ||
    n.includes("operator/integrations/") ||
    n.includes("memory-health.mjs") ||
    n.includes("provider-health.mjs") ||
    n.includes("health-scaffold.mjs") ||
    n.includes("emit-runtime-plan.mjs") ||
    n.includes("operator/founder/founder-health.mjs") ||
    n.includes("load-founder-context.mjs") ||
    n.includes("provider-routing.mjs") ||
    n.includes("sts-check.mjs") ||
    n.includes("ecs-list.mjs") ||
    n.includes("ecr-list.mjs") ||
    n.includes("cloudwatch-tail-scaffold.mjs")
  ) {
    return "SAFE";
  }
  if (n.includes("operator/dashboard/")) {
    return "ELEVATED";
  }
  return "ELEVATED";
}

const script = process.argv[2] || "";
if (!script) {
  process.stderr.write("usage: approval-engine.mjs <scriptPath>\n");
  process.exit(1);
}
const rel = path.isAbsolute(script) ? path.relative(process.cwd(), script) : script;
const tier = tierForScript(rel);
const max = process.env.OPERATOR_MAX_APPROVAL?.trim() || "SAFE";

const order = { SAFE: 0, ELEVATED: 1, ADMIN: 2, AUTONOMOUS: 3 };
if ((order[tier] ?? 99) > (order[max] ?? 0)) {
  process.stderr.write(`BLOCKED tier=${tier} max=${max} script=${rel}\n`);
  process.exit(2);
}
process.stdout.write(`OK tier=${tier} script=${rel}\n`);
