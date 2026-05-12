import React, { useCallback, useEffect, useState } from "react";

const POLL_MS = 45000;
const FILES = [
  "runtime-health-out.json",
  "memory-health-out.json",
  "ollama-health-out.json",
  "intersystems-runtime-health-out.json",
];

async function loadJson(name) {
  const res = await fetch(`/data/${name}`, { cache: "no-store" });
  if (!res.ok) {
    return { _error: `${name}: HTTP ${res.status}` };
  }
  try {
    return await res.json();
  } catch {
    return { _error: `${name}: invalid JSON` };
  }
}

export function App() {
  const [data, setData] = useState({});
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const next = {};
      for (const f of FILES) {
        next[f] = await loadJson(f);
      }
      setData(next);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", padding: 16, maxWidth: 960 }}>
      <h1 style={{ fontSize: "1.25rem" }}>Operator status</h1>
      <p style={{ color: "#444", fontSize: 14 }}>
        Low-footprint panels. Run CLIs under `operator/` then `pnpm run predev` or `node
        scripts/sync-reports.mjs` to copy JSON into <code>public/data/</code>. Polls every{" "}
        {POLL_MS / 1000}s.
      </p>
      <button type="button" onClick={refresh} disabled={loading} style={{ marginBottom: 16 }}>
        {loading ? "Loading…" : "Refresh now"}
      </button>
      {err ? <p style={{ color: "crimson" }}>{err}</p> : null}
      {FILES.map((f) => (
        <section key={f} style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: "1rem", borderBottom: "1px solid #ddd", paddingBottom: 4 }}>
            {f}
          </h2>
          <pre
            style={{
              background: "#f6f8fa",
              padding: 12,
              overflow: "auto",
              fontSize: 12,
              borderRadius: 6,
            }}
          >
            {JSON.stringify(data[f] ?? {}, null, 2)}
          </pre>
        </section>
      ))}
    </div>
  );
}
