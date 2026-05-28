import type { OpenClawPluginToolContext } from "openclaw/plugin-sdk/plugin-entry";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";
import { readStringParam } from "openclaw/plugin-sdk/provider-web-search";
import { Type } from "typebox";
import {
  buildElevenLabsTtsOverrides,
  normalizeExecutiveVoiceMode,
  resolveExecutiveVoiceProfile,
  type ExecutiveVoiceRole,
} from "./voice-profiles.js";

const ExecutiveSpeakSchema = Type.Object(
  {
    text: Type.String({
      description: "Text to speak aloud via ElevenLabs.",
    }),
    voice: Type.Optional(
      Type.Union([Type.Literal("male"), Type.Literal("female"), Type.Literal("agent")], {
        description:
          'Voice role: "male" for Cursor/operator, "female" or "agent" for the sultry OpenClaw agent (default: agent).',
      }),
    ),
    playLocally: Type.Optional(
      Type.Boolean({
        description:
          "When true on macOS, also play the synthesized clip on the gateway host with afplay.",
      }),
    ),
    mode: Type.Optional(
      Type.Union(
        [
          Type.Literal("default"),
          Type.Literal("casual"),
          Type.Literal("executive"),
          Type.Literal("comfort"),
          Type.Literal("flirty"),
          Type.Literal("alert"),
          Type.Literal("builder"),
          Type.Literal("expressive"),
        ],
        {
          description:
            "Sasha voice mode for female/agent roles: casual, executive, comfort, flirty, alert, builder, expressive (eleven_v3), or default.",
        },
      ),
    ),
  },
  { additionalProperties: false },
);

function sanitizeTranscriptForToolContent(text: string): string {
  return text
    .replace(/^([^\S\r\n]*)MEDIA:/gim, "$1\u2060MEDIA:")
    .replace(/\[\[/g, "[\u2060[")
    .replace(/^([ \t]*)(`{3,})/gm, (_match, indent: string, fence: string) => {
      const [first = "", ...rest] = fence;
      return `${indent}${first}\u2060${rest.join("")}`;
    });
}

function normalizeVoiceRole(raw: unknown, ctx?: OpenClawPluginToolContext): ExecutiveVoiceRole {
  const value = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (value === "male" || value === "female" || value === "agent") {
    return value;
  }
  return ctx?.agentId ? "agent" : "female";
}

async function maybePlayLocally(audioPath: string): Promise<{ played: boolean; error?: string }> {
  if (process.platform !== "darwin") {
    return { played: false, error: "local playback only supported on macOS" };
  }
  const { spawn } = await import("node:child_process");
  return await new Promise((resolve) => {
    const child = spawn("afplay", [audioPath], { stdio: "ignore" });
    child.on("error", (error) => resolve({ played: false, error: error.message }));
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ played: true });
        return;
      }
      resolve({ played: false, error: `afplay exited with code ${code ?? "unknown"}` });
    });
  });
}

export function createExecutiveSpeakTool(api: OpenClawPluginApi, ctx?: OpenClawPluginToolContext) {
  return {
    name: "executive_speak",
    label: "Executive speak",
    description:
      "Synthesize speech with ElevenLabs using executive voice roles: male (Cursor operator) or female/agent (sultry OpenClaw agent). Returns audio for the session; optional local playback on macOS.",
    parameters: ExecutiveSpeakSchema,
    execute: async (_toolCallId: string, rawParams: Record<string, unknown>) => {
      const text = readStringParam(rawParams, "text", { required: true });
      const voice = normalizeVoiceRole(rawParams.voice, ctx);
      const playLocally = rawParams.playLocally === true;
      const mode = normalizeExecutiveVoiceMode(rawParams.mode);
      const profile = resolveExecutiveVoiceProfile(voice, mode);
      const cfg = api.runtime.config.current();
      const result = await api.runtime.tts.textToSpeech({
        text,
        cfg,
        agentId: ctx?.agentId,
        accountId: ctx?.agentAccountId,
        overrides: buildElevenLabsTtsOverrides(profile),
        disableFallback: true,
        timeoutMs: 45_000,
      });

      if (!result.success || !result.audioPath) {
        throw new Error(result.error ?? "Executive speak synthesis failed");
      }

      let localPlayback: { played: boolean; error?: string } | undefined;
      if (playLocally) {
        localPlayback = await maybePlayLocally(result.audioPath);
      }

      return {
        content: [
          {
            type: "text",
            text: `(spoken:${voice}) ${sanitizeTranscriptForToolContent(text)}`,
          },
        ],
        details: {
          audioPath: result.audioPath,
          provider: result.provider,
          voiceRole: voice,
          voiceMode: mode,
          voiceId: profile.voiceId,
          voiceLabel: profile.label,
          ...(localPlayback ? { localPlayback } : {}),
          media: {
            mediaUrl: result.audioPath,
            trustedLocalMedia: true,
            ...(result.audioAsVoice || result.voiceCompatible ? { audioAsVoice: true } : {}),
          },
        },
      };
    },
  };
}
