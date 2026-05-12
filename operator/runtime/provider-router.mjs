/**
 * Operator-local routing hints (not OpenClaw authoritative config).
 * @typedef {{ local?: Record<string, string>, cloud?: Record<string, string> }} ModelsManifest
 * @typedef {Record<string, "set" | "unset">} EnvPresence
 */

const DEFAULT_TIMEOUT_MS = 60_000;
const TOKEN_BUDGET_HINTS = {
  localSmall: 2048,
  cloudReasoning: 8192,
};

/** Bounded retries for operator-side callers (sequential backoff between attempts). */
export const RETRY_POLICY = {
  maxAttempts: 3,
  backoffMsBase: 1500,
  maxBackoffMs: 8000,
};

/** Callers must await one provider at a time; do not use Promise.all for multi-provider calls. */
export const SEQUENTIAL_EXECUTION_POLICY =
  "Await providers in plan order only; one in-flight request per thermal budget.";

const CLOUD_FALLBACK_ORDER = ["openai", "anthropic", "google", "huggingface"];

/**
 * @param {ModelsManifest} manifest
 * @param {string} role
 * @returns {string | undefined}
 */
export function pickLocalModelId(manifest, role) {
  return manifest?.local?.[role];
}

/**
 * @param {ModelsManifest} manifest
 * @param {string} role
 * @returns {string | undefined}
 */
export function pickCloudModelId(manifest, role) {
  return manifest?.cloud?.[role];
}

/**
 * @param {{ localAvailable?: boolean, promptChars?: number }} params
 */
export function shouldEscalateToCloud(params) {
  if (params.localAvailable === false) {
    return true;
  }
  if ((params.promptChars ?? 0) > 6000) {
    return true;
  }
  return false;
}

export function requestTimeouts() {
  return {
    localMs: DEFAULT_TIMEOUT_MS,
    cloudMs: DEFAULT_TIMEOUT_MS * 2,
  };
}

export function tokenBudgetHints() {
  return { ...TOKEN_BUDGET_HINTS };
}

/**
 * Static score for ordering (higher = try earlier). Not latency measurements.
 * @param {{ ollamaReachable?: boolean }} ctx
 */
export function providerScores(ctx) {
  const ollama = ctx.ollamaReachable ? 100 : 0;
  return [
    {
      id: "ollama",
      score: ollama,
      note: ollama ? "local daemon reachable" : "ollama down or unknown",
    },
    { id: "openai", score: 70, note: "cloud fallback" },
    { id: "anthropic", score: 68, note: "cloud fallback" },
    { id: "google", score: 66, note: "gemini / google ai" },
    { id: "huggingface", score: 50, note: "hf hub" },
  ];
}

/**
 * @param {EnvPresence} env
 */
export function defaultCloudFallbackOrder(env) {
  const out = [];
  for (const id of CLOUD_FALLBACK_ORDER) {
    if (id === "openai" && env.OPENAI_API_KEY === "set") {
      out.push(id);
    }
    if (id === "anthropic" && env.ANTHROPIC_API_KEY === "set") {
      out.push(id);
    }
    if (id === "google" && (env.GOOGLE_API_KEY === "set" || env.GEMINI_API_KEY === "set")) {
      out.push(id);
    }
    if (id === "huggingface" && (env.HF_TOKEN === "set" || env.HUGGINGFACE_HUB_TOKEN === "set")) {
      out.push(id);
    }
  }
  return out;
}

/**
 * Ordered execution hints for one role (local-first, then env-gated cloud keys).
 * @param {ModelsManifest} manifest
 * @param {string} role
 * @param {{ ollamaReachable: boolean, env: EnvPresence, promptChars?: number }} ctx
 */
export function buildProviderExecutionPlan(manifest, role, ctx) {
  const timeouts = requestTimeouts();
  const sequence = [];
  const localId = pickLocalModelId(manifest, role);
  const hasLocal = Boolean(localId && ctx.ollamaReachable);
  if (hasLocal) {
    sequence.push({
      provider: "ollama",
      modelId: localId,
      timeoutMs: timeouts.localMs,
      tokenBudget: tokenBudgetHints().localSmall,
    });
  }
  const cloudId = pickCloudModelId(manifest, role);
  const escalate = shouldEscalateToCloud({
    localAvailable: hasLocal,
    promptChars: ctx.promptChars,
  });
  const needCloud = Boolean(cloudId) && (!hasLocal || escalate);
  if (needCloud) {
    for (const p of defaultCloudFallbackOrder(ctx.env)) {
      sequence.push({
        provider: p,
        modelId: cloudId,
        timeoutMs: timeouts.cloudMs,
        tokenBudget: tokenBudgetHints().cloudReasoning,
      });
    }
  }
  return {
    role,
    sequence,
    policy: SEQUENTIAL_EXECUTION_POLICY,
    retry: RETRY_POLICY,
    escalateToCloud: escalate,
  };
}
