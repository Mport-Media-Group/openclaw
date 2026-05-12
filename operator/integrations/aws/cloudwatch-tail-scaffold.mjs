#!/usr/bin/env node
/**
 * Read-only CloudWatch Logs scaffold: optional log group discovery (capped).
 */
import { awsCliPresent, runAws } from "./aws-cli.mjs";
import { getAwsEnvSummary } from "./env.mjs";

const note =
  "Tail is interactive; use `aws logs tail <group> --since 10m --follow` manually. This script only lists a few groups.";

if (!awsCliPresent()) {
  process.stdout.write(
    `${JSON.stringify({ ok: true, skipped: true, reason: "aws CLI missing", note }, null, 2)}\n`,
  );
  process.exit(0);
}
const env = getAwsEnvSummary();
if (env.accessKeyId !== "set") {
  process.stdout.write(
    `${JSON.stringify({ ok: true, skipped: true, reason: "no AWS keys", note }, null, 2)}\n`,
  );
  process.exit(0);
}
const r = runAws(["logs", "describe-log-groups", "--limit", "8", "--output", "json"]);
if (!r.ok) {
  process.stdout.write(
    `${JSON.stringify({ ok: false, note, stderr: (r.stderr || "").slice(0, 800) }, null, 2)}\n`,
  );
  process.exit(1);
}
let body;
try {
  body = JSON.parse(r.stdout || "{}");
} catch {
  body = {};
}
const names = (body.logGroups ?? [])
  .map((/** @type {{ logGroupName?: string }} */ g) => g.logGroupName)
  .filter(Boolean);
process.stdout.write(`${JSON.stringify({ ok: true, note, logGroupsSample: names }, null, 2)}\n`);
