import type { OpenClawPluginToolContext } from "openclaw/plugin-sdk/plugin-entry";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";
import { jsonResult } from "openclaw/plugin-sdk/provider-web-search";
import { Type } from "typebox";
import { buildExecutiveStatus } from "./status.js";

const ExecutiveStatusSchema = Type.Object({}, { additionalProperties: false });

export function createExecutiveStatusTool(api: OpenClawPluginApi, ctx?: OpenClawPluginToolContext) {
  return {
    name: "executive_status",
    label: "Executive status",
    description:
      "Summarize executive-ops readiness: controller ownership, GitHub/Cursor milestone state, 1Password contract, Supabase memory wiring, governance defaults, and later-stage browser/DCB surfaces.",
    parameters: ExecutiveStatusSchema,
    execute: async () => jsonResult(buildExecutiveStatus(api, ctx)),
  };
}
