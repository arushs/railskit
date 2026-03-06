// ── Voice Agent Types ──

export interface VoicePreset {
  id: string;
  name: string;
  description: string;
  provider: "elevenlabs" | "openai" | "deepgram" | "custom";
  voiceId: string;
  /** Sample audio URL for preview */
  sampleUrl?: string;
  tags: string[];
  config: {
    stability?: number;
    similarity?: number;
    speed?: number;
    pitch?: number;
  };
}

export interface VoiceMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  audioUrl?: string;
  /** Duration in seconds */
  duration?: number;
  timestamp: string;
}

export type VoiceStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "processing"
  | "speaking"
  | "error";

export interface VoiceSession {
  id: string;
  preset: VoicePreset;
  status: VoiceStatus;
  messages: VoiceMessage[];
  startedAt: string;
  /** Cumulative audio duration in seconds */
  totalDuration: number;
}

export interface AudioLevel {
  /** 0-1 normalized amplitude */
  level: number;
  timestamp: number;
}
