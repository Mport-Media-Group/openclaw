#!/usr/bin/env node
/**
 * Local ElevenLabs speak helper for operator/Cursor playback (macOS afplay).
 *
 * Usage:
 *   node operator/executive/speak-voice.mjs --voice male "Hello from the operator."
 *   node operator/executive/speak-voice.mjs --voice agent "Hello from Sasha."
 *   node operator/executive/speak-voice.mjs --voice agent --mode flirty "Private tone check."
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SASHA_RACHEL_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

/** macOS afplay only — do not set on gateway config (Discord needs native Opus). */
const LOCAL_OUTPUT_FORMAT = "mp3_44100_192";

const SASHA_BASE = {
  stability: 0.5,
  similarity_boost: 0.85,
  style: 0.3,
  use_speaker_boost: true,
  speed: 0.92,
};

const SASHA_MODES = {
  default: { ...SASHA_BASE },
  casual: { ...SASHA_BASE, style: 0.4, speed: 1.0 },
  executive: { ...SASHA_BASE, stability: 0.55, style: 0.2 },
  comfort: { ...SASHA_BASE, stability: 0.45, speed: 0.85 },
  flirty: { ...SASHA_BASE, style: 0.35, speed: 0.88 },
  alert: { ...SASHA_BASE, stability: 0.6, speed: 0.95 },
  builder: { ...SASHA_BASE, style: 0.38, speed: 0.98 },
};

const VOICES = {
  male: {
    voiceId: "pNInz6obpgDQGcFmaJgB",
    modelId: "eleven_multilingual_v2",
    voiceSettings: {
      stability: 0.55,
      similarity_boost: 0.82,
      style: 0.12,
      use_speaker_boost: true,
      speed: 1.0,
    },
  },
};

function readEnvValue(key) {
  if (process.env[key]?.trim()) {
    return process.env[key].trim();
  }
  const envPath = path.join(os.homedir(), ".openclaw", ".env");
  if (!fs.existsSync(envPath)) {
    return undefined;
  }
  const match = fs
    .readFileSync(envPath, "utf8")
    .match(new RegExp(`^\\s*${key}\\s*=\\s*([^\\n]+)`, "m"));
  if (!match) {
    return undefined;
  }
  return match[1].trim().replace(/^["']|["']$/g, "");
}

function resolveSashaVoiceId() {
  return readEnvValue("SASHA_VOICE_ID") || SASHA_RACHEL_VOICE_ID;
}

function buildSashaProfile(mode) {
  const normalized = Object.hasOwn(SASHA_MODES, mode) ? mode : "default";
  const modelId = mode === "expressive" ? "eleven_v3" : "eleven_multilingual_v2";
  const voiceSettings = mode === "expressive" ? { ...SASHA_BASE } : { ...SASHA_MODES[normalized] };
  return {
    voiceId: resolveSashaVoiceId(),
    modelId,
    voiceSettings,
  };
}

function readApiKey() {
  const key = readEnvValue("ELEVENLABS_API_KEY");
  if (!key) {
    throw new Error("ELEVENLABS_API_KEY missing (set env or ~/.openclaw/.env)");
  }
  return key;
}

function parseArgs(argv) {
  let voice = "male";
  let mode = "default";
  const textParts = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--voice" && argv[i + 1]) {
      voice = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--mode" && argv[i + 1]) {
      mode = argv[i + 1];
      i += 1;
      continue;
    }
    textParts.push(arg);
  }
  const text = textParts.join(" ").trim();
  if (!text) {
    throw new Error(
      "Usage: speak-voice.mjs --voice male|female|agent [--mode casual|executive|...] <text>",
    );
  }
  if (voice !== "male" && voice !== "female" && voice !== "agent") {
    throw new Error(`Unknown voice "${voice}". Use male, female, or agent.`);
  }
  if (voice === "male" && mode !== "default") {
    throw new Error("Mode is only supported with --voice female or --voice agent.");
  }
  return { voice, mode, text };
}

function resolveProfile(voice, mode) {
  if (voice === "male") {
    return VOICES.male;
  }
  return buildSashaProfile(mode);
}

async function synthesize({ apiKey, voice, mode, text }) {
  const profile = resolveProfile(voice, mode);
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${profile.voiceId}?output_format=${LOCAL_OUTPUT_FORMAT}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: profile.modelId,
      voice_settings: profile.voiceSettings,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ElevenLabs TTS failed (${response.status}): ${body.slice(0, 240)}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function playMac(buffer) {
  const out = path.join(os.tmpdir(), `openclaw-speak-${Date.now()}.mp3`);
  fs.writeFileSync(out, buffer);
  return new Promise((resolve, reject) => {
    const child = spawn("afplay", [out], { stdio: "ignore" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(out);
        return;
      }
      reject(new Error(`afplay exited with code ${code ?? "unknown"}`));
    });
  });
}

async function main() {
  const { voice, mode, text } = parseArgs(process.argv.slice(2));
  const apiKey = readApiKey();
  const audio = await synthesize({ apiKey, voice, mode, text });
  const playedPath = await playMac(audio);
  process.stdout.write(
    `${JSON.stringify({ ok: true, voice, mode, voiceId: resolveProfile(voice, mode).voiceId, bytes: audio.byteLength, playedPath }, null, 2)}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
