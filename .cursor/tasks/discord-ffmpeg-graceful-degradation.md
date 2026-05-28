---
title: Discord outbound silently drops when ffmpeg/ffprobe missing
priority: high
owner: cursor
status: open
opened: 2026-05-28
context: Real production incident on Michael's machine — Sasha agent's Discord channel replies vanished for ~13 hours before root cause was found. Tactical fix applied (sudo cp ffmpeg+ffprobe to /usr/local/bin); this issue is the durable engineering fix.
---

# Task: graceful TTS-attach degradation in outbound delivery

## What broke

Gateway TTS is configured `messages.tts.auto = "always"`. Every assistant message generates a TTS clip that's attached as a Discord voice message. The voice-message path calls `ensureOggOpus` / `getVoiceMessageMetadata` which require `ffmpeg` and `ffprobe`.

`src/media/ffmpeg-exec.ts:requireSystemBin` only searches the "standard" trusted dirs (see `src/infra/resolve-system-bin.ts:DARWIN_STANDARD_DIRS` — `/opt/homebrew/bin` and `/usr/local/bin`). When ffmpeg isn't installed there, `requireSystemBin` throws.

The throw propagates up to the outbound delivery pipeline (`src/infra/outbound/deliver.ts:OutboundDeliveryError`) and the **entire message** drops — including the text content. Discord log shows:

```
[discord] final reply failed (target=channel:... session=agent:sasha:discord:...):
  OutboundDeliveryError: ffmpeg not found in trusted system directories.
  Install it via your system package manager (e.g. brew install ffmpeg).
```

User never sees a reply. Typing indicator stops with no message. Confusing UX. Took ~13h to root-cause.

## Acceptance criteria

1. **If ffmpeg/ffprobe is missing AND a message has both text and TTS audio attachment**, send the **text** successfully and skip the audio attachment. Log a single warning per session: "Audio attachment skipped — ffmpeg missing. Install ffmpeg + ffprobe to enable Discord voice messages."
2. **If the message is audio-only (no text)**, fail with a clear actionable error (current behavior is fine — there's nothing to fall back to).
3. **Single-fire warning per session.** Don't log every dropped attachment.
4. **Doctor / readiness probe surfaces this.** `pnpm claw:max-readiness` (or equivalent) should report `ffmpeg: missing` when not installed. New check at `src/infra/readiness/` (or wherever doctor lives) using the same `resolveSystemBin("ffmpeg", { trust: "standard" })` API.
5. **Documentation.** Add ffmpeg/ffprobe to the macOS/Linux prereq section of `README.md` with `brew install ffmpeg` (mac) and `apt install ffmpeg` (linux). Note that they must land in trusted dirs (`/usr/local/bin`, `/opt/homebrew/bin`, etc.).

## Files to touch

| Path                                      | Why                                                                                                                                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `extensions/discord/src/send.voice.ts`    | Wrap the `ensureOggOpus` call; on `ffmpeg`-not-found, return early with `{ skipped: true }` instead of throwing                                                                                              |
| `extensions/discord/src/voice-message.ts` | Likely where `ensureOggOpus` / `getVoiceMessageMetadata` live; expose a typed error so callers can distinguish missing-binary from real conversion failure                                                   |
| `src/media/ffmpeg-exec.ts:29-42`          | Consider a `tryResolveSystemBin` companion to `requireSystemBin` that returns `null` instead of throwing; outbound code can use that to detect missing bins without try/catch noise                          |
| `src/infra/outbound/deliver.ts`           | The orchestration point that currently treats voice-message failure as full-message failure. Split the failure: text-payload success + audio-payload skipped should not bubble up as `OutboundDeliveryError` |
| `src/infra/outbound/deliver-types.ts`     | Add `audioAttachmentSkipped` outcome variant to `OutboundPayloadDeliveryOutcome`                                                                                                                             |
| Doctor / readiness module                 | Add ffmpeg check                                                                                                                                                                                             |
| `README.md`                               | Add ffmpeg/ffprobe prereq                                                                                                                                                                                    |
| Tests across the above                    | Cover: missing-ffmpeg + text → text sent + warning; missing-ffmpeg + audio-only → clear error; both present → unchanged                                                                                      |

## Out of scope

- Do **not** widen `DARWIN_STANDARD_DIRS` to include `~/.local/bin` or other user-writable paths. That weakens PATH-hijack protection. Strict trust is intentional.
- Do **not** change the `tts.auto = "always"` default. Per-user override still works; the fix is graceful behavior when the dependency isn't present, not a policy change.
- Do **not** auto-install ffmpeg. Doctor surfaces; user installs.

## Reproduction

On a Mac without ffmpeg in trusted dirs:

```bash
brew uninstall ffmpeg          # or just don't install it
rm -f /usr/local/bin/ffmpeg /usr/local/bin/ffprobe
# Configure a Discord bot with messages.tts.auto = "always" (default)
# Send the bot a DM or @mention in a configured guild channel
# Observe: typing indicator fires, agent turn completes in logs, no message lands
```

Log expectation after fix:

```
[discord] outbound payload partial: text=ok, audio=skipped (ffmpeg missing)
```

## Linked

- GitHub issue: (will be linked after creation against `Mport-Media-Group/openclaw`)
- Tactical fix already applied on Michael's machine: ffmpeg + ffprobe v8.1.1-tessus copied to `/usr/local/bin/`
- Discharge Bridge marketing PR `portmi3-ai/discharge-bridge-media#29` is unrelated but in flight; do not couple

## Hand-off note

Authored by Sasha (OpenClaw agent) for Cursor on 2026-05-28 after the Discord channel bot's first round-trip silently failed. Tactical patch unblocked Michael's machine; this issue is the durable fix so the next machine to set up Sasha doesn't hit the same wall.
