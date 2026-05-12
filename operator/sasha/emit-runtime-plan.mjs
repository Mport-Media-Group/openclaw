#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDelegationGraph } from "./delegation-engine.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const out = path.join(repoRoot, "operator", "reports", "sasha-runtime-plan.json");
const graph = buildDelegationGraph();
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(graph, null, 2)}\n`);
process.stdout.write(`Wrote ${path.relative(repoRoot, out)}\n`);
