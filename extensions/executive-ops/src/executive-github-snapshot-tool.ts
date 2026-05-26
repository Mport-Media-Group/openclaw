import type { OpenClawPluginToolContext } from "openclaw/plugin-sdk/plugin-entry";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/provider-web-search";
import { Type } from "typebox";
import { buildExecutiveGithubSnapshot } from "./github.js";

const ExecutiveGithubSnapshotSchema = Type.Object(
  {
    repo: Type.Optional(
      Type.String({
        description: "Optional owner/repo override. Defaults to executive-ops github.repository.",
      }),
    ),
    limit: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        description: "Maximum issues, pull requests, and workflow runs to sample.",
      }),
    ),
    includeWorkflows: Type.Optional(
      Type.Boolean({
        description: "Include recent GitHub Actions workflow runs in the snapshot.",
      }),
    ),
  },
  { additionalProperties: false },
);

export function createExecutiveGithubSnapshotTool(
  api: OpenClawPluginApi,
  ctx?: OpenClawPluginToolContext,
) {
  return {
    name: "executive_github_snapshot",
    label: "Executive GitHub snapshot",
    description:
      "Fetch a lightweight GitHub executive snapshot for the configured repository: repo metadata, open issues, pull requests, recent workflows, and auth warnings.",
    parameters: ExecutiveGithubSnapshotSchema,
    execute: async (_toolCallId: string, rawParams: Record<string, unknown>) => {
      const repo = readStringParam(rawParams, "repo");
      const limit =
        typeof rawParams.limit === "number" && Number.isFinite(rawParams.limit)
          ? rawParams.limit
          : undefined;
      const includeWorkflows =
        typeof rawParams.includeWorkflows === "boolean" ? rawParams.includeWorkflows : undefined;
      return jsonResult(
        await buildExecutiveGithubSnapshot({
          api,
          ctx,
          ...(repo ? { repo } : {}),
          ...(limit !== undefined ? { limit } : {}),
          ...(includeWorkflows !== undefined ? { includeWorkflows } : {}),
        }),
      );
    },
  };
}
