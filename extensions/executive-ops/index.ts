import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createExecutiveGithubSnapshotTool } from "./src/executive-github-snapshot-tool.js";
import { createExecutiveRepoPlanTool } from "./src/executive-repo-plan-tool.js";
import { createExecutiveSpeakTool } from "./src/executive-speak-tool.js";
import { createExecutiveStatusTool } from "./src/executive-status-tool.js";
import { buildExecutiveGithubSnapshot } from "./src/github.js";
import { buildExecutiveStatus } from "./src/status.js";

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default definePluginEntry({
  id: "executive-ops",
  name: "Executive ops",
  description:
    "Executive control-plane contracts, GitHub/Cursor milestone helpers, governance defaults, and status surfaces.",
  register(api) {
    api.registerTool((ctx) => createExecutiveStatusTool(api, ctx), {
      name: "executive_status",
    });
    api.registerTool((ctx) => createExecutiveGithubSnapshotTool(api, ctx), {
      name: "executive_github_snapshot",
    });
    api.registerTool((ctx) => createExecutiveRepoPlanTool(api, ctx), {
      name: "executive_repo_plan",
    });
    api.registerTool((ctx) => createExecutiveSpeakTool(api, ctx), {
      name: "executive_speak",
    });
    api.registerGatewayMethod(
      "executive.status",
      async ({ respond }) => {
        try {
          respond(true, buildExecutiveStatus(api), undefined);
        } catch (error) {
          respond(false, undefined, {
            code: "internal_error",
            message: formatError(error),
          });
        }
      },
      { scope: "operator.read" },
    );
    api.registerGatewayMethod(
      "executive.githubSnapshot",
      async ({ params, respond }) => {
        try {
          const repo = typeof params.repo === "string" ? params.repo : undefined;
          const limit = typeof params.limit === "number" ? params.limit : undefined;
          const includeWorkflows =
            typeof params.includeWorkflows === "boolean" ? params.includeWorkflows : undefined;
          respond(
            true,
            await buildExecutiveGithubSnapshot({
              api,
              ...(repo ? { repo } : {}),
              ...(limit !== undefined ? { limit } : {}),
              ...(includeWorkflows !== undefined ? { includeWorkflows } : {}),
            }),
            undefined,
          );
        } catch (error) {
          respond(false, undefined, {
            code: "internal_error",
            message: formatError(error),
          });
        }
      },
      { scope: "operator.read" },
    );
  },
});
