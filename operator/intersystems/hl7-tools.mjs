/**
 * HL7 message inspection scaffold (read-only).
 */
export function hl7PeekStub(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: false, error: "empty" };
  }
  return { ok: true, segments: raw.split(/\r?\n/u).filter(Boolean).length };
}

/**
 * Queue / namespace inspection scaffold (no network by default).
 */
export function hl7QueueInspectStub() {
  const q = process.env.IRIS_HL7_QUEUE_NAME?.trim();
  if (!q) {
    return { ok: true, skipped: true, reason: "IRIS_HL7_QUEUE_NAME unset" };
  }
  return {
    ok: true,
    queue: q,
    note: "wire Ensemble / IRIS TCP listener metrics when endpoints exist",
  };
}
