/**
 * IRIS runtime scaffold (read-only). No production mutations.
 */
export const IRIS_RUNTIME_VERSION = 1;

export function describeIrisRuntime() {
  return {
    version: IRIS_RUNTIME_VERSION,
    portalEnv: process.env.IRIS_PORTAL_BASE_URL ? "configured" : "unset",
  };
}
