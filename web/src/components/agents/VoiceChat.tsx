import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import { useAudioChannel } from "@/hooks/useAudioChannel";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { TranscriptOverlay, type TranscriptEntry } from "./TranscriptOverlay";

export type VoiceStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "processing"
  | "speaking";

export interface VoiceChatProps {
  /** Chat ID for the voice session */
  chatId: string;
  /** Agent ID or name */
  agentId: string;
  /** Auth token for ActionCable */
  token?: string;
  /** Whether to show the transcript overlay */
  showTranscript?: boolean;
  /** Called when voice status changes */
  onStatusChange?: (status: VoiceStatus) => void;
  className?: string;
}

/**
 * Main voice chat UI with push-to-talk mode.
 * Integrates microphone recording, ActionCable audio streaming,
 * and audio playback into a unified voice interface.
 */
export function VoiceChat({
  chatId,
  agentId,
  token,
  showTranscript = true,
  onStatusChange,
  className,
}: VoiceChatProps) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [isConnected, setIsConnected] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const statusRef = useRef<VoiceStatus>("idle");

  const updateStatus = useCallback(
    (newStatus: VoiceStatus) => {
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
        updateStatus("idle");
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
        // Update the last non-final entry or add new one
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
      if (isFinal) {
        updateStatus("processing");
      }
    },
    onAgentSpeaking: () => {
      updateStatus("speaking");
    },
    onAgentDone: () => {
      updateStatus("idle");
    },
    onError: (error) => {
      console.error("[VoiceChat] Error:", error);
      updateStatus("idle");
    },
  });

  // Media recorder
  const {
    isRecording,
    startRecording,
    stopRecording,
    analyser: micAnalyser,
  } = useMediaRecorder({
    onDataAvailable: async (chunk) => {
      // Convert blob to base64 and send over ActionCable
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        if (base64) sendAudio(base64);
      };
      reader.readAsDataURL(chunk);
    },
    onStart: () => {
      updateStatus("listening");
      sendVadEvent("speech_start");
    },
    onError: (err) => {
      console.error("[VoiceChat] Mic error:", err);
      updateStatus("idle");
    },
  });

  // Connect / disconnect
  const handleConnect = useCallback(() => {
    connect();
    setIsConnected(true);
    updateStatus("idle");
  }, [connect, updateStatus]);

  const handleDisconnect = useCallback(() => {
    if (isRecording) stopRecording();
    interruptPlayback();
    disconnectChannel();
    setIsConnected(false);
    setTranscripts([]);
    updateStatus("idle");
  }, [isRecording, stopRecording, interruptPlayback, disconnectChannel, updateStatus]);

  // Push-to-talk handlers
  const handlePushToTalkStart = useCallback(() => {
    if (!isConnected) return;
    // Interrupt agent if speaking
    if (isPlaying) interruptPlayback();
    startRecording();
  }, [isConnected, isPlaying, interruptPlayback, startRecording]);

  const handlePushToTalkEnd = useCallback(() => {
    if (!isRecording) return;
    stopRecording();
    sendVadEvent("speech_end");
    updateStatus("processing");
  }, [isRecording, stopRecording, sendVadEvent, updateStatus]);

  const statusConfig: Record<
    VoiceStatus,
    { label: string; color: string; icon: string }
  > = {
    idle: { label: "Ready", color: "text-zinc-400", icon: "●" },
    connecting: { label: "Connecting…", color: "text-yellow-400", icon: "◌" },
    listening: { label: "Listening…", color: "text-green-400", icon: "●" },
    processing: { label: "Processing…", color: "text-blue-400", icon: "◉" },
    speaking: { label: "Agent speaking", color: "text-purple-400", icon: "◉" },
  };

  const currentStatus = statusConfig[status];

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6",
        className
      )}
      role="region"
      aria-label={`Voice chat with ${agentId}`}
    >
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-theme-primary/10">
            <span className="text-xl">🎤</span>
          </div>
          <div>
            <h3 className="font-semibold text-zinc-200">Voice Chat</h3>
            <div className={cn("flex items-center gap-1.5 text-xs", currentStatus.color)}>
              <span
                className={cn(
                  "inline-block",
                  status === "listening" && "animate-pulse",
                  status === "processing" && "animate-spin"
                )}
              >
                {currentStatus.icon}
              </span>
              {currentStatus.label}
            </div>
          </div>
        </div>

        {/* Connection toggle */}
        <Button
          variant={isConnected ? "secondary" : "default"}
          size="sm"
          onClick={isConnected ? handleDisconnect : handleConnect}
          aria-label={isConnected ? "Disconnect voice" : "Connect voice"}
        >
          {isConnected ? "Disconnect" : "Connect"}
        </Button>
      </div>

      {/* Waveform visualizers */}
      {isConnected && (
        <div className="grid grid-cols-2 gap-3">
          <WaveformVisualizer
            analyser={micAnalyser}
            label="You"
            active={isRecording}
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

      {/* Push-to-talk button */}
      {isConnected && (
        <div className="flex justify-center">
          <button
            type="button"
            onMouseDown={handlePushToTalkStart}
            onMouseUp={handlePushToTalkEnd}
            onMouseLeave={handlePushToTalkEnd}
            onTouchStart={handlePushToTalkStart}
            onTouchEnd={handlePushToTalkEnd}
            disabled={status === "processing" || status === "connecting"}
            className={cn(
              "flex h-20 w-20 items-center justify-center rounded-full transition-all",
              "focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2 focus:ring-offset-zinc-950",
              isRecording
                ? "bg-red-500 shadow-[0_0_24px_rgba(239,68,68,0.4)] scale-110"
                : "bg-zinc-800 hover:bg-zinc-700 active:scale-95",
              (status === "processing" || status === "connecting") &&
                "opacity-50 cursor-not-allowed"
            )}
            aria-label={isRecording ? "Release to stop recording" : "Hold to talk"}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                "transition-colors",
                isRecording ? "text-white" : "text-zinc-400"
              )}
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </button>
        </div>
      )}

      {/* Push-to-talk hint */}
      {isConnected && status === "idle" && (
        <p className="text-center text-xs text-zinc-500">
          Hold the button to talk
        </p>
      )}

      {/* Transcript overlay */}
      {showTranscript && isConnected && (
        <TranscriptOverlay entries={transcripts} maxHeight={160} />
      )}
    </div>
  );
}
