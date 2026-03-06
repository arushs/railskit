import type { VoicePreset, VoiceMessage, VoiceSession } from "@/types/voice";

export const mockPresets: VoicePreset[] = [
  {
    id: "preset-1",
    name: "Nova",
    description: "Warm and professional — great for customer support",
    voice_id: "nova-v2",
    provider: "elevenlabs",
    language: "en",
    accent: "American",
    speed: 1.0,
    pitch: 1.0,
  },
  {
    id: "preset-2",
    name: "Atlas",
    description: "Deep and authoritative — ideal for narration",
    voice_id: "atlas-v1",
    provider: "openai",
    language: "en",
    accent: "British",
    speed: 0.9,
    pitch: 0.85,
  },
  {
    id: "preset-3",
    name: "Luna",
    description: "Friendly and energetic — perfect for sales",
    voice_id: "luna-v1",
    provider: "elevenlabs",
    language: "en",
    accent: "Australian",
    speed: 1.1,
    pitch: 1.1,
  },
  {
    id: "preset-4",
    name: "Kai",
    description: "Calm and measured — best for technical explanations",
    voice_id: "kai-v2",
    provider: "deepgram",
    language: "en",
    speed: 0.95,
    pitch: 0.95,
  },
];

export const mockMessages: VoiceMessage[] = [
  {
    id: "msg-1",
    role: "user",
    content: "Hey, can you help me understand how voice agents work?",
    duration_ms: 3200,
    timestamp: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: "msg-2",
    role: "assistant",
    content:
      "Of course! Voice agents use speech-to-text to transcribe your audio, process the text through an LLM, and then convert the response back to speech using text-to-speech. It all happens in real time over a WebSocket connection.",
    duration_ms: 8500,
    timestamp: new Date(Date.now() - 105000).toISOString(),
  },
  {
    id: "msg-3",
    role: "user",
    content: "What about latency? Is it noticeable?",
    duration_ms: 2100,
    timestamp: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: "msg-4",
    role: "assistant",
    content:
      "With streaming STT and TTS, you can get under 500ms response time. The trick is to start speaking the response before the full LLM output is ready — we stream token by token.",
    duration_ms: 7200,
    timestamp: new Date(Date.now() - 45000).toISOString(),
  },
];

export const mockSession: VoiceSession = {
  id: "session-1",
  status: "idle",
  preset: mockPresets[0],
  messages: mockMessages,
  started_at: new Date(Date.now() - 180000).toISOString(),
  duration_ms: 180000,
};
