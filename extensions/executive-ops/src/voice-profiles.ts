export type ExecutiveVoiceRole = "male" | "female" | "agent";

/** ElevenLabs stock Rachel — Sasha baseline until a custom Voice Design id is set. */
export const SASHA_RACHEL_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

export type ExecutiveVoiceMode =
  | "default"
  | "casual"
  | "executive"
  | "comfort"
  | "flirty"
  | "alert"
  | "builder"
  | "expressive";

export type ExecutiveElevenLabsVoiceProfile = {
  voiceId: string;
  label: string;
  modelId: string;
  /** Local-only playback (e.g. afplay); omit for gateway/channel TTS so Discord gets native Opus. */
  outputFormat?: string;
  voiceSettings: {
    stability: number;
    similarityBoost: number;
    style: number;
    useSpeakerBoost: boolean;
    speed: number;
  };
};

const SASHA_BASE_VOICE_SETTINGS: ExecutiveElevenLabsVoiceProfile["voiceSettings"] = {
  stability: 0.5,
  similarityBoost: 0.85,
  style: 0.3,
  useSpeakerBoost: true,
  speed: 0.92,
};

/** Mode-specific voiceSettings merged over the Sasha baseline (same voiceId). */
export const SASHA_VOICE_MODE_PRESETS: Record<
  Exclude<ExecutiveVoiceMode, "default" | "expressive">,
  Partial<ExecutiveElevenLabsVoiceProfile["voiceSettings"]> & { labelSuffix: string }
> = {
  casual: { labelSuffix: "casual", style: 0.4, speed: 1.0 },
  executive: { labelSuffix: "executive", stability: 0.55, style: 0.2 },
  comfort: { labelSuffix: "comfort", stability: 0.45, speed: 0.85 },
  flirty: { labelSuffix: "flirty", style: 0.35, speed: 0.88 },
  alert: { labelSuffix: "alert", stability: 0.6, speed: 0.95 },
  builder: { labelSuffix: "builder", style: 0.38, speed: 0.98 },
};

export function resolveSashaVoiceId(): string {
  const fromEnv = process.env.SASHA_VOICE_ID?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : SASHA_RACHEL_VOICE_ID;
}

function mergeVoiceSettings(
  base: ExecutiveElevenLabsVoiceProfile["voiceSettings"],
  partial?: Partial<ExecutiveElevenLabsVoiceProfile["voiceSettings"]>,
): ExecutiveElevenLabsVoiceProfile["voiceSettings"] {
  if (!partial) {
    return { ...base };
  }
  return {
    stability: partial.stability ?? base.stability,
    similarityBoost: partial.similarityBoost ?? base.similarityBoost,
    style: partial.style ?? base.style,
    useSpeakerBoost: partial.useSpeakerBoost ?? base.useSpeakerBoost,
    speed: partial.speed ?? base.speed,
  };
}

export function buildSashaAgentVoiceProfile(
  mode: ExecutiveVoiceMode = "default",
): ExecutiveElevenLabsVoiceProfile {
  const voiceId = resolveSashaVoiceId();
  if (mode === "expressive") {
    return {
      voiceId,
      label: "Sasha agent (expressive)",
      modelId: "eleven_v3",
      voiceSettings: mergeVoiceSettings(SASHA_BASE_VOICE_SETTINGS),
    };
  }
  if (mode === "default") {
    return {
      voiceId,
      label: "Sasha agent (Rachel base)",
      modelId: "eleven_multilingual_v2",
      voiceSettings: mergeVoiceSettings(SASHA_BASE_VOICE_SETTINGS),
    };
  }
  const preset = SASHA_VOICE_MODE_PRESETS[mode];
  const { labelSuffix, ...settingsPartial } = preset;
  return {
    voiceId,
    label: `Sasha agent (${labelSuffix})`,
    modelId: "eleven_multilingual_v2",
    voiceSettings: mergeVoiceSettings(SASHA_BASE_VOICE_SETTINGS, settingsPartial),
  };
}

/** Confident male operator voice (ElevenLabs Adam). */
export const EXECUTIVE_CURSOR_MALE_VOICE: ExecutiveElevenLabsVoiceProfile = {
  voiceId: "pNInz6obpgDQGcFmaJgB",
  label: "Cursor operator (male)",
  modelId: "eleven_multilingual_v2",
  voiceSettings: {
    stability: 0.55,
    similarityBoost: 0.82,
    style: 0.12,
    useSpeakerBoost: true,
    speed: 1.0,
  },
};

/** Default Sasha / OpenClaw agent voice (Rachel base or SASHA_VOICE_ID override). */
export const EXECUTIVE_OPENCLAW_FEMALE_VOICE: ExecutiveElevenLabsVoiceProfile =
  buildSashaAgentVoiceProfile("default");

export const EXECUTIVE_VOICE_PERSONA_IDS = {
  male: "cursor-male",
  female: "openclaw-sultry",
  agent: "openclaw-sultry",
} as const satisfies Record<ExecutiveVoiceRole, string>;

export const SASHA_TTS_PERSONA_IDS = {
  default: "openclaw-sultry",
  casual: "sasha-casual",
  executive: "sasha-executive",
  comfort: "sasha-comfort",
  flirty: "sasha-flirty",
  alert: "sasha-alert",
  builder: "sasha-builder",
  expressive: "openclaw-sultry-expressive",
} as const satisfies Record<ExecutiveVoiceMode, string>;

export function normalizeExecutiveVoiceMode(raw: unknown): ExecutiveVoiceMode {
  const value = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  const modes: ExecutiveVoiceMode[] = [
    "default",
    "casual",
    "executive",
    "comfort",
    "flirty",
    "alert",
    "builder",
    "expressive",
  ];
  if (modes.includes(value as ExecutiveVoiceMode)) {
    return value as ExecutiveVoiceMode;
  }
  return "default";
}

export function resolveExecutiveVoiceProfile(
  role: ExecutiveVoiceRole,
  mode: ExecutiveVoiceMode = "default",
): ExecutiveElevenLabsVoiceProfile {
  if (role === "male") {
    return EXECUTIVE_CURSOR_MALE_VOICE;
  }
  return buildSashaAgentVoiceProfile(mode);
}

export function buildElevenLabsTtsOverrides(profile: ExecutiveElevenLabsVoiceProfile) {
  const elevenlabs: {
    voiceId: string;
    modelId: string;
    voiceSettings: ExecutiveElevenLabsVoiceProfile["voiceSettings"];
    outputFormat?: string;
  } = {
    voiceId: profile.voiceId,
    modelId: profile.modelId,
    voiceSettings: profile.voiceSettings,
  };
  if (profile.outputFormat?.trim()) {
    elevenlabs.outputFormat = profile.outputFormat.trim();
  }
  return {
    provider: "elevenlabs" as const,
    providerOverrides: { elevenlabs },
  };
}
