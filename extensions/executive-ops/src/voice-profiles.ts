export type ExecutiveVoiceRole = "male" | "female" | "agent";

export type ExecutiveElevenLabsVoiceProfile = {
  voiceId: string;
  label: string;
  modelId: string;
  outputFormat: string;
  voiceSettings: {
    stability: number;
    similarityBoost: number;
    style: number;
    useSpeakerBoost: boolean;
    speed: number;
  };
};

/** Confident male operator voice (ElevenLabs Adam). */
export const EXECUTIVE_CURSOR_MALE_VOICE: ExecutiveElevenLabsVoiceProfile = {
  voiceId: "pNInz6obpgDQGcFmaJgB",
  label: "Cursor operator (male)",
  modelId: "eleven_multilingual_v2",
  outputFormat: "mp3_44100_128",
  voiceSettings: {
    stability: 0.55,
    similarityBoost: 0.82,
    style: 0.12,
    useSpeakerBoost: true,
    speed: 1.0,
  },
};

/** Sultry velvety female voice for the OpenClaw agent (ElevenLabs Lily). */
export const EXECUTIVE_OPENCLAW_FEMALE_VOICE: ExecutiveElevenLabsVoiceProfile = {
  voiceId: "pFZP5JQG7iQjIQuC4Bku",
  label: "OpenClaw agent (sultry female)",
  modelId: "eleven_multilingual_v2",
  outputFormat: "mp3_44100_128",
  voiceSettings: {
    stability: 0.38,
    similarityBoost: 0.78,
    style: 0.52,
    useSpeakerBoost: true,
    speed: 0.9,
  },
};

export const EXECUTIVE_VOICE_PERSONA_IDS = {
  male: "cursor-male",
  female: "openclaw-sultry",
  agent: "openclaw-sultry",
} as const satisfies Record<ExecutiveVoiceRole, string>;

export function resolveExecutiveVoiceProfile(
  role: ExecutiveVoiceRole,
): ExecutiveElevenLabsVoiceProfile {
  if (role === "male") {
    return EXECUTIVE_CURSOR_MALE_VOICE;
  }
  return EXECUTIVE_OPENCLAW_FEMALE_VOICE;
}

export function buildElevenLabsTtsOverrides(profile: ExecutiveElevenLabsVoiceProfile) {
  return {
    provider: "elevenlabs" as const,
    providerOverrides: {
      elevenlabs: {
        voiceId: profile.voiceId,
        modelId: profile.modelId,
        outputFormat: profile.outputFormat,
        voiceSettings: profile.voiceSettings,
      },
    },
  };
}
