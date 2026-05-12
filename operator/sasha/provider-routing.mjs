/**
 * Sasha-side provider routing hints (metadata only; sequential callers).
 */
import { getFounderContextSummary } from "../founder/load-founder-context.mjs";
import { getOperatorEnvHealth } from "../integrations/health-scaffold.mjs";
import { loadModelsManifest } from "../runtime/provider-health.mjs";
import {
  buildProviderExecutionPlan,
  providerScores,
  RETRY_POLICY,
  SEQUENTIAL_EXECUTION_POLICY,
} from "../runtime/provider-router.mjs";
import { loadAgentRegistry } from "./orchestrator.mjs";

/** Minimum delay between heavy operator steps (thermal hint, ms). */
export const THERMAL_MIN_GAP_MS = 750;

/**
 * @param {{ ollamaReachable: boolean, role?: string, promptChars?: number }} ctx
 */
export function buildSashaProviderRouting(ctx) {
  const manifest = loadModelsManifest();
  const reg = loadAgentRegistry();
  const env = getOperatorEnvHealth().env;
  const role = ctx.role ?? "coding";
  const plan = buildProviderExecutionPlan(manifest, role, {
    ollamaReachable: ctx.ollamaReachable,
    env,
    promptChars: ctx.promptChars,
  });
  const founder = getFounderContextSummary();
  return {
    version: reg.version ?? 1,
    scores: providerScores({ ollamaReachable: ctx.ollamaReachable }),
    plan,
    thermalMinGapMs: THERMAL_MIN_GAP_MS,
    retryPolicy: RETRY_POLICY,
    policy: SEQUENTIAL_EXECUTION_POLICY,
    founder: founder.ok
      ? {
          preferCloudReasoning: founder.preferCloudReasoning,
          cloudPrimary: founder.cloudPrimary,
          approvalGatedMutations: founder.approvalGatedMutations,
        }
      : { ok: false, error: founder.error },
  };
}
