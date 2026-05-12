/**
 * Sequential Ollama health: /api/tags + one tiny generate per minimal model.
 * Bounded retries, thermal-friendly delays, no parallel loads.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

export const OLLAMA_MINIMAL_MODELS = ["qwen2.5:3b", "deepseek-coder:1.3b", "gemma:2b"];

const DEFAULT_TAGS_TIMEOUT_MS = 15_000;
const DEFAULT_GENERATE_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_BACKOFF_MS = 1200;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * @param {string} url
 * @param {number} timeoutMs
 */
async function getJson(url, timeoutMs) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text.slice(0, 200) };
    }
    return { ok: res.ok, status: res.status, body };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      body: {},
      networkError: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * @param {string} base
 * @param {string} model
 * @param {number} timeoutMs
 */
async function postGenerateOnce(base, model, timeoutMs) {
  const mem0 = process.memoryUsage();
  const t0 = Date.now();
  try {
    const res = await fetch(`${base}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: "Say OK in one word.",
        stream: false,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    const t1 = Date.now();
    const mem1 = process.memoryUsage();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text.slice(0, 300) };
    }
    return {
      ok: res.ok,
      status: res.status,
      latencyMs: t1 - t0,
      rssDeltaMb: ((mem1.rss - mem0.rss) / (1024 * 1024)).toFixed(2),
      responsePreview: typeof body.response === "string" ? body.response.slice(0, 120) : undefined,
    };
  } catch (e) {
    const t1 = Date.now();
    const mem1 = process.memoryUsage();
    return {
      ok: false,
      status: 0,
      latencyMs: t1 - t0,
      rssDeltaMb: ((mem1.rss - mem0.rss) / (1024 * 1024)).toFixed(2),
      networkError: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * @param {{
 *   base?: string,
 *   tagsTimeoutMs?: number,
 *   generateTimeoutMs?: number,
 *   maxRetries?: number,
 *   backoffMs?: number,
 * }} [opts]
 */
export async function runOllamaHealthCheck(opts = {}) {
  const base = opts.base ?? process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434";
  const tagsTimeoutMs = opts.tagsTimeoutMs ?? DEFAULT_TAGS_TIMEOUT_MS;
  const generateTimeoutMs = opts.generateTimeoutMs ?? DEFAULT_GENERATE_TIMEOUT_MS;
  const maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
  const backoffMs = opts.backoffMs ?? DEFAULT_BACKOFF_MS;

  const results = {
    base,
    startedAt: new Date().toISOString(),
    models: /** @type {Record<string, unknown>} */ ({}),
    tags: /** @type {{ ok: boolean, status?: number } | null} */ (null),
  };

  let tags = await getJson(`${base}/api/tags`, tagsTimeoutMs);
  results.tags = { ok: tags.ok, status: tags.status };
  if (tags.networkError) {
    results.error = `Ollama not reachable: ${tags.networkError}`;
    return results;
  }

  if (!tags.ok) {
    results.error = `Ollama not reachable: HTTP ${tags.status}`;
    return results;
  }

  const names = new Set(
    (tags.body.models ?? []).map((/** @type {{ name: string }} */ m) => m.name),
  );

  for (const model of OLLAMA_MINIMAL_MODELS) {
    if (!names.has(model)) {
      results.models[model] = { skipped: true, reason: "not in /api/tags" };
      continue;
    }
    let last = /** @type {unknown} */ (null);
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        await sleep(backoffMs * attempt);
      }
      last = await postGenerateOnce(base, model, generateTimeoutMs);
      if (last && typeof last === "object" && "ok" in last && last.ok) {
        break;
      }
    }
    results.models[model] = last;
  }

  return results;
}

export function ollamaHealthHasFailures(results) {
  if (results.error) {
    return true;
  }
  return Object.values(results.models).some(
    (m) => m && typeof m === "object" && "ok" in m && m.ok === false,
  );
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const reportsDir = path.join(repoRoot, "operator", "reports");
  const outJson = path.join(reportsDir, "ollama-health-out.json");
  const results = await runOllamaHealthCheck();
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(outJson, `${JSON.stringify(results, null, 2)}\n`);
  process.stdout.write(`Wrote ${path.relative(repoRoot, outJson)}\n`);
  process.exit(ollamaHealthHasFailures(results) ? 1 : 0);
}
