#!/usr/bin/env node
/**
 * Optional Playwright snippet for vendor public pages (no login).
 * Gated by OPERATOR_INTEGRATION_PLAYWRIGHT=1. One browser launch; closes in finally.
 */
const url = process.argv[2]?.trim() || "https://www.zoho.com/";
if (process.env.OPERATOR_INTEGRATION_PLAYWRIGHT !== "1") {
  process.stdout.write(
    `${JSON.stringify({ ok: true, skipped: true, reason: "set OPERATOR_INTEGRATION_PLAYWRIGHT=1" }, null, 2)}\n`,
  );
  process.exit(0);
}

let browser;
try {
  const { chromium } = await import("playwright-core");
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  const title = await page.title();
  const excerpt = await page.evaluate(() =>
    (document.body?.innerText ?? "").replace(/\s+/g, " ").trim().slice(0, 1200),
  );
  process.stdout.write(`${JSON.stringify({ ok: true, url, title, excerpt }, null, 2)}\n`);
} catch (e) {
  process.stdout.write(
    `${JSON.stringify({ ok: false, url, error: e instanceof Error ? e.message : String(e) }, null, 2)}\n`,
  );
  process.exit(1);
} finally {
  await browser?.close();
}
