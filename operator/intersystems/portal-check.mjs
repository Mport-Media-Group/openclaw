#!/usr/bin/env node
/**
 * Optional IRIS management portal reachability (GET, timeout, no credentials in URL logs).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

export async function runPortalCheck() {
  const base = process.env.IRIS_PORTAL_BASE_URL?.trim();
  if (!base) {
    return { ok: true, skipped: true, reason: "IRIS_PORTAL_BASE_URL unset" };
  }
  try {
    const res = await fetch(base, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    return { ok: true, reachable: res.ok, status: res.status, base: "[configured]" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const r = await runPortalCheck();
  process.stdout.write(`${JSON.stringify(r, null, 2)}\n`);
  const skipped = "skipped" in r && r.skipped;
  process.exit(!skipped && r.ok === false ? 1 : 0);
}
