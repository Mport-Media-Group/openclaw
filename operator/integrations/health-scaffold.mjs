#!/usr/bin/env node
/**
 * Non-destructive env presence checks (no secret values printed).
 * Exit 0 always; JSON to stdout for automation.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const keys = [
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GOOGLE_API_KEY",
  "GEMINI_API_KEY",
  "HUGGINGFACE_HUB_TOKEN",
  "HF_TOKEN",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "GITHUB_TOKEN",
  "GH_TOKEN",
  "GITLAB_TOKEN",
  "ZOHO_REFRESH_TOKEN",
  "CANVA_CLIENT_ID",
];

export function getOperatorEnvHealth() {
  const out = {};
  for (const k of keys) {
    const v = process.env[k];
    out[k] = v && String(v).trim().length > 0 ? "set" : "unset";
  }
  return { ok: true, env: out };
}

const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isMain) {
  process.stdout.write(`${JSON.stringify(getOperatorEnvHealth(), null, 2)}\n`);
}
