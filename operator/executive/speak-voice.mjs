#!/usr/bin/env node
/**
 * Local ElevenLabs speak helper for operator/Cursor playback (macOS afplay).
 *
 * Usage:
 *   node operator/executive/speak-voice.mjs --voice male "Hello from the operator."
 *   node operator/executive/speak-voice.mjs --voice female "Hello from OpenClaw."
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
  female: {
    voiceId: "pFZP5JQG7iQjIQuC4Bku",
    modelId: "eleven_multilingual_v2",
    voiceSettings: {
      stability: 0.38,
      similarity_boost: 0.78,
      style: 0.52,
      use_speaker_boost: true,
      speed: 0.9,
    },
  },
  agent: {
    voiceId: "pFZP5JQG7iQjIQuC4Bku",
    modelId: "eleven_multilingual_v2",
    voiceSettings: {
      stability: 0.38,
      similarity_boost: 0.78,
      style: 0.52,
      use_speaker_boost: true,
      speed: 0.9,
    },
  },
};

function readApiKey() {
  const envPath = path.join(os.homedir(), ".openclaw", ".env");
  if (process.env.ELEVENLABS_API_KEY?.trim()) {
    return process.env.ELEVENLABS_API_KEY.trim();
  }
  if (!fs.existsSync(envPath)) {
    throw new Error("ELEVENLABS_API_KEY missing (set env or ~/.openclaw/.env)");
  }
  const match = fs.readFileSync(envPath, "utf8").match(/^\s*ELEVENLABS_API_KEY\s*=\s*([^\n]+)/m);
  if (!match) {
    throw new Error("ELEVENLABS_API_KEY missing in ~/.openclaw/.env");
  }
  return match[1].trim().replace(/^["']|["']$/g, "");
}

function parseArgs(argv) {
  let voice = "male";
  const textParts = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--voice" && argv[i + 1]) {
      voice = argv[i + 1];
      i += 1;
      continue;
    }
    textParts.push(arg);
  }
  const text = textParts.join(" ").trim();
  if (!text) {
    throw new Error("Usage: speak-voice.mjs --voice male|female|agent <text>");
  }
  if (!Object.hasOwn(VOICES, voice)) {
    throw new Error(`Unknown voice "${voice}". Use male, female, or agent.`);
  }
  return { voice, text };
}

async function synthesize({ apiKey, voice, text }) {
  const profile = VOICES[voice];
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${profile.voiceId}?output_format=mp3_44100_128`;
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
  const { voice, text } = parseArgs(process.argv.slice(2));
  const apiKey = readApiKey();
  const audio = await synthesize({ apiKey, voice, text });
  const playedPath = await playMac(audio);
  process.stdout.write(
    `${JSON.stringify({ ok: true, voice, bytes: audio.byteLength, playedPath }, null, 2)}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
