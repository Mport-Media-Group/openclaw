/**
 * Embeddings stub: no local model preload. Optional Chroma HTTP when enabled.
 */

/**
 * @returns {{ mode: string, ok: boolean, note?: string }}
 */
export function embeddingsStatus() {
  const chroma = process.env.OPERATOR_CHROMA_URL?.trim();
  if (!chroma) {
    return { mode: "disabled", ok: true, note: "OPERATOR_CHROMA_URL unset; no vector preload" };
  }
  if (process.env.OPERATOR_EMBEDDINGS_ENABLED !== "1") {
    return {
      mode: "chroma_configured",
      ok: true,
      note: "Set OPERATOR_EMBEDDINGS_ENABLED=1 to allow optional embed HTTP (not wired)",
    };
  }
  return { mode: "stub", ok: true, note: "Wire single embed call to Chroma when product needs it" };
}

/**
 * @param {string} _text
 */
export async function embedTextOptional(_text) {
  const st = embeddingsStatus();
  if (st.mode === "disabled" || process.env.OPERATOR_EMBEDDINGS_ENABLED !== "1") {
    return { ok: false, skipped: true, reason: "embeddings disabled" };
  }
  return { ok: false, skipped: true, reason: "not implemented (RAM-safe stub)" };
}
