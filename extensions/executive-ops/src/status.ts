import fs from "node:fs";
import path from "node:path";
import type { OpenClawPluginToolContext } from "openclaw/plugin-sdk/plugin-entry";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";
import {
  DEFAULT_EXECUTIVE_ROLES,
  EXECUTIVE_APPROVAL_CLASS_LABELS,
  type ExecutiveApprovalClassId,
  readExecutiveOpsConfig,
} from "./config.js";

export type ExecutiveStatusResult = {
  ok: true;
  pluginId: "executive-ops";
  configured: boolean;
  identity: {
    organizationLabel?: string;
    workspaceLabel?: string;
    founderLabel?: string;
  };
  controller: {
    controllerId?: string;
    ownerSessionKey?: string;
    taskFlowOwner?: string;
    autoCreateManagedFlow: boolean;
    wakeupCronTag?: string;
  };
  integrations: {
    github: {
      enabled: boolean;
      repository?: string;
      defaultBaseBranch?: string;
      tokenEnvVar: string;
      tokenPresent: boolean;
      watchPullRequests: boolean;
      watchReviews: boolean;
      requireApprovalForWrites: boolean;
    };
    cursor: {
      enabled: boolean;
      runtime: "acp";
      harnessId: string;
      cwd?: string;
      defaultModel?: string;
      acpEnabled: boolean;
      binaryName?: string;
      binaryPath?: string;
      requireApprovalForWrites: boolean;
    };
    vault: {
      enabled: boolean;
      provider: "1password";
      cliPresent: boolean;
      cliPath?: string;
      account?: string;
      vault?: string;
      configuredItemCount: number;
    };
    memory: {
      enabled: boolean;
      provider: "supabase";
      projectUrlEnvVar: string;
      projectUrlPresent: boolean;
      anonKeyEnvVar: string;
      anonKeyPresent: boolean;
      serviceRoleEnvVar: string;
      serviceRolePresent: boolean;
      schemaName: string;
      tableName: string;
      embeddingModel: string;
    };
    browser: {
      enabled: boolean;
      profilesRoot?: string;
      githubProfile: string;
      cursorProfile: string;
      canvaProfile: string;
      linkedinDraftsOnly: boolean;
    };
    dcb: {
      enabled: boolean;
      gcpProjectId?: string;
      firebaseProjectId?: string;
      firestoreDatabase?: string;
      cloudRunServices: string[];
      investorMonitoringEnabled: boolean;
      complianceMonitoringEnabled: boolean;
    };
  };
  governance: {
    auditMode: "append_only" | "advisory";
    approvalClasses: Array<{
      id: ExecutiveApprovalClassId;
      label: string;
      required: boolean;
    }>;
    roles: Array<{
      id: string;
      label: string;
      allowedIntegrations: string[];
      approvalClasses: string[];
    }>;
  };
  runtimeContract: {
    taskFlowOwner?: string;
    controllerId?: string;
    managedFlowConfigured: boolean;
    acpCursorReady: boolean;
    cronWakeupConfigured: boolean;
    notes: string[];
  };
};

type RuntimeConfigWithPlugins = {
  plugins?: {
    entries?: Record<string, { enabled?: boolean }>;
  };
};

function readRuntimeConfig(
  api: OpenClawPluginApi,
  ctx?: OpenClawPluginToolContext,
): RuntimeConfigWithPlugins {
  return (ctx?.getRuntimeConfig?.() ??
    ctx?.runtimeConfig ??
    ctx?.config ??
    api.config) as RuntimeConfigWithPlugins;
}

function resolveBinary(candidates: string[]): { name?: string; path?: string } {
  const pathValue = process.env.PATH ?? "";
  if (!pathValue.trim()) {
    return {};
  }
  const searchDirs = pathValue.split(path.delimiter).filter(Boolean);
  for (const name of candidates) {
    for (const dir of searchDirs) {
      const candidatePath = path.join(dir, name);
      try {
        fs.accessSync(candidatePath, fs.constants.X_OK);
        return { name, path: candidatePath };
      } catch {
        // Keep searching.
      }
    }
  }
  return {};
}

