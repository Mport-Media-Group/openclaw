import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGithubRateLimitTool } from "./github-rate-limit-tool.js";
import { createOperatorModelsTool } from "./operator-models-tool.js";
import { createOperatorStackReadTool } from "./operator-read-tool.js";
import { resolveOperatorStackRoot, safeResolvedPathUnderRoot } from "./resolve-stack-root.js";

function minimalApi(): import("openclaw/plugin-sdk/plugin-runtime").OpenClawPluginApi {
  return { config: {} } as import("openclaw/plugin-sdk/plugin-runtime").OpenClawPluginApi;
}

describe("operator-stack tools", () => {
  const priorFetch = global.fetch;
  let tmpRoot = "";

  beforeEach(async () => {
    vi.unstubAllEnvs();
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "operator-stack-"));
    await fs.mkdir(path.join(tmpRoot, "configs"), { recursive: true });
    await fs.writeFile(
      path.join(tmpRoot, "configs", "models.json"),
      JSON.stringify({
        local: { automation: "qwen2.5:3b" },
        cloud: { strategic: "gpt-5" },
      }),
      "utf8",
    );
    await fs.writeFile(path.join(tmpRoot, "note.txt"), "hello", "utf8");
  });

  afterEach(async () => {
    global.fetch = priorFetch;
    vi.unstubAllEnvs();
    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  it("safeResolvedPathUnderRoot rejects traversal", () => {
    const root = "/opt/stack";
    expect(safeResolvedPathUnderRoot(root, "../etc/passwd")).toBeNull();
    expect(safeResolvedPathUnderRoot(root, "configs/../../etc/passwd")).toBeNull();
    expect(safeResolvedPathUnderRoot(root, "/absolute")).toBeNull();
    expect(safeResolvedPathUnderRoot(root, "configs/models.json")).toBe(
      path.resolve("/opt/stack/configs/models.json"),
    );
  });

  it("resolveOperatorStackRoot prefers env over cwd guess", () => {
    vi.stubEnv("OPENCLAW_OPERATOR_STACK_ROOT", tmpRoot);
    const root = resolveOperatorStackRoot(minimalApi(), undefined);
    expect(root).toBe(path.resolve(tmpRoot));
  });

  it("operator_stack_read returns file contents", async () => {
    vi.stubEnv("OPENCLAW_OPERATOR_STACK_ROOT", tmpRoot);
    const tool = createOperatorStackReadTool(minimalApi(), undefined);
    const out = await tool.execute("t1", { relativePath: "note.txt" });
    const text = out.content[0]?.type === "text" ? out.content[0].text : "";
    expect(text).toContain("hello");
  });

  it("operator_stack_models validates models.json", async () => {
    vi.stubEnv("OPENCLAW_OPERATOR_STACK_ROOT", tmpRoot);
    const tool = createOperatorModelsTool(minimalApi(), undefined);
    const out = await tool.execute("t1", {});
    const text = out.content[0]?.type === "text" ? out.content[0].text : "";
    expect(text).toContain('"ok": true');
    expect(text).toContain("qwen2.5:3b");
  });

  it("github_rate_limit uses mocked fetch", async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ resources: { core: { limit: 1 } } }),
    })) as unknown as typeof fetch;
    vi.stubEnv("GITHUB_TOKEN", "");
    const tool = createGithubRateLimitTool(minimalApi());
    const out = await tool.execute("t1", {});
    const text = out.content[0]?.type === "text" ? out.content[0].text : "";
    expect(text).toContain('"ok": true');
    expect(text).toContain("resources");
  });
});
