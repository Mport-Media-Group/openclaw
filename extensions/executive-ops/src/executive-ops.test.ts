import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createTestPluginApi } from "openclaw/plugin-sdk/plugin-test-api";
import { afterEach, describe, expect, it, vi } from "vitest";
import plugin from "../index.js";
import { buildExecutiveGithubSnapshot } from "./github.js";
import { buildExecutiveStatus } from "./status.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createApi(config: Record<string, unknown> = {}) {
  const registerGatewayMethod = vi.fn();
  const registerTool = vi.fn();
  const api = createTestPluginApi({
    id: "executive-ops",
    name: "Executive ops",
    source: "test",
    config,
    runtime: {} as never,
    registerGatewayMethod,
    registerTool,
  });
  return { api, registerGatewayMethod, registerTool };
}

describe("executive-ops plugin", () => {
  const priorFetch = global.fetch;

  afterEach(() => {
    global.fetch = priorFetch;
    vi.unstubAllEnvs();
  });

  it("registers the executive tools and read-only gateway methods", () => {
    const { api, registerGatewayMethod, registerTool } = createApi();
    plugin.register(api);

    expect(registerTool.mock.calls.map((call) => call[1]?.name)).toEqual([
      "executive_status",
      "executive_github_snapshot",
      "executive_repo_plan",
    ]);
    expect(registerGatewayMethod.mock.calls.map((call) => call[0])).toEqual([
      "executive.status",
      "executive.githubSnapshot",
    ]);
    expect(registerGatewayMethod.mock.calls[0]?.[2]).toEqual({ scope: "operator.read" });
  });

  it("builds a status snapshot from config and env presence", () => {
    vi.stubEnv("GH_TOKEN", "ghs_test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "secret");
    const { api } = createApi({
      plugins: {
        entries: {
          acpx: { enabled: true },
          "executive-ops": {
            config: {
              identity: { organizationLabel: "DCB" },
              controller: {
                controllerId: "exec-main",
                ownerSessionKey: "main",
                taskFlowOwner: "main",
              },
              github: { repository: "openclaw/openclaw" },
              cursor: { cwd: "/tmp/workspace" },
            },
          },
        },
      },
    });

    const snapshot = buildExecutiveStatus(api);
    expect(snapshot.identity.organizationLabel).toBe("DCB");
    expect(snapshot.integrations.github.repository).toBe("openclaw/openclaw");
    expect(snapshot.integrations.github.tokenPresent).toBe(true);
    expect(snapshot.integrations.memory.serviceRolePresent).toBe(true);
    expect(snapshot.runtimeContract.managedFlowConfigured).toBe(true);
  });

  it("creates a lightweight GitHub snapshot", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            full_name: "openclaw/openclaw",
            default_branch: "main",
            open_issues_count: 12,
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify([
            { number: 1, title: "Bug", labels: [{ name: "bug" }], html_url: "https://example/1" },
          ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify([
            {
              number: 2,
              title: "PR",
              user: { login: "octo" },
              html_url: "https://example/2",
            },
          ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            workflow_runs: [{ name: "CI", status: "completed", conclusion: "success" }],
          }),
      }) as unknown as typeof fetch;

    const { api } = createApi({
      plugins: {
        entries: {
          "executive-ops": {
            config: {
              github: { repository: "openclaw/openclaw" },
            },
          },
        },
      },
    });
    const snapshot = await buildExecutiveGithubSnapshot({ api });
    expect(snapshot.repo).toBe("openclaw/openclaw");
    expect(snapshot.issues[0]?.labels).toEqual(["bug"]);
    expect(snapshot.pulls[0]?.author).toBe("octo");
    expect(snapshot.workflows[0]?.name).toBe("CI");
  });

  it("declares the bundled plugin manifest and package metadata", () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(__dirname, "..", "openclaw.plugin.json"), "utf8"),
    ) as { id?: string; contracts?: { tools?: string[] } };
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8")) as {
      name?: string;
    };

    expect(pkg.name).toBe("@openclaw/executive-ops-plugin");
    expect(manifest.id).toBe("executive-ops");
    expect(manifest.contracts?.tools).toContain("executive_status");
  });
});
