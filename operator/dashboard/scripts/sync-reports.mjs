#!/usr/bin/env node
/**
 * Copy operator health JSON from ../reports into public/data/ for the Vite app.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dashboardRoot = path.resolve(__dirname, "..");
const reportsDir = path.resolve(dashboardRoot, "../reports");
const outDir = path.join(dashboardRoot, "public", "data");

const names = [
  "runtime-health-out.json",
  "memory-health-out.json",
  "ollama-health-out.json",
  "intersystems-runtime-health-out.json",
  "last-validation.json",
];

fs.mkdirSync(outDir, { recursive: true });
let n = 0;
for (const name of names) {
  const src = path.join(reportsDir, name);
  const dest = path.join(outDir, name);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    n += 1;
  }
}
process.stdout.write(`sync-reports: copied ${n} file(s) -> public/data/\n`);
