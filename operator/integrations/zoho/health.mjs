#!/usr/bin/env node
/**
 * Zoho env detection; optional public-page snippet when OPERATOR_INTEGRATION_PLAYWRIGHT=1.
 */
const refresh = process.env.ZOHO_REFRESH_TOKEN?.trim() ? "set" : "unset";
const clientId = process.env.ZOHO_CLIENT_ID?.trim() ? "set" : "unset";
const out = {
  ok: true,
  service: "zoho",
  refreshToken: refresh,
  clientId,
  playwrightHint: "operator/browser-automation/public-page-snippet.mjs",
};
process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
