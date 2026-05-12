import fs from "node:fs/promises";
import type { OpenClawPluginToolContext } from "openclaw/plugin-sdk/plugin-entry";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/provider-web-search";
import { Type } from "typebox";
import { resolveOperatorStackRoot, safeResolvedPathUnderRoot } from "./resolve-stack-root.js";

const OperatorStackReadSchema = Type.Object(
  {
    relativePath: Type.String({
      description:
        'Relative path under the operator stack root (for example "configs/models.json").',
    }),
  },
  { additionalProperties: false },
);

export function createOperatorStackReadTool(
  api: OpenClawPluginApi,
  ctx?: OpenClawPluginToolContext,
) {
  return {
    name: "operator_stack_read",
    label: "Operator stack read",
    description:
      "Read a UTF-8 text file from the configured operator stack root (configs, registry, docs). Paths must stay under the root.",
    parameters: OperatorStackReadSchema,
    execute: async (_toolCallId: string, rawParams: Record<string, unknown>) => {
      const relativePath = readStringParam(rawParams, "relativePath", { required: true });
      const root = resolveOperatorStackRoot(api, ctx);
      if (!root) {
        return jsonResult({
          ok: false,
          error:
            'Operator stack root is not configured. Set plugins.entries["operator-stack"].config.stackRoot or OPENCLAW_OPERATOR_STACK_ROOT.',
        });
      }
      const absolute = safeResolvedPathUnderRoot(root, relativePath);
      if (!absolute) {
        return jsonResult({
          ok: false,
          error:
            "Invalid relativePath (must be non-empty, relative, and cannot escape the stack root).",
        });
      }
      try {
        const text = await fs.readFile(absolute, "utf8");
        return jsonResult({
          ok: true,
          path: absolute,
          text,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return jsonResult({
          ok: false,
          path: absolute,
          error: message,
        });
      }
    },
  };
}
