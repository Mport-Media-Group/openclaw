/**
 * JSONL append-only store under operator/memory/data/
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");

function ensureDir() {
  fs.mkdirSync(dataDir, { recursive: true });
}

export function appendRecord(namespace, record) {
  ensureDir();
  const line = `${JSON.stringify({ t: new Date().toISOString(), ...record })}\n`;
  const file = path.join(dataDir, `${namespace}.jsonl`);
  fs.appendFileSync(file, line, "utf8");
}

export function readRecords(namespace, maxLines = 500) {
  const file = path.join(dataDir, `${namespace}.jsonl`);
  if (!fs.existsSync(file)) {
    return [];
  }
  const lines = fs.readFileSync(file, "utf8").trim().split("\n").filter(Boolean);
  const slice = lines.slice(-maxLines);
  return slice.map((l) => JSON.parse(l));
}
