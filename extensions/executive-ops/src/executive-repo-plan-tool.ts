import type { OpenClawPluginToolContext } from "openclaw/plugin-sdk/plugin-entry";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/provider-web-search";
import { Type } from "typebox";
import { buildExecutiveStatus } from "./status.js";

const SURFACES = [
  "executive",
  "github",
  "cursor",
  "dashboard",
  "memory",
  "governance",
  "browser",
  "dcb",
] as const;

type ExecutivePlanSurface = (typeof SURFACES)[number];

const ExecutiveRepoPlanSchema = Type.Object(
  {
    goal: Type.String({
      description: "Short description of the repo task or operating goal.",
    }),
    surface: Type.Optional(
      Type.String({
        description:
          "Focus surface: executive, github, cursor, dashboard, memory, governance, browser, or dcb.",
      }),
    ),
    includeApprovals: Type.Optional(
      Type.Boolean({
        description: "Include approval classes that should gate mutating steps.",
      }),
    ),
  },
  { additionalProperties: false },
);

function normalizeSurface(value: string | undefined): ExecutivePlanSurface {
  if (value && SURFACES.includes(value as ExecutivePlanSurface)) {
    return value as ExecutivePlanSurface;
  }
  return "executive";
}

function buildPlanSteps(surface: ExecutivePlanSurface, goal: string) {
  switch (surface) {
    case "github":
      return [
        `Confirm repository scope and open risks for: ${goal}.`,
        "Pull a read-only GitHub snapshot and summarize open issues, pull requests, and failing workflows.",
        "Draft the implementation plan, test proof, and review watch criteria before any write action.",
        "Gate mutating actions behind GitHub write approvals and keep summary jobs unattended.",
      ];
    case "cursor":
      return [
        `Validate Cursor ACP prerequisites for: ${goal}.`,
        "Confirm acpx is enabled, the cursor harness is available, and the working directory is correct.",
        "Prepare the ACP spawn payload, runtime settings, and follow-up steering strategy.",
        "Escalate write-heavy coding actions through the configured approval class before execution.",
      ];
    case "dashboard":
      return [
        `Define the operator-facing dashboard slice for: ${goal}.`,
        "Start with native Control UI overview surfaces instead of a separate dashboard runtime.",
        "Expose executive health, approvals, GitHub/Cursor state, and durable memory readiness.",
        "Add focused UI proof after wiring the gateway status payload.",
      ];
    case "memory":
      return [
        `Define the durable memory contract for: ${goal}.`,
        "Wire Supabase env references, table/schema defaults, and bounded local cache behavior.",
        "Separate durable goal memory from transient session context and short-lived local state.",
        "Require proof that secret refs are present before enabling memory jobs.",
      ];
    case "governance":
      return [
        `Define approval gates and role policy for: ${goal}.`,
        "List the mutating actions, required approval classes, and who may invoke each integration.",
        "Keep audit mode append-only and normalize role permissions before broadening automation.",
        "Verify unattended reads still work when write approvals remain blocked.",
      ];
    case "browser":
      return [
        `Constrain browser automation for: ${goal}.`,
        "Use the bundled browser plugin instead of standing up a second Playwright control plane.",
        "Preserve LinkedIn as drafts-only and human-sent, and prefer API/CLI paths when they exist.",
        "Keep browser profiles isolated by surface and approval-gate any authenticated mutations.",
      ];
    case "dcb":
      return [
        `Scope DCB-specific intelligence and monitoring for: ${goal}.`,
        "Model GCP, Firebase, Cloud Run, investor, and compliance monitors as plugin-owned modules.",
        "Keep governance-first rules explicit so DCB logic does not leak into core runtime code.",
        "Start with health/reporting probes before any mutating deployment automation.",
      ];
    case "executive":
    default:
      return [
        `Clarify the milestone and operating goal for: ${goal}.`,
        "Reuse executive-ops config, task-flow ownership, GitHub/Cursor helpers, and Control UI status surfaces.",
        "Separate read-only monitoring from approval-gated mutations before enabling unattended workflows.",
        "Finish with scoped proof: GitHub snapshot, Cursor readiness, dashboard render, and approval contract.",
      ];
  }
}

function approvalClassesFor(surface: ExecutivePlanSurface): string[] {
  switch (surface) {
    case "github":
      return ["githubWrites"];
    case "cursor":
      return ["cursorWrites"];
    case "dashboard":
      return [];
    case "memory":
      return ["credentialChanges"];
    case "governance":
      return ["credentialChanges", "deploymentPushes", "legalDocs"];
    case "browser":
      return ["publicPosts", "investorMessaging"];
    case "dcb":
      return ["deploymentPushes", "legalDocs"];
    case "executive":
    default:
      return ["githubWrites", "cursorWrites", "deploymentPushes"];
  }
}

export function createExecutiveRepoPlanTool(
  api: OpenClawPluginApi,
  ctx?: OpenClawPluginToolContext,
) {
  return {
    name: "executive_repo_plan",
    label: "Executive repo plan",
    description:
      "Generate a deterministic implementation checklist for a GitHub/Cursor/memory/dashboard/governance milestone using the executive-ops control-plane defaults.",
    parameters: ExecutiveRepoPlanSchema,
    execute: async (_toolCallId: string, rawParams: Record<string, unknown>) => {
      const goal = readStringParam(rawParams, "goal", { required: true });
      const surface = normalizeSurface(readStringParam(rawParams, "surface"));
      const includeApprovals =
        typeof rawParams.includeApprovals === "boolean" ? rawParams.includeApprovals : true;
      const status = buildExecutiveStatus(api, ctx);
      return jsonResult({
        ok: true,
        goal,
        surface,
        steps: buildPlanSteps(surface, goal).map((step, index) => ({
          order: index + 1,
          step,
        })),
        approvalClasses: includeApprovals ? approvalClassesFor(surface) : [],
        controller: status.controller,
        usesExistingSeams: [
          "task flows",
          "ACP sessions",
          "cron wakeups",
          "Control UI overview",
          "browser plugin",
        ],
      });
    },
  };
}
