#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { embeddingsStatus } from "./embeddings.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const repoRoot = path.resolve(__dirname, "../..");
const reportsDir = path.join(repoRoot, "operator", "reports");
const outPath = path.join(reportsDir, "memory-health-out.json");

function dirBytes(dir) {
  if (!fs.existsSync(dir)) {
    return 0;
  }
  let n = 0;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isFile()) {
      n += st.size;
    }
  }
  return n;
}

function fileBytesMap(dir) {
  if (!fs.existsSync(dir)) {
    return {};
  }
  /** @type {Record<string, number>} */
  const m = {};
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isFile()) {
      m[name] = st.size;
    }
  }
  return m;
}

const summary = {
  ok: true,
  dataDir,
  bytesApprox: dirBytes(dataDir),
  namespaces: fileBytesMap(dataDir),
  chromaConfigured: Boolean(process.env.OPERATOR_CHROMA_URL?.trim()),
  embeddings: embeddingsStatus(),
};

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
