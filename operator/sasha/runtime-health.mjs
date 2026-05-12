#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getFounderContextSummary } from "../founder/load-founder-context.mjs";
import { getOllamaReachable, getProviderHealthSummary } from "../runtime/provider-health.mjs";
import { buildSashaProviderRouting } from "./provider-routing.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const reportsDir = path.join(repoRoot, "operator", "reports");
const outPath = path.join(reportsDir, "runtime-health-out.json");

async function memorySummary() {
  const dataDir = path.join(repoRoot, "operator", "memory", "data");
  if (!fs.existsSync(dataDir)) {
    return { bytes: 0 };
  }
  let b = 0;
  for (const f of fs.readdirSync(dataDir)) {
    const st = fs.statSync(path.join(dataDir, f));
    if (st.isFile()) {
      b += st.size;
    }
  }
  return { bytes: b };
}

const providers = await getProviderHealthSummary();
const ollama = await getOllamaReachable();
const routing = buildSashaProviderRouting({ ollamaReachable: ollama.ok });
const memory = await memorySummary();
const founder = getFounderContextSummary();
const out = { ok: true, providers, routing, founder, memory, at: new Date().toISOString() };
fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
