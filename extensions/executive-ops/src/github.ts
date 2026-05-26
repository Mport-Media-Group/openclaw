import type { OpenClawPluginToolContext } from "openclaw/plugin-sdk/plugin-entry";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";
import { readExecutiveOpsConfig } from "./config.js";

export type ExecutiveGithubSnapshot = {
  ok: boolean;
  repo: string;
  authenticated: boolean;
  status?: number;
  defaultBranch?: string;
  repoInfo?: {
    fullName?: string;
    private?: boolean;
    openIssuesCount?: number;
    defaultBranch?: string;
    pushedAt?: string;
  };
  issues: Array<{ number?: number; title?: string; labels: string[]; url?: string }>;
  pulls: Array<{ number?: number; title?: string; author?: string; url?: string }>;
  workflows: Array<{ name?: string; status?: string; conclusion?: string; url?: string }>;
  warnings: string[];
};

function readTokenEnvVar(api: OpenClawPluginApi, ctx?: OpenClawPluginToolContext): string {
  return readExecutiveOpsConfig(api, ctx).github?.tokenEnvVar?.trim() || "GH_TOKEN";
}

function readToken(api: OpenClawPluginApi, ctx?: OpenClawPluginToolContext): string {
  const configuredName = readTokenEnvVar(api, ctx);
  return (
    process.env[configuredName]?.trim() ||
    process.env.GH_TOKEN?.trim() ||
    process.env.GITHUB_TOKEN?.trim() ||
    ""
  );
}

export function resolveExecutiveGithubRepo(
  api: OpenClawPluginApi,
  ctx?: OpenClawPluginToolContext,
  preferredRepo?: string,
): string | null {
  const explicit = preferredRepo?.trim();
  if (explicit) {
    return explicit;
  }
  const configRepo = readExecutiveOpsConfig(api, ctx).github?.repository?.trim();
  if (configRepo) {
    return configRepo;
  }
  const envRepo = process.env.GITHUB_REPOSITORY?.trim();
  return envRepo || null;
}

async function fetchJson(
  url: string,
  token: string,
): Promise<{ ok: boolean; status: number; body: Record<string, unknown> | unknown[] }> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) });
  const text = await res.text();
  try {
    return {
      ok: res.ok,
      status: res.status,
      body: JSON.parse(text) as Record<string, unknown> | unknown[],
    };
  } catch {
    return {
      ok: res.ok,
      status: res.status,
      body: { raw: text },
    };
  }
}

function issueLabels(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => {
    if (
      entry &&
      typeof entry === "object" &&
      typeof (entry as { name?: unknown }).name === "string"
    ) {
      return [(entry as { name: string }).name];
    }
    return [];
  });
}

