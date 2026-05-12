/**
 * Sequential load of founder operational identity (low RAM: one file at a time).
 * Process-local cache; use reloadFounderContext() to invalidate.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {null | { profile: object, runtimePreferences: object, deploymentConstraints: object, strategicGoals: object, markdown: Record<string, string> }} */
let cached = null;

const MD_FILES = [
  "engineering-principles.md",
  "architecture-philosophy.md",
  "communication-style.md",
];

function readUtf8(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

/**
 * @returns {{ profile: object, runtimePreferences: object, deploymentConstraints: object, strategicGoals: object, markdown: Record<string, string> }}
 */
export function loadFounderContextSync() {
  if (cached) {
    return cached;
  }
  const profile = JSON.parse(readUtf8(path.join(__dirname, "founder-profile.json")));
  const runtimePreferences = JSON.parse(readUtf8(path.join(__dirname, "runtime-preferences.json")));
  const deploymentConstraints = JSON.parse(
    readUtf8(path.join(__dirname, "deployment-constraints.json")),
  );
  const strategicGoals = JSON.parse(readUtf8(path.join(__dirname, "strategic-goals.json")));

  /** @type {Record<string, string>} */
  const markdown = {};
  for (const name of MD_FILES) {
    const base = name.replace(/\.md$/u, "");
    markdown[base] = readUtf8(path.join(__dirname, name));
  }

  cached = {
    profile,
    runtimePreferences,
    deploymentConstraints,
    strategicGoals,
    markdown,
  };
  return cached;
}

export function reloadFounderContext() {
  cached = null;
  return loadFounderContextSync();
}

const MD_PREVIEW = 600;

/**
 * Small derived object for Sasha health JSON and runtime plans (no full markdown bodies).
 */
export function getFounderContextSummary() {
  try {
    const c = loadFounderContextSync();
    const id = c.profile?.identity ?? {};
    const prefs = c.runtimePreferences?.preferences ?? {};
    const gov = c.deploymentConstraints?.governance ?? {};
    const hierarchy = (c.strategicGoals?.productHierarchy ?? []).map(
      (/** @type {{ name?: string, role?: string }} */ h) => ({
        name: h.name,
        role: h.role,
      }),
    );
    return {
      ok: true,
      version: c.profile?.version ?? 1,
      founderName: id.name,
      organizationsCount: Array.isArray(id.organizations) ? id.organizations.length : 0,
      cloudPrimary: c.runtimePreferences?.cloudPrimary ?? null,
      preferCloudReasoning: prefs.heavyReasoning === "cloud_first",
      approvalGatedMutations: gov.approvalGatedMutations === true,
      productHierarchy: hierarchy.slice(0, 4),
      gtm: c.strategicGoals?.goToMarket?.primary ?? null,
      markdownChars: Object.values(c.markdown ?? {}).reduce((n, s) => n + s.length, 0),
      engineeringPreview: (c.markdown?.["engineering-principles"] ?? "").slice(0, MD_PREVIEW),
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
