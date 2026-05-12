#!/usr/bin/env node
import { getAwsEnvSummary } from "./env.mjs";

const s = getAwsEnvSummary();
process.stdout.write(`${JSON.stringify({ ok: true, service: "aws", ...s }, null, 2)}\n`);