export async function buildExecutiveGithubSnapshot(params: {
  api: OpenClawPluginApi;
  ctx?: OpenClawPluginToolContext;
  repo?: string;
  limit?: number;
  includeWorkflows?: boolean;
}): Promise<ExecutiveGithubSnapshot> {
  const repo = resolveExecutiveGithubRepo(params.api, params.ctx, params.repo);
  if (!repo) {
    return {
      ok: false,
      repo: "",
      authenticated: Boolean(readToken(params.api, params.ctx)),
      issues: [],
      pulls: [],
      workflows: [],
      warnings: ["No GitHub repository configured. Set executive-ops github.repository first."],
    };
  }
  const token = readToken(params.api, params.ctx);
  const limit = Math.max(1, Math.min(20, Math.floor(params.limit ?? 5)));
  const warnings: string[] = [];
  const repoInfo = await fetchJson(`https://api.github.com/repos/${repo}`, token);
  const defaultBranch =
    typeof (repoInfo.body as { default_branch?: unknown }).default_branch === "string"
      ? (repoInfo.body as { default_branch: string }).default_branch
      : undefined;
  if (!repoInfo.ok) {
    warnings.push(`GitHub repo metadata request returned HTTP ${repoInfo.status}.`);
  }
  const issuesResponse = await fetchJson(
    `https://api.github.com/repos/${repo}/issues?state=open&per_page=${limit}`,
    token,
  );
  const pullsResponse = await fetchJson(
    `https://api.github.com/repos/${repo}/pulls?state=open&per_page=${limit}`,
    token,
  );
  const workflowsResponse =
    params.includeWorkflows === false
      ? null
      : await fetchJson(
          `https://api.github.com/repos/${repo}/actions/runs?per_page=${limit}`,
          token,
        );
  const issueRows = Array.isArray(issuesResponse.body)
    ? issuesResponse.body
        .filter(
          (item) =>
            item &&
            typeof item === "object" &&
            !("pull_request" in (item as Record<string, unknown>)),
        )
        .map((item) => item as Record<string, unknown>)
    : [];
  const pullRows = Array.isArray(pullsResponse.body)
    ? pullsResponse.body.map((item) => item as Record<string, unknown>)
    : [];
  const workflowRows =
    workflowsResponse &&
    workflowsResponse.body &&
    typeof workflowsResponse.body === "object" &&
    Array.isArray((workflowsResponse.body as { workflow_runs?: unknown[] }).workflow_runs)
      ? (workflowsResponse.body as { workflow_runs: unknown[] }).workflow_runs.map(
          (item) => item as Record<string, unknown>,
        )
      : [];
  if (!token) {
    warnings.push("GitHub token not present; snapshot is running at anonymous rate limits.");
  }
  if (!issuesResponse.ok) {
    warnings.push(`Open issues request returned HTTP ${issuesResponse.status}.`);
  }
  if (!pullsResponse.ok) {
    warnings.push(`Open pulls request returned HTTP ${pullsResponse.status}.`);
  }
  if (workflowsResponse && !workflowsResponse.ok) {
    warnings.push(`Workflow runs request returned HTTP ${workflowsResponse.status}.`);
  }
  return {
    ok: repoInfo.ok && issuesResponse.ok && pullsResponse.ok,
    repo,
    authenticated: Boolean(token),
    status: repoInfo.status,
    ...(defaultBranch ? { defaultBranch } : {}),
    repoInfo:
      repoInfo.body && typeof repoInfo.body === "object"
        ? {
            ...(typeof (repoInfo.body as { full_name?: unknown }).full_name === "string"
              ? { fullName: (repoInfo.body as { full_name: string }).full_name }
              : {}),
            ...(typeof (repoInfo.body as { private?: unknown }).private === "boolean"
              ? { private: (repoInfo.body as { private: boolean }).private }
              : {}),
            ...(typeof (repoInfo.body as { open_issues_count?: unknown }).open_issues_count ===
            "number"
              ? {
                  openIssuesCount: (repoInfo.body as { open_issues_count: number })
                    .open_issues_count,
                }
              : {}),
            ...(defaultBranch ? { defaultBranch } : {}),
            ...(typeof (repoInfo.body as { pushed_at?: unknown }).pushed_at === "string"
              ? { pushedAt: (repoInfo.body as { pushed_at: string }).pushed_at }
              : {}),
          }
        : undefined,
    issues: issueRows.map((issue) => ({
      ...(typeof issue.number === "number" ? { number: issue.number } : {}),
      ...(typeof issue.title === "string" ? { title: issue.title } : {}),
      labels: issueLabels(issue.labels),
      ...(typeof issue.html_url === "string" ? { url: issue.html_url } : {}),
    })),
    pulls: pullRows.map((pull) => ({
      ...(typeof pull.number === "number" ? { number: pull.number } : {}),
      ...(typeof pull.title === "string" ? { title: pull.title } : {}),
      ...(pull.user &&
      typeof pull.user === "object" &&
      typeof (pull.user as { login?: unknown }).login === "string"
        ? { author: (pull.user as { login: string }).login }
        : {}),
      ...(typeof pull.html_url === "string" ? { url: pull.html_url } : {}),
    })),
    workflows: workflowRows.map((workflow) => ({
      ...(typeof workflow.name === "string" ? { name: workflow.name } : {}),
      ...(typeof workflow.status === "string" ? { status: workflow.status } : {}),
      ...(typeof workflow.conclusion === "string" ? { conclusion: workflow.conclusion } : {}),
      ...(typeof workflow.html_url === "string" ? { url: workflow.html_url } : {}),
    })),
    warnings,
  };
}
