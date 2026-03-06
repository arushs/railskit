// ── Voice Agent Types ──

export type VoiceStatus = "idle" | "connecting" | "listening" | "speaking" | "processing" | "error";

export interface VoicePreset {
  id: string;
  name: string;
  description: string;
  voice_id: string;
  provider: "elevenlabs" | "openai" | "deepgram";
  language: string;
  accent?: string;
  speed: number;
  pitch: number;
  preview_url?: string;
}

export interface VoiceMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  audio_url?: string;
  duration_ms?: number;
  timestamp: string;
}

export interface VoiceSession {
  id: string;
  status: VoiceStatus;
  preset: VoicePreset;
  messages: VoiceMessage[];
  started_at: string;
  duration_ms: number;
}

export interface AudioLevel {
  timestamp: number;
  level: number; // 0-1 normalized
}
