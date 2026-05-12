import { logGithubSummary, logTask } from "../memory/task-history.mjs";
import { logOperatorReportRef, logWorkflowStep } from "../memory/workflow-memory.mjs";

export function injectOperatorMemory({ agentId, task, workflowId, step, detail }) {
  if (task) {
    logTask(agentId ?? "unknown", task, "recorded");
  }
  if (workflowId && step) {
    logWorkflowStep(workflowId, step, detail ?? "");
  }
}

/** Record a GitHub snapshot or other operator report reference (no secrets). */
export function injectGithubOperatorReport({ relativePath, meta }) {
  logGithubSummary({ path: relativePath, ...meta });
  logOperatorReportRef(relativePath);
}
