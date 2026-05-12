#!/usr/bin/env node
/**
 * Read-only STS caller identity via AWS CLI when available.
 */
import { awsCliPresent, runAws } from "./aws-cli.mjs";
import { getAwsEnvSummary } from "./env.mjs";

if (!awsCliPresent()) {
  process.stdout.write(
    `${JSON.stringify({ ok: true, skipped: true, reason: "aws CLI not on PATH" }, null, 2)}\n`,
  );
  process.exit(0);
}

const env = getAwsEnvSummary();
if (env.accessKeyId !== "set" || env.secretAccessKey !== "set") {
  process.stdout.write(
    `${JSON.stringify({ ok: true, skipped: true, reason: "AWS keys not set", env }, null, 2)}\n`,
  );
  process.exit(0);
}

const r = runAws(["sts", "get-caller-identity", "--output", "json"]);
if (!r.ok) {
  process.stdout.write(
    `${JSON.stringify({ ok: false, env, stderr: (r.stderr || "").slice(0, 800) }, null, 2)}\n`,
  );
  process.exit(1);
}
let body;
try {
  body = JSON.parse(r.stdout || "{}");
} catch {
  body = { raw: (r.stdout || "").slice(0, 200) };
}
process.stdout.write(
  `${JSON.stringify(
    {
      ok: true,
      env,
      account: body.Account ?? null,
      arn: body.Arn ?? null,
      userId: body.UserId ?? null,
    },
    null,
    2,
  )}\n`,
);
