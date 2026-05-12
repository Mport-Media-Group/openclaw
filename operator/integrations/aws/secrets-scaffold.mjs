#!/usr/bin/env node
/**
 * Secrets Manager list (metadata only, capped). No secret values.
 */
import { awsCliPresent, runAws } from "./aws-cli.mjs";
import { getAwsEnvSummary } from "./env.mjs";

if (!awsCliPresent()) {
  process.stdout.write(
    `${JSON.stringify({ ok: true, skipped: true, reason: "aws CLI missing" }, null, 2)}\n`,
  );
  process.exit(0);
}
const env = getAwsEnvSummary();
if (env.accessKeyId !== "set") {
  process.stdout.write(
    `${JSON.stringify({ ok: true, skipped: true, reason: "no AWS keys" }, null, 2)}\n`,
  );
  process.exit(0);
}
const r = runAws(["secretsmanager", "list-secrets", "--max-items", "8", "--output", "json"]);
if (!r.ok) {
  process.stdout.write(
    `${JSON.stringify({ ok: false, stderr: (r.stderr || "").slice(0, 800) }, null, 2)}\n`,
  );
  process.exit(1);
}
let body;
try {
  body = JSON.parse(r.stdout || "{}");
} catch {
  body = {};
}
const names = (body.SecretList ?? [])
  .map((/** @type {{ Name?: string }} */ s) => s.Name)
  .filter(Boolean);
process.stdout.write(
  `${JSON.stringify({ ok: true, secretNamesSample: names, count: names.length, note: "names only; no values" }, null, 2)}\n`,
);
