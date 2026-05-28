import { createTestPluginApi } from "openclaw/plugin-sdk/plugin-test-api";
import { describe, expect, it, vi } from "vitest";
import { createExecutiveSpeakTool } from "./executive-speak-tool.js";
import {
  buildSashaAgentVoiceProfile,
  EXECUTIVE_CURSOR_MALE_VOICE,
  SASHA_RACHEL_VOICE_ID,
} from "./voice-profiles.js";

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
      buildSashaAgentVoiceProfile("default").voiceId,
    );
  });

  it("applies Sasha voice mode overrides for agent role", async () => {
    const textToSpeech = vi.fn(async () => ({
      success: true,
      audioPath: "/tmp/executive-speak-mode.mp3",
      provider: "elevenlabs",
    }));
    const api = createTestPluginApi({
      runtime: {
        config: { current: () => ({ messages: { tts: { provider: "elevenlabs" } } }) },
        tts: { textToSpeech },
      } as never,
    });
    const tool = createExecutiveSpeakTool(api, { agentId: "sasha" } as never);
    await tool.execute("call-3", {
      text: "Executive briefing.",
      voice: "agent",
      mode: "executive",
    });

    const call = textToSpeech.mock.calls[0]?.[0] as {
      overrides?: {
        providerOverrides?: {
          elevenlabs?: { voiceSettings?: { stability?: number }; voiceId?: string };
        };
      };
    };
    expect(call.overrides?.providerOverrides?.elevenlabs?.voiceId).toBe(SASHA_RACHEL_VOICE_ID);
    expect(call.overrides?.providerOverrides?.elevenlabs?.voiceSettings?.stability).toBe(0.55);
  });
});
