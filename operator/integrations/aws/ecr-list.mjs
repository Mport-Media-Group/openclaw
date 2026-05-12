#!/usr/bin/env node
/**
 * List ECR repositories (read-only, capped).
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
const r = runAws(["ecr", "describe-repositories", "--max-items", "8", "--output", "json"]);
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
const repos = (body.repositories ?? []).map(
  (/** @type {{ repositoryName?: string }} */ x) => x.repositoryName,
);
process.stdout.write(
  `${JSON.stringify({ ok: true, repositories: repos, count: repos.length }, null, 2)}\n`,
);
