import fs from "node:fs/promises";
import type { OpenClawPluginToolContext } from "openclaw/plugin-sdk/plugin-entry";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";
import { jsonResult } from "openclaw/plugin-sdk/provider-web-search";
import { Type } from "typebox";
import { resolveOperatorStackRoot, safeResolvedPathUnderRoot } from "./resolve-stack-root.js";

const OperatorModelsSchema = Type.Object({}, { additionalProperties: false });

type ModelsShape = {
  local?: Record<string, string>;
  cloud?: Record<string, string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function coerceStringMap(
  o: Record<string, unknown> | undefined,
  label: string,
): { value?: Record<string, string>; error?: string } {
  if (o === undefined) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) {
    if (typeof v !== "string" || !v.trim()) {
      return { error: `models.json ${label} role "${k}" must map to a non-empty string.` };
    }
    out[k] = v.trim();
  }
  return { value: out };
}

function validateModelsJson(
  parsed: unknown,
): { ok: true; data: ModelsShape } | { ok: false; error: string } {
  if (!isRecord(parsed)) {
    return { ok: false, error: "models.json must be a JSON object." };
  }
  const localRaw = parsed.local;
  const cloudRaw = parsed.cloud;
  if (localRaw !== undefined && !isRecord(localRaw)) {
    return {
      ok: false,
      error: 'models.json "local" must be an object of string roles to model ids.',
    };
  }
  if (cloudRaw !== undefined && !isRecord(cloudRaw)) {
    return {
      ok: false,
      error: 'models.json "cloud" must be an object of string roles to model ids.',
    };
  }
  const l = coerceStringMap(localRaw, "local");
  if (l.error) {
    return { ok: false, error: l.error };
  }
  const c = coerceStringMap(cloudRaw, "cloud");
  if (c.error) {
    return { ok: false, error: c.error };
  }
  return {
    ok: true,
    data: {
      ...(l.value ? { local: l.value } : {}),
      ...(c.value ? { cloud: c.value } : {}),
    },
  };
}

export function createOperatorModelsTool(api: OpenClawPluginApi, ctx?: OpenClawPluginToolContext) {
  return {
    name: "operator_stack_models",
    label: "Operator stack models",
    description:
      'Parse operator/configs/models.json under the stack root and return validated "local" and "cloud" role maps.',
    parameters: OperatorModelsSchema,
    execute: async () => {
      const root = resolveOperatorStackRoot(api, ctx);
      if (!root) {
        return jsonResult({
          ok: false,
          error:
            'Operator stack root is not configured. Set plugins.entries["operator-stack"].config.stackRoot or OPENCLAW_OPERATOR_STACK_ROOT.',
        });
      }
      const absolute = safeResolvedPathUnderRoot(root, "configs/models.json");
      if (!absolute) {
        return jsonResult({
          ok: false,
          error: "Could not resolve configs/models.json under stack root.",
        });
      }
      try {
        const raw = await fs.readFile(absolute, "utf8");
        const parsed: unknown = JSON.parse(raw) as unknown;
        const checked = validateModelsJson(parsed);
        if (!checked.ok) {
          return jsonResult({ ok: false, path: absolute, error: checked.error });
        }
        return jsonResult({
          ok: true,
          path: absolute,
          models: checked.data,
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
