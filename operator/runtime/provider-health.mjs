/**
 * Provider presence (set/unset only). Extends operator env key checks + Ollama reachability.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getOperatorEnvHealth } from "../integrations/health-scaffold.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const operatorRoot = path.resolve(__dirname, "..");

export async function getOllamaReachable() {
  const base = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
  try {
    const res = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(3000) });
    return { ok: res.ok, base };
  } catch {
    return { ok: false, base };
  }
}

/**
 * Optional live probes (no response bodies; drain streams). Gated by OPERATOR_PROVIDER_PROBE=1.
 */
export async function getOptionalConnectivityProbes() {
  if (process.env.OPERATOR_PROVIDER_PROBE !== "1") {
    return { probesEnabled: false };
  }
  const out = { probesEnabled: true };

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/models?limit=1", {
        method: "GET",
        headers: { Authorization: `Bearer ${openaiKey}` },
        signal: AbortSignal.timeout(8000),
      });
      out.openai = { ok: res.ok, status: res.status };
      await res.arrayBuffer().catch(() => {});
    } catch (e) {
      out.openai = { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  } else {
    out.openai = { skipped: true };
  }

  const hf = process.env.HF_TOKEN?.trim() || process.env.HUGGINGFACE_HUB_TOKEN?.trim() || "";
  if (hf) {
    try {
      const res = await fetch("https://huggingface.co/api/models/gpt2", {
        headers: { Authorization: `Bearer ${hf}` },
        signal: AbortSignal.timeout(8000),
      });
      out.huggingface = { ok: res.ok, status: res.status };
      await res.arrayBuffer().catch(() => {});
    } catch (e) {
      out.huggingface = { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  } else {
    out.huggingface = { skipped: true };
  }

  out.anthropic = { skipped: true, note: "no minimal public probe wired" };
  out.google = { skipped: true, note: "use gateway for Gemini connectivity" };

  return out;
}

export async function getProviderHealthSummary() {
  const env = getOperatorEnvHealth();
  const ollama = await getOllamaReachable();
  const probes = await getOptionalConnectivityProbes();
  return {
    ok: true,
    env: env.env,
    ollama: { reachable: ollama.ok, base: ollama.base },
    probes,
  };
}

export function loadModelsManifest() {
  const p = path.join(operatorRoot, "configs", "models.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const s = await getProviderHealthSummary();
  process.stdout.write(`${JSON.stringify(s, null, 2)}\n`);
}
