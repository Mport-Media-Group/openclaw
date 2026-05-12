import { getFounderContextSummary } from "../founder/load-founder-context.mjs";
import { loadAgentRegistry } from "./orchestrator.mjs";

export function buildDelegationGraph() {
  const reg = loadAgentRegistry();
  const nodes = (reg.agents ?? []).map((a) => ({
    id: a.id,
    name: a.openclawAgentName,
    approval: a.defaultApproval ?? "SAFE",
  }));
  const founder = getFounderContextSummary();
  return {
    version: reg.version ?? 1,
    nodes,
    edges: [],
    founder: founder.ok
      ? {
          founderName: founder.founderName,
          cloudPrimary: founder.cloudPrimary,
          preferCloudReasoning: founder.preferCloudReasoning,
          approvalGatedMutations: founder.approvalGatedMutations,
          productHierarchy: founder.productHierarchy,
          gtm: founder.gtm,
        }
      : { ok: false, error: founder.error },
  };
}
