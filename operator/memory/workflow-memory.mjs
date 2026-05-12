import { appendRecord, readRecords } from "./memory-store.mjs";

export function logWorkflowStep(workflowId, step, detail) {
  appendRecord("workflows", { workflowId, step, detail });
}

export function listWorkflowTail(workflowId, limit = 200) {
  return readRecords("workflows", limit).filter((r) => r.workflowId === workflowId);
}

/** Operator report path or label (small payloads only). */
export function logOperatorReportRef(ref) {
  appendRecord("report_refs", { ref: String(ref).slice(0, 500) });
}

/** Headless browser session metadata (no cookies, no tokens). */
export function logBrowserSessionMetadata(meta) {
  appendRecord("browser_sessions", {
    ...meta,
    at: new Date().toISOString(),
  });
}
