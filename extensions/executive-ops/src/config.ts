import type { OpenClawPluginToolContext } from "openclaw/plugin-sdk/plugin-entry";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

export type ExecutiveRoleConfig = {
  id: string;
  label?: string;
  allowedIntegrations?: string[];
  approvalClasses?: string[];
};

export type ExecutiveOpsPluginConfig = {
  identity?: {
    organizationLabel?: string;
    workspaceLabel?: string;
    founderLabel?: string;
  };
  controller?: {
    controllerId?: string;
    ownerSessionKey?: string;
    taskFlowOwner?: string;
    autoCreateManagedFlow?: boolean;
    wakeupCronTag?: string;
  };
  github?: {
    enabled?: boolean;
    repository?: string;
    defaultBaseBranch?: string;
    tokenEnvVar?: string;
    watchPullRequests?: boolean;
    watchReviews?: boolean;
    requireApprovalForWrites?: boolean;
  };
  cursor?: {
    enabled?: boolean;
    runtime?: "acp";
    harnessId?: string;
    cwd?: string;
    defaultModel?: string;
    requireApprovalForWrites?: boolean;
  };
  vault?: {
    enabled?: boolean;
    provider?: "1password";
    account?: string;
    vault?: string;
    githubItem?: string;
    cursorItem?: string;
    browserItem?: string;
  };
  memory?: {
    enabled?: boolean;
    provider?: "supabase";
    projectUrlEnvVar?: string;
    anonKeyEnvVar?: string;
    serviceRoleEnvVar?: string;
    schemaName?: string;
    tableName?: string;
    embeddingModel?: string;
  };
  governance?: {
    auditMode?: "append_only" | "advisory";
    approvalClasses?: Partial<Record<ExecutiveApprovalClassId, boolean>>;
    roles?: ExecutiveRoleConfig[];
  };
  browser?: {
    enabled?: boolean;
    profilesRoot?: string;
    githubProfile?: string;
    cursorProfile?: string;
    canvaProfile?: string;
    linkedinDraftsOnly?: boolean;
  };
  dcb?: {
    enabled?: boolean;
    gcpProjectId?: string;
    firebaseProjectId?: string;
    firestoreDatabase?: string;
    cloudRunServices?: string[];
    investorMonitoringEnabled?: boolean;
    complianceMonitoringEnabled?: boolean;
  };
};

export type ExecutiveApprovalClassId =
  | "githubWrites"
  | "cursorWrites"
  | "publicPosts"
  | "emails"
  | "deploymentPushes"
  | "credentialChanges"
  | "investorMessaging"
  | "legalDocs";

export const EXECUTIVE_APPROVAL_CLASS_LABELS: Record<ExecutiveApprovalClassId, string> = {
  githubWrites: "GitHub writes",
  cursorWrites: "Cursor/Codex writes",
  publicPosts: "Public posts",
  emails: "Emails",
  deploymentPushes: "Deployment pushes",
  credentialChanges: "Credential changes",
  investorMessaging: "Investor messaging",
  legalDocs: "Legal docs",
};

export const DEFAULT_EXECUTIVE_ROLES: ExecutiveRoleConfig[] = [
  {
    id: "founder-assistant",
    label: "Founder assistant",
    allowedIntegrations: ["github", "cursor", "memory", "browser"],
    approvalClasses: ["publicPosts", "emails", "deploymentPushes", "credentialChanges"],
  },
  {
    id: "infra",
    label: "Infrastructure",
    allowedIntegrations: ["github", "cursor", "dcb"],
    approvalClasses: ["deploymentPushes", "credentialChanges", "githubWrites"],
  },
  {
    id: "marketing",
    label: "Marketing",
    allowedIntegrations: ["browser", "github"],
    approvalClasses: ["publicPosts", "investorMessaging"],
  },
  {
    id: "compliance",
    label: "Compliance",
    allowedIntegrations: ["memory", "dcb"],
    approvalClasses: ["legalDocs", "credentialChanges"],
  },
];

export function readExecutiveOpsConfig(
  api: OpenClawPluginApi,
  ctx?: OpenClawPluginToolContext,
): ExecutiveOpsPluginConfig {
  const cfg = ctx?.getRuntimeConfig?.() ?? ctx?.runtimeConfig ?? ctx?.config ?? api.config;
  const entries = (
    cfg as {
      plugins?: { entries?: Record<string, { config?: ExecutiveOpsPluginConfig }> };
    }
  ).plugins?.entries;
  return entries?.["executive-ops"]?.config ?? {};
}

export function normalizeNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    .map((entry) => entry.trim());
}
