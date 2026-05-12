/**
 * FHIR inspection scaffold (no writes).
 */
export function fhirValidateBundleStub(bundle) {
  if (!bundle || typeof bundle !== "object") {
    return { ok: false, error: "missing bundle" };
  }
  return { ok: true, note: "stub validator; wire FHIR schema when endpoints exist" };
}

/**
 * Optional capability statement GET (read-only). Set IRIS_FHIR_BASE_URL (no trailing $capability).
 */
export async function fhirEndpointPing() {
  const raw = process.env.IRIS_FHIR_BASE_URL?.trim();
  if (!raw) {
    return { ok: true, skipped: true, reason: "IRIS_FHIR_BASE_URL unset" };
  }
  const base = raw.replace(/\/$/, "");
  const url = `${base}/metadata`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/fhir+json, application/json" },
      signal: AbortSignal.timeout(10000),
    });
    return { ok: true, reachable: res.ok, status: res.status, path: "/metadata" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