function envPresent(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function countConfiguredItems(values: Array<string | undefined>): number {
  return values.filter((value) => typeof value === "string" && value.trim().length > 0).length;
}

export function buildExecutiveStatus(
  api: OpenClawPluginApi,
  ctx?: OpenClawPluginToolContext,
): ExecutiveStatusResult {
  const cfg = readExecutiveOpsConfig(api, ctx);
  const runtimeConfig = readRuntimeConfig(api, ctx);
  const acpEnabled = runtimeConfig.plugins?.entries?.acpx?.enabled === true;
  const cursorBinary = resolveBinary(["cursor-agent", "cursor"]);
  const vaultBinary = resolveBinary(["op"]);
  const githubTokenEnvVar = cfg.github?.tokenEnvVar?.trim() || "GH_TOKEN";
  const projectUrlEnvVar = cfg.memory?.projectUrlEnvVar?.trim() || "SUPABASE_URL";
  const anonKeyEnvVar = cfg.memory?.anonKeyEnvVar?.trim() || "SUPABASE_ANON_KEY";
  const serviceRoleEnvVar = cfg.memory?.serviceRoleEnvVar?.trim() || "SUPABASE_SERVICE_ROLE_KEY";
  const roles = cfg.governance?.roles?.length ? cfg.governance.roles : DEFAULT_EXECUTIVE_ROLES;
  const approvalClasses = Object.entries(EXECUTIVE_APPROVAL_CLASS_LABELS).map(([id, label]) => ({
    id: id as ExecutiveApprovalClassId,
    label,
    required: cfg.governance?.approvalClasses?.[id as ExecutiveApprovalClassId] !== false,
  }));
  const controllerId = cfg.controller?.controllerId?.trim();
  const ownerSessionKey = cfg.controller?.ownerSessionKey?.trim();
  const taskFlowOwner = cfg.controller?.taskFlowOwner?.trim() || ownerSessionKey;
  const repository = cfg.github?.repository?.trim() || process.env.GITHUB_REPOSITORY?.trim();
  const configured =
    Boolean(controllerId || ownerSessionKey) ||
    Boolean(repository) ||
    cfg.cursor?.enabled === true ||
    cfg.memory?.enabled === true ||
    cfg.vault?.enabled === true;
  const notes: string[] = [];
  if (!controllerId) {
    notes.push("Set controller.controllerId to make executive flow ownership explicit.");
  }
  if (!ownerSessionKey) {
    notes.push(
      "Set controller.ownerSessionKey to bind wakeups and sub-work to a stable parent session.",
    );
  }
  if (!repository) {
    notes.push("Set github.repository to unlock GitHub summaries and review monitoring.");
  }
  if (cfg.cursor?.enabled !== false && !acpEnabled) {
    notes.push("Enable the acpx plugin before relying on Cursor ACP orchestration.");
  }
  if (cfg.memory?.enabled !== false && !envPresent(serviceRoleEnvVar)) {
    notes.push(`Populate ${serviceRoleEnvVar} before enabling durable Supabase memory jobs.`);
  }

  return {
    ok: true,
    pluginId: "executive-ops",
    configured,
    identity: {
      ...(cfg.identity?.organizationLabel?.trim()
        ? { organizationLabel: cfg.identity.organizationLabel.trim() }
        : {}),
      ...(cfg.identity?.workspaceLabel?.trim()
        ? { workspaceLabel: cfg.identity.workspaceLabel.trim() }
        : {}),
      ...(cfg.identity?.founderLabel?.trim()
        ? { founderLabel: cfg.identity.founderLabel.trim() }
        : {}),
    },
    controller: {
      ...(controllerId ? { controllerId } : {}),
      ...(ownerSessionKey ? { ownerSessionKey } : {}),
      ...(taskFlowOwner ? { taskFlowOwner } : {}),
      autoCreateManagedFlow: cfg.controller?.autoCreateManagedFlow !== false,
      ...(cfg.controller?.wakeupCronTag?.trim()
        ? { wakeupCronTag: cfg.controller.wakeupCronTag.trim() }
        : {}),
    },
    integrations: {
      github: {
        enabled: cfg.github?.enabled !== false,
        ...(repository ? { repository } : {}),
        ...(cfg.github?.defaultBaseBranch?.trim()
          ? { defaultBaseBranch: cfg.github.defaultBaseBranch.trim() }
          : {}),
        tokenEnvVar: githubTokenEnvVar,
        tokenPresent: envPresent(githubTokenEnvVar) || envPresent("GITHUB_TOKEN"),
        watchPullRequests: cfg.github?.watchPullRequests !== false,
        watchReviews: cfg.github?.watchReviews !== false,
        requireApprovalForWrites: cfg.github?.requireApprovalForWrites !== false,
      },
      cursor: {
        enabled: cfg.cursor?.enabled !== false,
        runtime: "acp",
        harnessId: cfg.cursor?.harnessId?.trim() || "cursor",
        ...(cfg.cursor?.cwd?.trim() ? { cwd: cfg.cursor.cwd.trim() } : {}),
        ...(cfg.cursor?.defaultModel?.trim()
          ? { defaultModel: cfg.cursor.defaultModel.trim() }
          : {}),
        acpEnabled,
        ...(cursorBinary.name ? { binaryName: cursorBinary.name } : {}),
        ...(cursorBinary.path ? { binaryPath: cursorBinary.path } : {}),
        requireApprovalForWrites: cfg.cursor?.requireApprovalForWrites !== false,
      },
      vault: {
        enabled: cfg.vault?.enabled !== false,
        provider: "1password",
        cliPresent: Boolean(vaultBinary.path),
        ...(vaultBinary.path ? { cliPath: vaultBinary.path } : {}),
        ...(cfg.vault?.account?.trim() ? { account: cfg.vault.account.trim() } : {}),
        ...(cfg.vault?.vault?.trim() ? { vault: cfg.vault.vault.trim() } : {}),
        configuredItemCount: countConfiguredItems([
          cfg.vault?.githubItem,
          cfg.vault?.cursorItem,
          cfg.vault?.browserItem,
        ]),
      },
      memory: {
        enabled: cfg.memory?.enabled !== false,
        provider: "supabase",
        projectUrlEnvVar,
        projectUrlPresent: envPresent(projectUrlEnvVar),
        anonKeyEnvVar,
        anonKeyPresent: envPresent(anonKeyEnvVar),
        serviceRoleEnvVar,
        serviceRolePresent: envPresent(serviceRoleEnvVar),
        schemaName: cfg.memory?.schemaName?.trim() || "executive_ops",
        tableName: cfg.memory?.tableName?.trim() || "executive_memory",
        embeddingModel: cfg.memory?.embeddingModel?.trim() || "openai/text-embedding-3-large",
      },
      browser: {
        enabled: cfg.browser?.enabled !== false,
        ...(cfg.browser?.profilesRoot?.trim()
          ? { profilesRoot: cfg.browser.profilesRoot.trim() }
          : {}),
        githubProfile: cfg.browser?.githubProfile?.trim() || "github",
        cursorProfile: cfg.browser?.cursorProfile?.trim() || "cursor",
        canvaProfile: cfg.browser?.canvaProfile?.trim() || "canva",
        linkedinDraftsOnly: cfg.browser?.linkedinDraftsOnly !== false,
      },
      dcb: {
        enabled: cfg.dcb?.enabled !== false,
        ...(cfg.dcb?.gcpProjectId?.trim() ? { gcpProjectId: cfg.dcb.gcpProjectId.trim() } : {}),
        ...(cfg.dcb?.firebaseProjectId?.trim()
          ? { firebaseProjectId: cfg.dcb.firebaseProjectId.trim() }
          : {}),
        ...(cfg.dcb?.firestoreDatabase?.trim()
          ? { firestoreDatabase: cfg.dcb.firestoreDatabase.trim() }
          : {}),
        cloudRunServices: Array.isArray(cfg.dcb?.cloudRunServices)
          ? cfg.dcb!.cloudRunServices.filter((service): service is string =>
              Boolean(service?.trim()),
            )
          : [],
        investorMonitoringEnabled: cfg.dcb?.investorMonitoringEnabled === true,
        complianceMonitoringEnabled: cfg.dcb?.complianceMonitoringEnabled === true,
      },
    },
    governance: {
      auditMode: cfg.governance?.auditMode ?? "append_only",
      approvalClasses,
      roles: roles.map((role) => ({
        id: role.id,
        label: role.label?.trim() || role.id,
        allowedIntegrations: Array.isArray(role.allowedIntegrations)
          ? role.allowedIntegrations.filter((entry): entry is string => Boolean(entry?.trim()))
          : [],
        approvalClasses: Array.isArray(role.approvalClasses)
          ? role.approvalClasses.filter((entry): entry is string => Boolean(entry?.trim()))
          : [],
      })),
    },
    runtimeContract: {
      ...(taskFlowOwner ? { taskFlowOwner } : {}),
      ...(controllerId ? { controllerId } : {}),
      managedFlowConfigured: Boolean(controllerId && taskFlowOwner),
      acpCursorReady: Boolean(acpEnabled && cursorBinary.path),
      cronWakeupConfigured: Boolean(cfg.controller?.wakeupCronTag?.trim()),
      notes,
    },
  };
}
