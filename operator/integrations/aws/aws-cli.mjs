/**
 * Sequential AWS CLI helpers (read-only). Never prints secrets.
 */
import { execFileSync } from "node:child_process";

/**
 * @param {string[]} args
 */
export function awsCliPresent() {
  try {
    execFileSync("which", ["aws"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string[]} args
 */
export function runAws(args) {
  try {
    const stdout = execFileSync("aws", args, {
      encoding: "utf8",
      maxBuffer: 2 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, stdout };
  } catch (e) {
    const err = e;
    return {
      ok: false,
      stderr: err.stderr?.toString?.() ?? String(err),
      stdout: err.stdout?.toString?.() ?? "",
    };
  }
}
