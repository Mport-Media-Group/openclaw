// Dossier IO: read existing dossier, parse Recent signals, merge new entries, prune > 30 days, write back.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const SECTION_HEADING = "## Recent signals (last 30 days)";

function bootstrapDossier(targetMeta) {
  const today = new Date().toISOString().slice(0, 10);
  return [
    `# ${targetMeta.name}`,
    "",
    `**Type:** ${targetMeta.type}`,
    `**Last refreshed:** ${today}`,
    `**Why we watch:** ${targetMeta.why}`,
    "",
    "## Snapshot",
    "- HQ / size / public ticker:",
    "- Recent funding / market cap:",
    "- DCB-relevant business line:",
    "- Known stance on interop / post-acute:",
    "",
    SECTION_HEADING,
    "",
    "## Strategic posture",
    "- Acquisition appetite:",
    "- Partnership entry points:",
    "- Competitive threat level:",
    "- Past behavior pattern:",
    "",
    "## Outreach hooks (draft only — `investorMessaging` approval required to send)",
    "- _none drafted_",
    "",
    "## Open questions for King",
    "- _none open_",
    "",
  ].join("\n");
}

// Recent signals lines have shape:
//   - YYYY-MM-DD — source — headline — [category?] — link
function parseSignalLine(line) {
  const m =
    /^-\s+(\d{4}-\d{2}-\d{2})\s+—\s+(.+?)\s+—\s+(.+?)\s+—\s+(?:\[([^\]]+)\]\s+—\s+)?(\S+)\s*$/.exec(
      line,
    );
  if (!m) return null;
  return { date: m[1], source: m[2], headline: m[3], category: m[4] || null, link: m[5] };
}

function formatSignalLine(entry) {
  const cat = entry.category ? `[${entry.category}] — ` : "";
  return `- ${entry.date} — ${entry.source || "unknown"} — ${entry.headline} — ${cat}${entry.link}`;
}

function withinLastNDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00Z").getTime();
  const cutoff = Date.now() - n * 24 * 60 * 60 * 1000;
  return d >= cutoff;
}

function splitIntoSections(text) {
  // Split on lines starting with "## " keeping the headings.
  const lines = text.split("\n");
  const sections = [];
  let current = { heading: null, body: [] };
  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      sections.push(current);
      current = { heading: line, body: [] };
    } else {
      current.body.push(line);
    }
  }
  sections.push(current);
  return sections;
}

function joinSections(sections) {
  return sections
    .map((s) => (s.heading ? `${s.heading}\n${s.body.join("\n")}` : s.body.join("\n")))
    .join("\n");
}

export function upsertSignals(dossierPath, targetMeta, newEntries) {
  let text = existsSync(dossierPath)
    ? readFileSync(dossierPath, "utf8")
    : bootstrapDossier(targetMeta);

  // Refresh "Last refreshed" line
  const today = new Date().toISOString().slice(0, 10);
  text = text.replace(/^(\*\*Last refreshed:\*\*)\s+.*$/m, `$1 ${today}`);

  const sections = splitIntoSections(text);
  const signalsSection = sections.find(
    (s) => s.heading && s.heading.startsWith("## Recent signals"),
  );
  if (!signalsSection) {
    // dossier exists but is malformed — bootstrap a fresh one
    text = bootstrapDossier(targetMeta);
    return upsertSignals(dossierPath, targetMeta, newEntries);
  }

  // Parse existing entries
  const existing = [];
  const preserveLines = [];
  let inEntryArea = true;
  for (const line of signalsSection.body) {
    if (inEntryArea && line.startsWith("- ")) {
      const parsed = parseSignalLine(line);
      if (parsed) existing.push(parsed);
      else preserveLines.push(line);
    } else if (line.trim() === "" || /^<!--/.test(line)) {
      preserveLines.push(line);
    } else {
      inEntryArea = false;
      preserveLines.push(line);
    }
  }

  // Merge: dedupe by link, keep earliest date for a given link
  const byLink = new Map();
  for (const e of existing) byLink.set(e.link, e);
  let added = 0;
  for (const e of newEntries) {
    if (!byLink.has(e.link)) {
      byLink.set(e.link, e);
      added++;
    }
  }

  // Prune past 30 days
  const merged = Array.from(byLink.values())
    .filter((e) => withinLastNDays(e.date, 30))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)); // newest first

  // Rebuild signals section body
  const body = [
    "<!-- fetch.mjs appends entries here; oldest auto-pruned past 30 days -->",
    ...merged.map(formatSignalLine),
    "",
  ];

  signalsSection.body = body;
  writeFileSync(dossierPath, joinSections(sections), "utf8");
  return { added, total: merged.length };
}

export function readSignalsSince(dossierPath, cutoffIso) {
  if (!existsSync(dossierPath)) return [];
  const text = readFileSync(dossierPath, "utf8");
  const sections = splitIntoSections(text);
  const signalsSection = sections.find(
    (s) => s.heading && s.heading.startsWith("## Recent signals"),
  );
  if (!signalsSection) return [];
  const cutoffDate = cutoffIso.slice(0, 10);
  const out = [];
  for (const line of signalsSection.body) {
    if (!line.startsWith("- ")) continue;
    const p = parseSignalLine(line);
    if (!p) continue;
    if (p.date >= cutoffDate) out.push(p);
  }
  return out;
}

export function bootstrapPath(targetMeta, dossiersDir) {
  return path.join(dossiersDir, `${targetMeta.slug}.md`);
}
