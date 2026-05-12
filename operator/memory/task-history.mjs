import { appendRecord, readRecords } from "./memory-store.mjs";

export function logTask(agentId, task, status) {
  appendRecord("tasks", { agentId, task, status });
}

export function listRecentTasks(limit = 100) {
  return readRecords("tasks", limit);
}

/** GitHub snapshot summary line (paths, counts; no tokens). */
export function logGithubSummary(summary) {
  appendRecord("github_summaries", {
    summary: typeof summary === "string" ? summary.slice(0, 2000) : summary,
  });
}
