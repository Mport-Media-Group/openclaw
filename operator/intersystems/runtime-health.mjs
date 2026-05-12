#!/usr/bin/env node
/**
 * Aggregate InterSystems operator diagnostics (read-only).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fhirEndpointPing } from "./fhir-tools.mjs";
import { hl7PeekStub, hl7QueueInspectStub } from "./hl7-tools.mjs";
import { describeIrisRuntime } from "./iris-runtime.mjs";
import { runPortalCheck } from "./portal-check.mjs";
import { productionEnvSnapshot, productionMonitorStub } from "./production-monitor.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const reportsDir = path.join(repoRoot, "operator", "reports");
const outPath = path.join(reportsDir, "intersystems-runtime-health-out.json");

const portal = await runPortalCheck();
const fhir = await fhirEndpointPing();
const hl7q = hl7QueueInspectStub();
const hl7sample = hl7PeekStub("MSH|^~\\&|APP|SEND|REC|DEST|202401010000||ADT^A01|1|P|2.5\rPID|1||");
const prod = productionMonitorStub();
const prodEnv = productionEnvSnapshot();
const iris = describeIrisRuntime();

const summary = {
  ok: true,
  at: new Date().toISOString(),
  iris,
  portal,
  fhir,
  hl7Queue: hl7q,
  hl7SamplePeek: hl7sample,
  production: prod,
  productionEnv: prodEnv,
};

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
