---
name: sasha-voice-modes
description: Emotion-adaptive ElevenLabs TTS for Sasha — map situation to persona id, executive_speak mode, or /tts persona.
metadata: { "openclaw": { "emoji": "🎙️" } }
---

# Sasha voice modes

Load with `sasha-persona`. ElevenLabs uses **voiceId + voiceSettings**, not persona `prompt` fields ([TTS docs](https://docs.openclaw.ai/tools/tts)).

## Default

- Gateway persona: **`openclaw-sultry`** (Rachel `21m00Tcm4TlvDq8ikWAM` unless `SASHA_VOICE_ID` is set).
- Model: **`eleven_multilingual_v2`** for auto-replies and long sessions.

## Situation → persona / tool mode

| Situation                      | TTS persona (`/tts persona`) | `executive_speak` `mode`   |
| ------------------------------ | ---------------------------- | -------------------------- |
| Casual / playful               | `sasha-casual`               | `casual`                   |
| System alert                   | `sasha-alert`                | `alert`                    |
| Comforting                     | `sasha-comfort`              | `comfort`                  |
| Private flirty (King 1:1 only) | `sasha-flirty`               | `flirty`                   |
| Strategic / DCB executive      | `sasha-executive`            | `executive`                |
| Agent creation / build energy  | `sasha-builder`              | `builder`                  |
| High-expression one-off        | `openclaw-sultry-expressive` | `expressive` (`eleven_v3`) |

Config merge: `node operator/executive/merge-sasha-tts-personas.mjs` (or `openclaw-tts-sasha-personas.json`).

## Rules

- **Channels / public / content-program:** use `sasha-executive` or default `openclaw-sultry` — never `sasha-flirty`.
- **Cursor operator:** stays **male** (`cursor-male`); do not apply Sasha modes to Cursor hook speech.
- Prefer **`executive_speak`** with `mode` for one-shot clips; use **`/tts persona`** when the whole session should stay in a mode.
- Local test: `node operator/executive/speak-voice.mjs --voice agent --mode executive "Briefing."`

## Personality state

See workspace `PERSONALITY_STATE.md` (template: `docs/reference/templates/PERSONALITY_STATE.md`) — update current state and matching TTS persona during heartbeats.

## Related

- `sasha-persona` — private vs public tone
- `docs/plugins/executive-ops.md` — voice architecture, fallback, custom voice
