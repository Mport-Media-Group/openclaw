#!/usr/bin/env node
/**
 * AgentEcos / DCB GCP health — read-only probe for Sasha.
 * Exit 0 when gcloud auth + project are usable; 1 with actionable gaps.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const home = os.homedir();
const configPath = path.join(home, ".openclaw", "openclaw.json");
const preferredPython = path.join(home, ".local", "python-3.12", "bin", "python3");
if (fs.existsSync(preferredPython)) {
  process.env.CLOUDSDK_PYTHON = preferredPython;
}
const gcloudCandidates = [path.join(home, "google-cloud-sdk", "bin", "gcloud"), "gcloud"];

function resolveGcloud() {
  for (const candidate of gcloudCandidates) {
    try {
      if (candidate === "gcloud") {
        execFileSync(candidate, ["--version"], { stdio: "pipe" });
        return candidate;
      }
      if (fs.existsSync(candidate)) {
        execFileSync(candidate, ["--version"], { stdio: "pipe" });
        return candidate;
      }
    } catch {
      // continue
    }
  }
  return null;
}

function readDcbConfig() {
  try {
    const raw = fs.readFileSync(configPath, "utf8");
    const cfg = JSON.parse(raw);
    const dcb = cfg?.plugins?.entries?.["executive-ops"]?.config?.dcb ?? {};
    return {
      gcpProjectId: dcb.gcpProjectId?.trim() || null,
      firebaseProjectId: dcb.firebaseProjectId?.trim() || null,
      firestoreDatabase: dcb.firestoreDatabase?.trim() || null,
      cloudRunServices: Array.isArray(dcb.cloudRunServices) ? dcb.cloudRunServices : [],
    };
  } catch {
    return {
      gcpProjectId: null,
      firebaseProjectId: null,
      firestoreDatabase: null,
      cloudRunServices: [],
    };
  }
}

function gcloudJson(gcloud, args) {
  const out = execFileSync(gcloud, [...args, "--format=json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(out || "[]");
}

function gcloudText(gcloud, args) {
  return execFileSync(gcloud, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function listCloudRunViaApi(gcloud, project, region) {
  const token = gcloudText(gcloud, ["auth", "print-access-token"]);
  const url = `https://run.googleapis.com/v2/projects/${project}/locations/${region}/services`;
  const out = execFileSync("curl", ["-sS", "-H", `Authorization: Bearer ${token}`, url], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const data = JSON.parse(out);
  const services = data.services ?? [];
  return services.map((s) => {
    const name = s.name?.split("/").pop() ?? "unknown";
    const terminal = s.terminalCondition ?? {};
    const ready = terminal.state === "CONDITION_SUCCEEDED" && terminal.type === "Ready";
    return {
      name,
      url: s.uri ?? null,
      ready,
      state: terminal.state,
      source: "run.googleapis.com/v2",
    };
  });
}

const dcb = readDcbConfig();
const envProject =
  process.env.GOOGLE_CLOUD_PROJECT?.trim() || process.env.GCP_PROJECT?.trim() || null;
const project = dcb.gcpProjectId || envProject;

const HTTP_PROBES = [
  {
    name: "firebase-hosting-health",
    url: "https://bridgeview-vwsdz.web.app/api/health",
    critical: true,
  },
  {
    name: "orchestrator-cloud-run-health",
    url: "https://orchestrator-ux6gobyjeq-uc.a.run.app/api/health",
    critical: true,
  },
  {
    name: "studio-apphosting-health",
    url: "https://studio--bridgeview-vwsdz.us-central1.hosted.app/api/health",
    critical: false,
  },
];

function probeHttpEndpoints() {
  return HTTP_PROBES.map((probe) => {
    try {
      const out = execFileSync(
        "curl",
        ["-sS", "-m", "12", "-o", "/dev/null", "-w", "%{http_code}", probe.url],
        { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      ).trim();
      const status = Number.parseInt(out, 10);
      return {
        ...probe,
        status,
        ok: status >= 200 && status < 300,
      };
    } catch (err) {
      return { ...probe, status: null, ok: false, error: err.message };
    }
  });
}

const report = {
  ok: false,
  generatedAt: new Date().toISOString(),
  gcloud: resolveGcloud(),
  config: dcb,
  envProject,
  effectiveProject: project,
  auth: { accounts: [], activeAccount: null },
  cloudRun: { region: "us-central1", services: [] },
  httpProbes: [],
  gaps: [],
};

if (!report.gcloud) {
  report.gaps.push("Install gcloud CLI or add ~/google-cloud-sdk/bin to PATH.");
} else {
  try {
    const accounts = gcloudJson(report.gcloud, ["auth", "list"]);
    report.auth.accounts = accounts.map((a) => ({
      account: a.account,
      status: a.status,
    }));
    report.auth.activeAccount = accounts.find((a) => a.status === "ACTIVE")?.account ?? null;
    if (!report.auth.activeAccount) {
      report.gaps.push("Run: gcloud auth login");
    }
  } catch (err) {
    report.gaps.push(`gcloud auth list failed: ${err.message}`);
  }
}

if (!project) {
  report.gaps.push(
    "Set plugins.entries.executive-ops.config.dcb.gcpProjectId or GCP_PROJECT in ~/.openclaw/.env",
  );
} else if (report.gcloud && report.auth.activeAccount) {
  const region = "us-central1";
  try {
    const services = gcloudJson(report.gcloud, [
      "run",
      "services",
      "list",
      `--project=${project}`,
      `--region=${region}`,
    ]);
    report.cloudRun.services = services.map((s) => ({
      name: s.metadata?.name,
      url: s.status?.url,
      ready: s.status?.conditions?.some((c) => c.type === "Ready" && c.status === "True"),
      source: "gcloud",
    }));
    report.ok = true;
  } catch (err) {
    const msg = String(err.message ?? err);
    const pythonCrash =
      msg.includes("unsupported operand type") || msg.includes("CommandLoadFailure");
    if (pythonCrash) {
      report.gaps.push(
        "gcloud run CLI broken on Python 3.9 — using Cloud Run REST API fallback. Upgrade gcloud Python (3.10+) when convenient.",
      );
    }
    try {
      report.cloudRun.services = listCloudRunViaApi(report.gcloud, project, region);
      report.ok = report.cloudRun.services.length > 0;
      if (!report.ok) {
        report.gaps.push("Cloud Run REST API returned no services.");
      }
    } catch (apiErr) {
      report.gaps.push(`Cloud Run list failed: ${apiErr.message}`);
    }
  }
}

report.httpProbes = probeHttpEndpoints();
const criticalHttpOk = report.httpProbes.filter((p) => p.critical).every((p) => p.ok);
if (!criticalHttpOk) {
  const failed = report.httpProbes
    .filter((p) => p.critical && !p.ok)
    .map((p) => p.name)
    .join(", ");
  report.gaps.push(`Critical HTTP probe(s) failed: ${failed}`);
}
if (report.cloudRun.services.some((s) => !s.ready)) {
  const bad = report.cloudRun.services
    .filter((s) => !s.ready)
    .map((s) => s.name)
    .join(", ");
  report.gaps.push(
    `Cloud Run not Ready: ${bad} (may be stale; production health uses bridgeview-vwsdz.web.app)`,
  );
}
report.ok =
  Boolean(report.auth.activeAccount) &&
  Boolean(project) &&
  criticalHttpOk &&
  report.cloudRun.services.length > 0;

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
process.exit(report.ok ? 0 : 1);
