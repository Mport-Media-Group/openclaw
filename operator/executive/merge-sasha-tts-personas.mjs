#!/usr/bin/env node
/**
 * Merge Sasha TTS personas into ~/.openclaw/openclaw.json (messages.tts.personas).
 * Applies SASHA_VOICE_ID from env when set.
 *
 * Usage: node operator/executive/merge-sasha-tts-personas.mjs [--dry-run]
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(os.homedir(), ".openclaw", "openclaw.json");
const PERSONAS_PATH = path.join(__dirname, "openclaw-tts-sasha-personas.json");

function readSashaVoiceId() {
  const envPath = path.join(os.homedir(), ".openclaw", ".env");
  if (process.env.SASHA_VOICE_ID?.trim()) {
    return process.env.SASHA_VOICE_ID.trim();
  }
  if (fs.existsSync(envPath)) {
    const match = fs.readFileSync(envPath, "utf8").match(/^\s*SASHA_VOICE_ID\s*=\s*([^\n]+)/m);
    if (match) {
      return match[1].trim().replace(/^["']|["']$/g, "");
    }
  }
  return undefined;
}

function applyVoiceIdToPersonas(personas, voiceId) {
  const sashaKeys = Object.keys(personas).filter(
    (id) => id.startsWith("sasha-") || id.startsWith("openclaw-sultry"),
  );
  for (const id of sashaKeys) {
    const binding = personas[id]?.providers?.elevenlabs;
    if (binding && typeof binding === "object") {
      binding.voiceId = voiceId;
    }
  }
}

function ensureSashaAgentTts(config) {
  if (!Array.isArray(config.agents?.list)) {
    return;
  }
  for (const agent of config.agents.list) {
    if (agent?.id !== "sasha") {
      continue;
    }
    agent.tts = { ...agent.tts, persona: "openclaw-sultry" };
  }
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Missing config: ${CONFIG_PATH}`);
  }
  const personas = JSON.parse(fs.readFileSync(PERSONAS_PATH, "utf8"));
  const overrideVoiceId = readSashaVoiceId();
  if (overrideVoiceId) {
    applyVoiceIdToPersonas(personas, overrideVoiceId);
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  config.messages ??= {};
  config.messages.tts ??= {};
  config.messages.tts.personas = {
    ...config.messages.tts.personas,
    ...personas,
  };
  config.messages.tts.persona ??= "openclaw-sultry";
  const elevenlabs = config.messages.tts.providers?.elevenlabs;
  if (elevenlabs && typeof elevenlabs === "object") {
    delete elevenlabs.outputFormat;
    delete elevenlabs.voiceId;
  }
  ensureSashaAgentTts(config);
  const output = `${JSON.stringify(config, null, 2)}\n`;
  if (dryRun) {
    process.stdout.write(output);
    return;
  }
  fs.writeFileSync(CONFIG_PATH, output);
  process.stdout.write(
    `Merged ${Object.keys(personas).length} personas into ${CONFIG_PATH}${overrideVoiceId ? ` (voiceId=${overrideVoiceId})` : ""}\n`,
  );
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
