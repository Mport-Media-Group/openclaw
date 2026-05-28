import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildSashaAgentVoiceProfile,
  resolveExecutiveVoiceProfile,
  resolveSashaVoiceId,
  SASHA_RACHEL_VOICE_ID,
} from "./voice-profiles.js";

describe("voice-profiles", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults Sasha voice to Rachel stock id", () => {
    vi.stubEnv("SASHA_VOICE_ID", "");
    expect(resolveSashaVoiceId()).toBe(SASHA_RACHEL_VOICE_ID);
    expect(EXECUTIVE_OPENCLAW_FEMALE_VOICE_FROM_DEFAULT().voiceId).toBe(SASHA_RACHEL_VOICE_ID);
  });

  it("honors SASHA_VOICE_ID override", () => {
    vi.stubEnv("SASHA_VOICE_ID", "custom-voice-id-123");
    expect(resolveSashaVoiceId()).toBe("custom-voice-id-123");
    expect(buildSashaAgentVoiceProfile("default").voiceId).toBe("custom-voice-id-123");
  });

  it("applies mode presets for agent voice", () => {
    const executive = resolveExecutiveVoiceProfile("agent", "executive");
    expect(executive.voiceSettings.stability).toBe(0.55);
    expect(executive.voiceSettings.style).toBe(0.2);

    const expressive = resolveExecutiveVoiceProfile("female", "expressive");
    expect(expressive.modelId).toBe("eleven_v3");
  });

  it("keeps male profile independent of mode", () => {
    const male = resolveExecutiveVoiceProfile("male", "flirty");
    expect(male.voiceId).toBe("pNInz6obpgDQGcFmaJgB");
  });
});

function EXECUTIVE_OPENCLAW_FEMALE_VOICE_FROM_DEFAULT() {
  return buildSashaAgentVoiceProfile("default");
}
