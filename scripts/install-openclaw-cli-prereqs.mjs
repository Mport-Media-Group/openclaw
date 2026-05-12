#!/usr/bin/env node
/**
 * Install common OpenClaw skill CLI prerequisites:
 * - If Homebrew exists: `brew install gh ffmpeg jq ripgrep`
 * - Else on macOS: download official gh / jq / ripgrep into
 *   $OPENCLAW_LOCAL_BIN or ~/.local/bin; Intel-only static ffmpeg from evermeet.cx.
 *
 * Apple Silicon: ffmpeg is skipped without Homebrew (evermeet is Intel-only).
 * Add the bin dir to PATH for shells and the gateway, then re-run doctor / skills.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { chmod, copyFile, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

function brewPath() {
  for (const p of ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"]) {
    if (existsSync(p)) {
      return p;
    }
  }
  return null;
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8", stdio: "inherit" });
  return r.status ?? 1;
}

/** @param {string} url @param {string} destFile */
function curlDownload(url, destFile) {
  const r = spawnSync("curl", ["-fSL", "-o", destFile, url], { stdio: "inherit" });
  if ((r.status ?? 1) !== 0) {
    throw new Error(`curl download failed (${r.status}): ${url}`);
  }
}

/** @param {string} url @param {string} destFile */
async function downloadToFile(url, destFile) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "openclaw-install-openclaw-cli-prereqs/1" },
  });
  if (!res.ok) {
    throw new Error(`GET ${url} -> ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(destFile, buf);
}

/** @param {string} jsonUrl */
async function fetchJson(jsonUrl) {
  const res = await fetch(jsonUrl, {
    headers: { "User-Agent": "openclaw-install-openclaw-cli-prereqs/1" },
  });
  if (!res.ok) {
    throw new Error(`GET ${jsonUrl} -> ${res.status}`);
  }
  return res.json();
}

function darwinArch() {
  const u = spawnSync("uname", ["-m"], { encoding: "utf8" });
  const m = (u.stdout ?? "").trim();
  if (m === "arm64" || m === "aarch64") {
    return "arm64";
  }
  return "amd64";
}

function stripQuarantine(file) {
  if (process.platform !== "darwin") {
    return;
  }
  spawnSync("xattr", ["-dr", "com.apple.quarantine", file], { stdio: "ignore" });
}

async function installWithBrew(brew) {
  process.stderr.write(`Using Homebrew: ${brew}\n`);
  return run(brew, ["install", "gh", "ffmpeg", "jq", "ripgrep"]);
}

async function installGh(toDir, arch) {
  const suffix = arch === "arm64" ? "macOS_arm64.zip" : "macOS_amd64.zip";
  const rel = await fetchJson("https://api.github.com/repos/cli/cli/releases/latest");
  const asset = rel.assets?.find((a) => a.name?.endsWith(suffix));
  if (!asset?.browser_download_url) {
    throw new Error(`No gh release asset matching *_${suffix}`);
  }
  const zipPath = path.join(os.tmpdir(), asset.name);
  curlDownload(asset.browser_download_url, zipPath);
  const inner = `${path.basename(asset.name, ".zip")}/bin/gh`;
  const dest = path.join(toDir, "gh");
  const tmp = await mkdtemp(path.join(os.tmpdir(), "ghzip-"));
  const st = spawnSync("unzip", ["-q", zipPath, "-d", tmp], { stdio: "inherit" });
  if (st.status !== 0) {
    await rm(tmp, { recursive: true, force: true });
    throw new Error(`unzip extract gh failed: ${st.status}`);
  }
  const extracted = path.join(tmp, ...inner.split("/"));
  await copyFile(extracted, dest);
  await rm(tmp, { recursive: true, force: true });
  await chmod(dest, 0o755);
  stripQuarantine(dest);
  rmSync(zipPath, { force: true });
  process.stderr.write(`Installed gh -> ${dest}\n`);
}

async function installJq(toDir, arch) {
  const name = arch === "arm64" ? "jq-macos-arm64" : "jq-macos-amd64";
  const url = `https://github.com/jqlang/jq/releases/download/jq-1.7.1/${name}`;
  const dest = path.join(toDir, "jq");
  await downloadToFile(url, dest);
  await chmod(dest, 0o755);
  stripQuarantine(dest);
  process.stderr.write(`Installed jq -> ${dest}\n`);
}

async function installRipgrep(toDir, arch) {
  const rel = await fetchJson("https://api.github.com/repos/BurntSushi/ripgrep/releases/latest");
  const tag = String(rel.tag_name ?? "").replace(/^v/, "");
  const triple = arch === "arm64" ? "aarch64-apple-darwin" : "x86_64-apple-darwin";
  const tgzName = `ripgrep-${tag}-${triple}.tar.gz`;
  const asset = rel.assets?.find((a) => a.name === tgzName);
  if (!asset?.browser_download_url) {
    throw new Error(`No ripgrep asset ${tgzName}`);
  }
  const tgz = path.join(os.tmpdir(), tgzName);
  curlDownload(asset.browser_download_url, tgz);
  const tmp = await mkdtemp(path.join(os.tmpdir(), "rg-"));
  const st = spawnSync("tar", ["-xzf", tgz, "-C", tmp]);
  if (st.status !== 0) {
    throw new Error(`tar extract ripgrep failed: ${st.status}`);
  }
  const folder = `ripgrep-${tag}-${triple}`;
  const src = path.join(tmp, folder, "rg");
  const dest = path.join(toDir, "rg");
  await copyFile(src, dest);
  await chmod(dest, 0o755);
  stripQuarantine(dest);
  await rm(tgz, { force: true });
  await rm(tmp, { recursive: true, force: true });
  process.stderr.write(`Installed rg -> ${dest}\n`);
}

async function installFfmpegIntel(toDir) {
  const url = "https://evermeet.cx/ffmpeg/getrelease/zip";
  const zipPath = path.join(os.tmpdir(), `ffmpeg-release-${Date.now()}.zip`);
  curlDownload(url, zipPath);
  const dest = path.join(toDir, "ffmpeg");
  const tmp = await mkdtemp(path.join(os.tmpdir(), "ffzip-"));
  const st = spawnSync("unzip", ["-q", zipPath, "-d", tmp], { stdio: "inherit" });
  if (st.status !== 0) {
    await rm(tmp, { recursive: true, force: true });
    throw new Error(`unzip extract ffmpeg failed: ${st.status}`);
  }
  const extracted = path.join(tmp, "ffmpeg");
  await copyFile(extracted, dest);
  await rm(tmp, { recursive: true, force: true });
  await chmod(dest, 0o755);
  stripQuarantine(dest);
  rmSync(zipPath, { force: true });
  process.stderr.write(`Installed ffmpeg -> ${dest}\n`);
}

async function main() {
  if (process.platform !== "darwin") {
    process.stderr.write(
      "This installer only supports macOS. On Linux use your distro package manager.\n",
    );
    process.exit(1);
  }

  const brew = brewPath();
  if (brew) {
    process.exit(await installWithBrew(brew));
  }

  const toDir = process.env.OPENCLAW_LOCAL_BIN?.trim() || path.join(os.homedir(), ".local", "bin");
  mkdirSync(toDir, { recursive: true });
  process.stderr.write(`Installing into ${toDir} (no Homebrew found).\n`);

  const arch = darwinArch();
  try {
    await installGh(toDir, arch);
    await installJq(toDir, arch);
    await installRipgrep(toDir, arch);
    if (arch === "amd64") {
      await installFfmpegIntel(toDir);
    } else {
      process.stderr.write(
        "Skipping static ffmpeg on Apple Silicon (evermeet builds are Intel-only). Install Homebrew, then: brew install ffmpeg\n",
      );
    }
  } catch (e) {
    process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
    process.exit(1);
  }

  process.stderr.write(
    `\nAdd to PATH (shell profile or gateway env), then re-run doctor / re-enable skills as needed:\n  export PATH="${toDir}:$PATH"\n`,
  );
  process.stderr.write("Then from the OpenClaw repo: pnpm claw:max-readiness\n");
  process.exit(0);
}

await main();
