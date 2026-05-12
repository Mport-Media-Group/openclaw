#!/usr/bin/env node
/**
 * Minimal Playwright smoke: GitHub homepage screenshot (sequential, headless).
 * Run from repo root: node operator/browser-automation/runtime-check.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const reportsDir = path.join(repoRoot, "operator", "reports");
const outPng = path.join(reportsDir, "browser-runtime-check.png");

fs.mkdirSync(reportsDir, { recursive: true });

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://github.com", {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await page.screenshot({ path: outPng, fullPage: false });
  process.stdout.write(`OK screenshot -> ${path.relative(repoRoot, outPng)}\n`);
} finally {
  await browser?.close();
}
