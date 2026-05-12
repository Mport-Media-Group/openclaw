#!/usr/bin/env node
const c = process.env.CANVA_CLIENT_ID?.trim() ? "set" : "unset";
const s = process.env.CANVA_CLIENT_SECRET?.trim() ? "set" : "unset";
process.stdout.write(
  `${JSON.stringify(
    {
      ok: true,
      service: "canva",
      clientId: c,
      clientSecret: s,
      playwrightHint: "public-page-snippet for www.canva.com optional",
    },
    null,
    2,
  )}\n`,
);
