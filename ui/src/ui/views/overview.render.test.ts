/* @vitest-environment jsdom */

import { render } from "lit";
import { describe, expect, it } from "vitest";
import { i18n } from "../../i18n/index.ts";
import { getSafeLocalStorage } from "../../local-storage.ts";
import { renderOverview, type OverviewProps } from "./overview.ts";

function createOverviewProps(overrides: Partial<OverviewProps> = {}): OverviewProps {
  return {
    warnQueryToken: false,
    connected: false,
    hello: null,
    settings: {
      gatewayUrl: "",
      token: "",
      sessionKey: "main",
      lastActiveSessionKey: "main",
      theme: "claw",
      themeMode: "system",
      chatFocusMode: false,
      chatShowThinking: true,
      chatShowToolCalls: true,
      splitRatio: 0.6,
      navCollapsed: false,
      navWidth: 220,
      navGroupsCollapsed: {},
      borderRadius: 50,
      locale: "en",
    },
    password: "",
    lastError: null,
    lastErrorCode: null,
    presenceCount: 0,
    sessionsCount: null,
    cronEnabled: null,
    cronNext: null,
    lastChannelsRefresh: null,
    modelAuthStatus: null,
    usageResult: null,
    sessionsResult: null,
    skillsReport: null,
    executiveStatus: null,
    executiveStatusError: null,
    cronJobs: [],
    cronStatus: null,
    attentionItems: [],
    eventLog: [],
    overviewLogLines: [],
    showGatewayToken: false,
    showGatewayPassword: false,
    onSettingsChange: () => undefined,
    onPasswordChange: () => undefined,
    onSessionKeyChange: () => undefined,
    onToggleGatewayTokenVisibility: () => undefined,
    onToggleGatewayPasswordVisibility: () => undefined,
    onConnect: () => undefined,
    onRefresh: () => undefined,
    onNavigate: () => undefined,
    onRefreshLogs: () => undefined,
    ...overrides,
  };
}

describe("overview view rendering", () => {
  it("keeps the persisted overview locale selected before i18n hydration finishes", async () => {
    const container = document.createElement("div");
    const props = createOverviewProps({
      settings: {
        ...createOverviewProps().settings,
        locale: "zh-CN",
      },
    });

    getSafeLocalStorage()?.clear();
    await i18n.setLocale("en");

    render(renderOverview(props), container);
    await Promise.resolve();

    let select = container.querySelector<HTMLSelectElement>("select");
    expect(i18n.getLocale()).toBe("en");
    expect(select?.value).toBe("zh-CN");
    expect(select?.selectedOptions[0]?.textContent?.trim()).toBe("简体中文 (Simplified Chinese)");

    await i18n.setLocale("zh-CN");
    render(renderOverview(props), container);
    await Promise.resolve();

    select = container.querySelector<HTMLSelectElement>("select");
    expect(select?.value).toBe("zh-CN");
    expect(select?.selectedOptions[0]?.textContent?.trim()).toBe("简体中文 (简体中文)");

    await i18n.setLocale("en");
  });

  it("renders a dedicated scope-upgrade approval hint with the exact approve command", async () => {
    const container = document.createElement("div");
    const props = createOverviewProps({
      lastError: "scope upgrade pending approval (requestId: req-123)",
      lastErrorCode: "PAIRING_REQUIRED",
    });

    render(renderOverview(props), container);
    await Promise.resolve();

    expect(container.textContent).toContain("Scope upgrade pending approval.");
    expect(container.textContent).toContain(
      "This device is already paired, but the requested wider scope is waiting for approval.",
    );
    expect(container.textContent).toContain("openclaw devices approve req-123");
  });

  it("does not suggest preview-only latest approval when the request id is absent", async () => {
    const container = document.createElement("div");
    const props = createOverviewProps({
      lastError: "scope upgrade pending approval",
      lastErrorCode: "PAIRING_REQUIRED",
    });

    render(renderOverview(props), container);
    await Promise.resolve();

    expect(container.textContent).toContain("Scope upgrade pending approval.");
    expect(container.textContent).toContain("openclaw devices list");
    expect(container.textContent).not.toContain("openclaw devices approve --latest");
  });

  it("renders the executive status card when the plugin snapshot is available", async () => {
    const container = document.createElement("div");
    const props = createOverviewProps({
      connected: true,
      executiveStatus: {
        ok: true,
        pluginId: "executive-ops",
        configured: true,
        identity: { organizationLabel: "DCB", workspaceLabel: "Executive OS" },
        controller: { controllerId: "exec-main", autoCreateManagedFlow: true },
        integrations: {
          github: {
            enabled: true,
            repository: "openclaw/openclaw",
            tokenEnvVar: "GH_TOKEN",
            tokenPresent: true,
            watchPullRequests: true,
            watchReviews: true,
            requireApprovalForWrites: true,
          },
          cursor: {
            enabled: true,
            runtime: "acp",
            harnessId: "cursor",
            acpEnabled: true,
            requireApprovalForWrites: true,
          },
          vault: {
            enabled: true,
            provider: "1password",
            cliPresent: true,
            configuredItemCount: 2,
          },
          memory: {
            enabled: true,
            provider: "supabase",
            projectUrlEnvVar: "SUPABASE_URL",
            projectUrlPresent: true,
            anonKeyEnvVar: "SUPABASE_ANON_KEY",
            anonKeyPresent: true,
            serviceRoleEnvVar: "SUPABASE_SERVICE_ROLE_KEY",
            serviceRolePresent: true,
            schemaName: "executive_ops",
            tableName: "executive_memory",
            embeddingModel: "openai/text-embedding-3-large",
          },
          browser: {
            enabled: true,
            githubProfile: "github",
            cursorProfile: "cursor",
            canvaProfile: "canva",
            linkedinDraftsOnly: true,
          },
          dcb: {
            enabled: false,
            cloudRunServices: [],
            investorMonitoringEnabled: false,
            complianceMonitoringEnabled: false,
          },
        },
        governance: {
          auditMode: "append_only",
          approvalClasses: [{ id: "githubWrites", label: "GitHub writes", required: true }],
          roles: [
            {
              id: "founder-assistant",
              label: "Founder assistant",
              allowedIntegrations: ["github", "cursor"],
              approvalClasses: ["githubWrites"],
            },
          ],
        },
        runtimeContract: {
          controllerId: "exec-main",
          managedFlowConfigured: true,
          acpCursorReady: true,
          cronWakeupConfigured: false,
          notes: [],
        },
      },
    });

    render(renderOverview(props), container);
    await Promise.resolve();

    expect(container.textContent).toContain("Executive OS");
    expect(container.textContent).toContain("openclaw/openclaw");
    expect(container.textContent).toContain("Cursor ACP");
  });
});
