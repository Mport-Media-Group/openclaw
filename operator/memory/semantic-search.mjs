/**
 * Keyword search over JSONL namespaces; optional Chroma when OPERATOR_CHROMA_URL is set.
 */
import { readRecords } from "./memory-store.mjs";

export async function semanticSearch(namespace, query, { limit = 20 } = {}) {
  const chromaUrl = process.env.OPERATOR_CHROMA_URL?.trim();
  if (chromaUrl) {
    try {
      const res = await fetch(`${chromaUrl.replace(/\/$/, "")}/api/v1/heartbeat`, {
        signal: AbortSignal.timeout(2000),
      });
      if (!res.ok) {
        return {
          mode: "chroma",
          ok: false,
          fallback: "keyword",
          hits: keywordHits(namespace, query, limit),
        };
      }
      return {
        mode: "chroma",
        ok: true,
        note: "Chroma reachable; collection query not wired (stub).",
        hits: keywordHits(namespace, query, limit),
      };
    } catch {
      return {
        mode: "chroma",
        ok: false,
        fallback: "keyword",
        hits: keywordHits(namespace, query, limit),
      };
    }
  }
  return { mode: "keyword", hits: keywordHits(namespace, query, limit) };
}

function keywordHits(namespace, query, limit) {
  const q = query.toLowerCase();
  const rows = readRecords(namespace, 2000);
  return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q)).slice(-limit);
}

const DEFAULT_MULTI_NAMESPACES = [
  "workflows",
  "tasks",
  "github_summaries",
  "report_refs",
  "browser_sessions",
];

/**
 * Sequential keyword scan across namespaces (low RAM; no vector preload).
 * @param {string[]} namespaces
 * @param {string} query
 * @param {{ limit?: number }} [opts]
 */
export function searchAcrossNamespaces(namespaces, query, opts = {}) {
  const limit = opts.limit ?? 20;
  const ns = namespaces.length ? namespaces : DEFAULT_MULTI_NAMESPACES;
  const hits = [];
  for (const namespace of ns) {
    const part = keywordHits(namespace, query, limit);
    for (const row of part) {
      hits.push({ namespace, row });
      if (hits.length >= limit) {
        return hits;
      }
    }
  }
  return hits;
}
