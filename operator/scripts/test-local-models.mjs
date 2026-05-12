#!/usr/bin/env node
/**
 * Sequential Ollama probe (delegates to runtime/ollama-health.mjs).
 * Writes operator/reports/ollama-model-check.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ollamaHealthHasFailures, runOllamaHealthCheck } from "../runtime/ollama-health.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const reportsDir = path.join(repoRoot, "operator", "reports");
const outJson = path.join(reportsDir, "ollama-model-check.json");

const results = await runOllamaHealthCheck();
fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(results, null, 2)}\n`);
process.stdout.write(`Wrote ${path.relative(repoRoot, outJson)}\n`);

if (results.error) {
  process.stderr.write(`${results.error}\n`);
  process.exit(1);
}
process.exit(ollamaHealthHasFailures(results) ? 1 : 0);
