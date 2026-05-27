import { createTestPluginApi } from "openclaw/plugin-sdk/plugin-test-api";
import { describe, expect, it, vi } from "vitest";
import { createExecutiveSpeakTool } from "./executive-speak-tool.js";
import { EXECUTIVE_CURSOR_MALE_VOICE, EXECUTIVE_OPENCLAW_FEMALE_VOICE } from "./voice-profiles.js";

describe("executive_speak tool", () => {
  it("synthesizes male and female voice roles with ElevenLabs overrides", async () => {
    const textToSpeech = vi.fn(async () => ({
      success: true,
      audioPath: "/tmp/executive-speak.mp3",
      provider: "elevenlabs",
      voiceCompatible: true,
    }));
    const api = createTestPluginApi({
      runtime: {
        config: { current: () => ({ messages: { tts: { provider: "elevenlabs" } } }) },
        tts: { textToSpeech },
      } as never,
    });
    const tool = createExecutiveSpeakTool(api, { agentId: "dev" } as never);

    await tool.execute("call-1", { text: "Operator check-in.", voice: "male" });
    await tool.execute("call-2", { text: "Agent briefing.", voice: "agent" });

    expect(textToSpeech).toHaveBeenCalledTimes(2);
    const maleCall = textToSpeech.mock.calls[0]?.[0] as {
      overrides?: { providerOverrides?: { elevenlabs?: { voiceId?: string } } };
    };
    const agentCall = textToSpeech.mock.calls[1]?.[0] as {
      overrides?: { providerOverrides?: { elevenlabs?: { voiceId?: string } } };
    };
    expect(maleCall.overrides?.providerOverrides?.elevenlabs?.voiceId).toBe(
      EXECUTIVE_CURSOR_MALE_VOICE.voiceId,
    );
    expect(agentCall.overrides?.providerOverrides?.elevenlabs?.voiceId).toBe(
      EXECUTIVE_OPENCLAW_FEMALE_VOICE.voiceId,
    );
  });
});
