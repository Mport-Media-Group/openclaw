#!/usr/bin/env node
const hf =
  process.env.HUGGINGFACE_HUB_TOKEN?.trim() || process.env.HF_TOKEN?.trim() ? "set" : "unset";
process.stdout.write(
  `${JSON.stringify({ ok: true, service: "huggingface", token: hf }, null, 2)}\n`,
);
