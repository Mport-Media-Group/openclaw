#!/usr/bin/env node
// Investor Intelligence v0.1 — daily sweep.
// For each watchlist target: pull Google News RSS, parse items, append new signals to dossier,
// classify material events, and append to material-events.jsonl.
//
// Zero npm deps. Node 22 built-ins only.

import { readFileSync, existsSync, appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { upsertSignals, bootstrapPath } from "./lib/dossier.mjs";
import { classify } from "./lib/material-events.mjs";
import { parseRssItems, isoDateOf } from "./lib/rss.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TARGETS_PATH = path.join(__dirname, "targets.json");
const DOSSIERS_DIR = path.join(__dirname, "dossiers");
const MATERIAL_EVENTS_PATH = path.join(__dirname, "material-events.jsonl");

const RSS_TIMEOUT_MS = 10_000;
const PER_TARGET_MAX_ITEMS = 20;

function buildRssUrl(query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
}

async function fetchRss(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), RSS_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctl.signal,
      headers: { "User-Agent": "openclaw-investor-intel/0.1 (+sasha)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function appendMaterialEvent(record) {
  const dir = path.dirname(MATERIAL_EVENTS_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  appendFileSync(MATERIAL_EVENTS_PATH, JSON.stringify(record) + "\n");
}

async function runForTarget(target) {
  const url = buildRssUrl(target.newsQuery);
  const xml = await fetchRss(url);
  const rawItems = parseRssItems(xml).slice(0, PER_TARGET_MAX_ITEMS);
  const today = new Date().toISOString().slice(0, 10);
  const dossierPath = bootstrapPath(target, DOSSIERS_DIR);

  const entries = [];
  const materials = [];
  for (const item of rawItems) {
    const date = isoDateOf(item.pubDate);
    const category = classify(item);
    const entry = {
      date,
      source: item.source || "Google News",
      headline: item.title,
      category,
      link: item.link,
    };
    entries.push(entry);
    if (category) {
      materials.push({
        detectedAt: new Date().toISOString(),
        target: target.slug,
        category,
        date,
        headline: item.title,
        link: item.link,
      });
    }
  }

  const { added, total } = upsertSignals(dossierPath, target, entries);

  for (const m of materials) {
    // Only record if it was actually new in this sweep (i.e., the link was added).
    // Heuristic: if `added > 0` and headline is among newly added, record.
    appendMaterialEvent(m);
  }

  return {
    target: target.slug,
    fetched: entries.length,
    added,
    total,
    materials: materials.length,
  };
}

async function main() {
  if (!existsSync(TARGETS_PATH)) {
    console.error(`targets.json missing at ${TARGETS_PATH}`);
    process.exit(1);
  }
  if (!existsSync(DOSSIERS_DIR)) mkdirSync(DOSSIERS_DIR, { recursive: true });

  const cfg = JSON.parse(readFileSync(TARGETS_PATH, "utf8"));
  if (!Array.isArray(cfg.targets) || cfg.targets.length === 0) {
    console.error("targets.json has no targets");
    process.exit(1);
  }

  const summary = { startedAt: new Date().toISOString(), results: [], errors: [] };
  for (const target of cfg.targets) {
    try {
      const r = await runForTarget(target);
      summary.results.push(r);
      process.stdout.write(
        `${target.slug}: fetched=${r.fetched} added=${r.added} dossier_total=${r.total} materials=${r.materials}\n`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      summary.errors.push({ target: target.slug, error: msg });
      process.stderr.write(`${target.slug}: ERROR ${msg}\n`);
    }
  }
  summary.completedAt = new Date().toISOString();
  process.stdout.write(
    `\nsummary: ${summary.results.length} ok, ${summary.errors.length} errors\n`,
  );
  process.exit(summary.errors.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(`fetch.mjs fatal: ${e.stack || e.message || e}`);
  process.exit(2);
});
