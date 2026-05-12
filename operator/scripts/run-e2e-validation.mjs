#!/usr/bin/env node
/**
 * Sequential, low-RAM validation for the operator stack.
 * Run from repo root: node operator/scripts/run-e2e-validation.mjs
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const operatorRoot = path.resolve(__dirname, "..");
const reportsDir = path.join(operatorRoot, "reports");
const logFile = path.join(reportsDir, "validation-run.log");
const jsonOut = path.join(reportsDir, "last-validation.json");

function log(line) {
  const stamp = new Date().toISOString();
  const text = `[${stamp}] ${line}\n`;
  fs.appendFileSync(logFile, text, "utf8");
  process.stdout.write(text);
}

function pnpmBin() {
  const local = path.join(repoRoot, "node_modules", ".bin", "pnpm");
  if (fs.existsSync(local)) {
    return local;
  }
  return "pnpm";
}

function run(cmd, args, opts = {}) {
  try {
    const out = execFileSync(cmd, args, {
      encoding: "utf8",
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
      ...opts,
    });
    return { ok: true, stdout: out };
  } catch (e) {
    const err = e;
    return {
      ok: false,
      stderr: err.stderr?.toString?.() ?? String(err),
      stdout: err.stdout?.toString?.() ?? "",
    };
  }
}

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(logFile, "", "utf8");

const results = {
  startedAt: new Date().toISOString(),
  steps: [],
};

function step(name, fn, severity = "required") {
  log(`START ${name}`);
  const r = fn();
  results.steps.push({ name, severity, ...r });
  const tag = r.ok ? "OK" : severity === "advisory" ? "WARN" : "FAIL";
  log(`${tag} ${name}${r.detail ? `: ${r.detail}` : ""}`);
}

step("parse_operator_models_json", () => {
  try {
    const p = path.join(operatorRoot, "configs", "models.json");
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    if (typeof j !== "object" || j === null) {
      return { ok: false, detail: "not an object" };
    }
    return { ok: true, detail: `local keys: ${Object.keys(j.local ?? {}).length}` };
  } catch (e) {
    return { ok: false, detail: String(e) };
  }
});

step("parse_operator_registry_json", () => {
  try {
    const p = path.join(operatorRoot, "agents", "registry.json");
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    const n = j.agents?.length ?? 0;
    return { ok: n > 0, detail: `${n} agents` };
  } catch (e) {
    return { ok: false, detail: String(e) };
  }
});

step("pnpm_test_operator_stack", () => {
  const r = run(pnpmBin(), ["test", "extensions/operator-stack"], { env: process.env });
  if (!r.ok) {
    return { ok: false, detail: (r.stderr || r.stdout).slice(0, 2000) };
  }
  return { ok: true };
});

step(
  "node_version",
  () => {
    const major = Number(process.versions.node.split(".")[0] ?? 0);
    const minor = Number(process.versions.node.split(".")[1] ?? 0);
    const ok = major > 22 || (major === 22 && minor >= 16);
    return {
      ok,
      detail: `node ${process.versions.node} (openclaw doctor requires >=22.16.0)`,
    };
  },
  "advisory",
);

step(
  "ollama_cli",
  () => {
    const r = run("which", ["ollama"]);
    if (!r.ok) {
      return { ok: false, detail: "ollama not on PATH" };
    }
    const v = run("ollama", ["--version"]);
    return { ok: true, detail: (v.stdout || "").trim() || "ollama present" };
  },
  "advisory",
);

step("openclaw_doctor", () => {
  const doctorLog = path.join(reportsDir, "doctor-latest.txt");
  const r = run(pnpmBin(), ["openclaw", "doctor"], { env: process.env });
  const header = `=== ${new Date().toISOString()} openclaw doctor ===\n`;
  const body = r.ok ? r.stdout : `${r.stdout}\n${r.stderr}`;
  fs.appendFileSync(doctorLog, `${header}${body}\n`, "utf8");
  if (!r.ok) {
    return { ok: false, detail: (r.stderr || r.stdout).slice(0, 1500) };
  }
  return { ok: true, detail: `wrote ${path.relative(repoRoot, doctorLog)}` };
});

step(
  "playwright_runtime_check",
  () => {
    const script = path.join(operatorRoot, "browser-automation", "runtime-check.mjs");
    if (!fs.existsSync(script)) {
      return { ok: false, detail: "runtime-check.mjs missing" };
    }
    const r = run(process.execPath, [script], { env: process.env });
    if (!r.ok) {
      return { ok: false, detail: (r.stderr || r.stdout).slice(0, 1500) };
    }
    const png = path.join(reportsDir, "browser-runtime-check.png");
    return {
      ok: fs.existsSync(png),
      detail: fs.existsSync(png) ? "screenshot ok" : "screenshot missing",
    };
  },
  "advisory",
);

step(
  "ollama_model_probe",
  () => {
    const script = path.join(operatorRoot, "scripts", "test-local-models.mjs");
    if (!fs.existsSync(script)) {
      return { ok: false, detail: "test-local-models.mjs missing" };
    }
    const r = run(process.execPath, [script], { env: process.env });
    return {
      ok: r.ok,
      detail: r.ok ? "ollama probe ok" : (r.stderr || r.stdout).slice(0, 800),
    };
  },
  "advisory",
);

step(
  "sasha_emit_runtime_plan",
  () => {
    const script = path.join(operatorRoot, "sasha", "emit-runtime-plan.mjs");
    const r = run(process.execPath, [script], { env: process.env });
    const out = path.join(reportsDir, "sasha-runtime-plan.json");
    return {
      ok: r.ok && fs.existsSync(out),
      detail: r.ok ? "plan emitted" : (r.stderr || r.stdout).slice(0, 800),
    };
  },
  "advisory",
);

step(
  "founder_context_health",
  () => {
    const script = path.join(operatorRoot, "founder", "founder-health.mjs");
    if (!fs.existsSync(script)) {
      return { ok: false, detail: "founder-health.mjs missing" };
    }
    const r = run(process.execPath, [script], { env: process.env });
    return {
      ok: r.ok,
      detail: r.ok ? "founder pack valid" : (r.stderr || r.stdout).slice(0, 800),
    };
  },
  "advisory",
);

fs.writeFileSync(jsonOut, `${JSON.stringify(results, null, 2)}\n`, "utf8");
log(`Wrote ${path.relative(repoRoot, jsonOut)}`);

const failedRequired = results.steps.filter((s) => !s.ok && s.severity !== "advisory");
process.exit(failedRequired.length > 0 ? 1 : 0);
