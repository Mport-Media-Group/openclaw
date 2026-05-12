import fs from "node:fs";
import path from "node:path";
import type { OpenClawPluginToolContext } from "openclaw/plugin-sdk/plugin-entry";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

export type OperatorStackPluginConfig = {
  stackRoot?: string;
};

function readPluginEntryConfig(
  api: OpenClawPluginApi,
  ctx?: OpenClawPluginToolContext,
): OperatorStackPluginConfig {
  const cfg = ctx?.getRuntimeConfig?.() ?? ctx?.runtimeConfig ?? ctx?.config ?? api.config;
  const entries = (
    cfg as {
      plugins?: { entries?: Record<string, { config?: OperatorStackPluginConfig }> };
    }
  ).plugins?.entries;
  return entries?.["operator-stack"]?.config ?? {};
}

export function resolveOperatorStackRoot(
  api: OpenClawPluginApi,
  ctx?: OpenClawPluginToolContext,
): string | null {
  const fromConfig = readPluginEntryConfig(api, ctx).stackRoot?.trim();
  if (fromConfig) {
    return path.resolve(fromConfig);
  }
  const fromEnv = process.env.OPENCLAW_OPERATOR_STACK_ROOT?.trim();
  if (fromEnv) {
    return path.resolve(fromEnv);
  }
  const cwdGuess = path.resolve(process.cwd(), "operator");
  if (fs.existsSync(path.join(cwdGuess, "configs", "models.json"))) {
    return cwdGuess;
  }
  return null;
}

/**
 * Resolve `relativePath` under `root` and reject traversal outside `root`.
 */
export function safeResolvedPathUnderRoot(root: string, relativePath: string): string | null {
  const raw = relativePath.trim();
  if (!raw) {
    return null;
  }
  if (path.isAbsolute(raw)) {
    return null;
  }
  const trimmed = raw.replace(/^[/\\]+/u, "");
  if (!trimmed) {
    return null;
  }
  if (path.isAbsolute(trimmed)) {
    return null;
  }
  const segments = trimmed.split(/[/\\]/u);
  if (segments.some((s) => s === "..")) {
    return null;
  }
  const joined = path.resolve(root, ...segments);
  const rootResolved = path.resolve(root);
  if (joined === rootResolved) {
    return null;
  }
  const rel = path.relative(rootResolved, joined);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return null;
  }
  return joined;
}
