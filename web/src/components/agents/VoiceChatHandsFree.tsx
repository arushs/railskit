import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAudioChannel } from "@/hooks/useAudioChannel";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { TranscriptOverlay, type TranscriptEntry } from "./TranscriptOverlay";

export type HandsFreeStatus =
  | "idle"
  | "connecting"
  | "waiting"
  | "listening"
  | "processing"
  | "speaking";

export interface VoiceChatHandsFreeProps {
  /** Chat ID for the voice session */
  chatId: string;
  /** Agent ID or name */
  agentId: string;
  /** Auth token for ActionCable */
  token?: string;
  /** Whether to show the transcript overlay */
  showTranscript?: boolean;
  /** Called when status changes */
  onStatusChange?: (status: HandsFreeStatus) => void;
  className?: string;
}

/**
 * Hands-free voice chat using Voice Activity Detection (VAD).
 * Always-listening mode that automatically detects speech start/stop.
 * Uses @ricky0123/vad-web for client-side VAD.
 */
export function VoiceChatHandsFree({
  chatId,
  agentId,
  token,
  showTranscript = true,
  onStatusChange,
  className,
}: VoiceChatHandsFreeProps) {
  const [status, setStatus] = useState<HandsFreeStatus>("idle");
  const [isActive, setIsActive] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [vadState, setVadState] = useState<"idle" | "speech">("idle");
  const statusRef = useRef<HandsFreeStatus>("idle");
  const vadRef = useRef<{ destroy: () => void; pause: () => void; start: () => void } | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const [micAnalyser, setMicAnalyser] = useState<AnalyserNode | null>(null);

  const updateStatus = useCallback(
    (newStatus: HandsFreeStatus) => {
      statusRef.current = newStatus;
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    },
    [onStatusChange]
  );

  // Audio playback
  const {
    isPlaying,
    enqueue: enqueueAudio,
    interrupt: interruptPlayback,
    analyser: playbackAnalyser,
  } = useAudioPlayback({
    onPlaybackStart: () => updateStatus("speaking"),
    onPlaybackEnd: () => {
      if (statusRef.current === "speaking") {
        updateStatus("waiting");
      }
    },
  });

  // Audio channel (ActionCable)
  const {
    sendAudio,
    sendVadEvent,
    connectionState: _connectionState,
    connect,
    disconnect: disconnectChannel,
  } = useAudioChannel({
    chatId,
    token,
    onAudioReceived: (audioBase64, format) => {
      enqueueAudio(audioBase64, format);
    },
    onTranscript: (text, isFinal) => {
      setTranscripts((prev) => {
        const lastIdx = prev.length - 1;
        if (lastIdx >= 0 && !prev[lastIdx].isFinal && prev[lastIdx].role === "user") {
          const updated = [...prev];
          updated[lastIdx] = { ...updated[lastIdx], text, isFinal };
          return updated;
        }
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "user",
            text,
            isFinal,
            timestamp: Date.now(),
          },
        ];
      });
      if (isFinal) updateStatus("processing");
    },
    onAgentSpeaking: () => updateStatus("speaking"),
    onAgentDone: () => updateStatus("waiting"),
    onError: (error) => {
      console.error("[VoiceChatHandsFree] Error:", error);
    },
  });

  // Initialize VAD
  const initVad = useCallback(async () => {
    try {
      // Dynamic import of @ricky0123/vad-web
      const { MicVAD } = await import("@ricky0123/vad-web");

      const vad = await MicVAD.new({
        positiveSpeechThreshold: 0.8,
        negativeSpeechThreshold: 0.3,
        minSpeechFrames: 3,
        preSpeechPadFrames: 5,

        onSpeechStart: () => {
          setVadState("speech");
          // Interrupt agent if speaking
          if (statusRef.current === "speaking") {
            interruptPlayback();
          }
          sendVadEvent("speech_start");
          updateStatus("listening");
        },

        onSpeechEnd: (audio: Float32Array) => {
          setVadState("idle");
          sendVadEvent("speech_end");

          // Convert Float32 PCM to base64 for streaming
          const pcm16 = new Int16Array(audio.length);
          for (let i = 0; i < audio.length; i++) {
            const s = Math.max(-1, Math.min(1, audio[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          const bytes = new Uint8Array(pcm16.buffer);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          sendAudio(base64);

          updateStatus("processing");
        },
      });

      vadRef.current = vad;

      // Create analyser from VAD's stream if accessible
      // (VAD manages its own mic, so we create a separate analyser)
      try {
        const audioCtx = new AudioContext({ sampleRate: 16000 });
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        micAnalyserRef.current = analyser;
        setMicAnalyser(analyser);
      } catch {
        // Visualization won't work, but VAD still functions
      }

      vad.start();
      updateStatus("waiting");
    } catch (err) {
      console.error("[VoiceChatHandsFree] VAD init error:", err);
      updateStatus("idle");
    }
  }, [sendAudio, sendVadEvent, interruptPlayback, updateStatus]);

  // Start / stop
  const handleStart = useCallback(() => {
    connect();
    setIsActive(true);
    updateStatus("connecting");
    initVad();
  }, [connect, updateStatus, initVad]);

  const handleStop = useCallback(() => {
    vadRef.current?.destroy();
    vadRef.current = null;
    interruptPlayback();
    disconnectChannel();
    setIsActive(false);
    setVadState("idle");
    setTranscripts([]);
    setMicAnalyser(null);
    updateStatus("idle");
  }, [interruptPlayback, disconnectChannel, updateStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      vadRef.current?.destroy();
    };
  }, []);

  const statusConfig: Record<
    HandsFreeStatus,
    { label: string; color: string }
  > = {
    idle: { label: "Inactive", color: "text-zinc-500" },
    connecting: { label: "Connecting…", color: "text-yellow-400" },
    waiting: { label: "Listening for speech…", color: "text-zinc-400" },
    listening: { label: "Speech detected", color: "text-green-400" },
    processing: { label: "Processing…", color: "text-blue-400" },
    speaking: { label: "Agent speaking", color: "text-purple-400" },
  };

  const currentStatus = statusConfig[status];

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6",
        className
      )}
      role="region"
      aria-label={`Hands-free voice chat with ${agentId}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full transition-all",
              isActive
                ? "bg-green-500/20"
                : "bg-zinc-800"
            )}
          >
            <span className="text-xl">{isActive ? "🟢" : "🎙️"}</span>
          </div>
          <div>
            <h3 className="font-semibold text-zinc-200">Hands-Free Mode</h3>
            <div className={cn("flex items-center gap-1.5 text-xs", currentStatus.color)}>
              {isActive && (
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              )}
              {currentStatus.label}
            </div>
          </div>
        </div>

        <Button
          variant={isActive ? "secondary" : "default"}
          size="sm"
          onClick={isActive ? handleStop : handleStart}
          aria-label={isActive ? "Stop hands-free mode" : "Start hands-free mode"}
        >
          {isActive ? "Stop" : "Start"}
        </Button>
      </div>

      {/* VAD visual indicator */}
      {isActive && (
        <div className="flex items-center justify-center">
          <div
            className={cn(
              "flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300",
              vadState === "speech"
                ? "bg-green-500/20 shadow-[0_0_32px_rgba(34,197,94,0.3)] scale-110"
                : "bg-zinc-900 border border-zinc-800"
            )}
            aria-live="polite"
            aria-label={vadState === "speech" ? "Speech detected" : "Waiting for speech"}
          >
            <div
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-full transition-all duration-200",
                vadState === "speech"
                  ? "bg-green-500/30"
                  : "bg-zinc-800"
              )}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn(
                  "transition-colors",
                  vadState === "speech" ? "text-green-400" : "text-zinc-500"
                )}
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Waveforms */}
      {isActive && (
        <div className="grid grid-cols-2 gap-3">
          <WaveformVisualizer
            analyser={micAnalyser}
            label="You"
            active={vadState === "speech"}
            color="hsl(142, 71%, 45%)"
            height={60}
          />
          <WaveformVisualizer
            analyser={playbackAnalyser}
            label="Agent"
            active={isPlaying}
            color="hsl(var(--color-primary))"
            height={60}
          />
        </div>
      )}

      {/* Transcript */}
      {showTranscript && isActive && (
        <TranscriptOverlay entries={transcripts} maxHeight={160} />
      )}
    </div>
  );
}
