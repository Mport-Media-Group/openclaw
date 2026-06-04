#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const reportsDir = path.join(repoRoot, "operator", "reports");
const outPath = path.join(reportsDir, "executive-runtime-health.json");

function resolveBinary(candidates) {
  const value = process.env.PATH || "";
  for (const dir of value.split(path.delimiter).filter(Boolean)) {
    for (const candidate of candidates) {
      const candidatePath = path.join(dir, candidate);
      try {
        fs.accessSync(candidatePath, fs.constants.X_OK);
        return candidatePath;
      } catch {
        // Keep searching.
      }
    }
  }
  return null;
}

function envState(name) {
  return process.env[name]?.trim() ? "set" : "unset";
}

function dirState(p) {
  try {
    const stat = fs.statSync(p);
    return stat.isDirectory() ? "present" : "missing";
  } catch {
    return "missing";
  }
}

function fileState(p) {
  try {
    const stat = fs.statSync(p);
    return stat.isFile() ? "present" : "missing";
  } catch {
    return "missing";
  }
}

function toMiB(bytes) {
  return Math.round(bytes / (1024 * 1024));
}

const browserProfilesRoot = path.join(repoRoot, "operator", "browser-automation", ".profiles");

const summary = {
  ok: true,
  generatedAt: new Date().toISOString(),
  machine: {
    platform: process.platform,
    release: os.release(),
    uptimeSeconds: Math.round(os.uptime()),
    cpus: os.cpus().length,
    totalMemMiB: toMiB(os.totalmem()),
    freeMemMiB: toMiB(os.freemem()),
    loadAvg: os.loadavg().map((entry) => Number(entry.toFixed(2))),
    tmpDir: os.tmpdir(),
  },
  contracts: {
    github: {
      ghCli: resolveBinary(["gh"]),
      token: envState("GH_TOKEN") === "set" || envState("GITHUB_TOKEN") === "set" ? "set" : "unset",
    },
    cursor: {
      cli: resolveBinary(["cursor-agent", "cursor"]),
      acpxConfigHint: "Enable plugins.entries.acpx.enabled for ACP-backed Cursor runs.",
    },
    vault: {
      provider: "1password",
      cli: resolveBinary(["op"]),
      accountHint: process.env.OP_ACCOUNT?.trim() ? "set" : "unset",
    },
    memory: {
      provider: "supabase",
      projectUrl: envState("SUPABASE_URL"),
      anonKey: envState("SUPABASE_ANON_KEY"),
      serviceRole: envState("SUPABASE_SERVICE_ROLE_KEY"),
    },
  },
  browser: {
    profilesRoot: browserProfilesRoot,
    profilesRootState: dirState(browserProfilesRoot),
    linkedinPolicy: "drafts_only_human_send",
    linkedinHealthScript: fileState(
      path.join(repoRoot, "operator", "integrations", "linkedin", "health.mjs"),
    ),
    canvaHealthScript: fileState(
      path.join(repoRoot, "operator", "integrations", "canva", "health.mjs"),
    ),
    playwrightChromiumHint:
      "Run `pnpm exec playwright install chromium` from the repo root if browser flows need Chromium.",
  },
  dcb: (() => {
    let fromConfig = {};
    try {
      const cfgPath = path.join(os.homedir(), ".openclaw", "openclaw.json");
      const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
      const dcb = cfg?.plugins?.entries?.["executive-ops"]?.config?.dcb ?? {};
      fromConfig = {
        googleCloudProject: dcb.gcpProjectId?.trim() || null,
        firebaseProject: dcb.firebaseProjectId?.trim() || null,
        cloudRunServices: Array.isArray(dcb.cloudRunServices) ? dcb.cloudRunServices : [],
      };
    } catch {
      // ignore
    }
    return {
      googleCloudProject:
        fromConfig.googleCloudProject ||
        process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
        process.env.GCP_PROJECT?.trim() ||
        null,
      firebaseProject: fromConfig.firebaseProject || process.env.FIREBASE_PROJECT?.trim() || null,
      cloudRunService: process.env.CLOUD_RUN_SERVICE?.trim() || null,
      cloudRunServices: fromConfig.cloudRunServices ?? [],
      gcloudAuth: fileState(path.join(os.homedir(), ".config", "gcloud", "credentials.db")),
    };
  })(),
  policy: {
    githubWrites: "approval_gate_recommended",
    cursorWrites: "approval_gate_recommended",
    publicPosts: "human_approval_required",
    investorMessaging: "human_approval_required",
    deployments: "human_approval_required",
  },
};

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
