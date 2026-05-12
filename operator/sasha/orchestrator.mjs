/**
 * Sasha orchestration metadata (not a second gateway).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const operatorRoot = path.resolve(__dirname, "..");

export function loadAgentRegistry() {
  const p = path.join(operatorRoot, "agents", "registry.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

export function findAgent(registry, id) {
  return registry.agents?.find((a) => a.id === id || a.openclawAgentName === id);
}
