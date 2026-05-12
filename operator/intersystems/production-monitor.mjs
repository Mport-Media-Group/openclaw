/**
 * Production monitor scaffold: no destructive actions.
 */
export function productionMonitorStub(namespace) {
  const ns = namespace ?? process.env.IRIS_NAMESPACE?.trim() ?? "unset";
  return {
    ok: true,
    namespace: ns,
    note: "connect IRIS REST production APIs when creds are available off-repo",
  };
}

/**
 * Namespace / production flag diagnostics (env only; no IRIS login).
 */
export function productionEnvSnapshot() {
  return {
    ok: true,
    IRIS_NAMESPACE: process.env.IRIS_NAMESPACE?.trim() ? "set" : "unset",
    IRIS_PRODUCTION_ENABLED: process.env.IRIS_PRODUCTION_ENABLED?.trim() ? "set" : "unset",
  };
}
