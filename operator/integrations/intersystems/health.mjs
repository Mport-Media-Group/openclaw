#!/usr/bin/env node
const base = process.env.IRIS_PORTAL_BASE_URL?.trim() ? "set" : "unset";
process.stdout.write(
  `${JSON.stringify({ ok: true, service: "intersystems", portalUrl: base }, null, 2)}\n`,
);
