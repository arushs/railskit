import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Phone, PhoneOff, Settings, Clock } from "lucide-react";
import WaveformVisualizer from "./WaveformVisualizer";
import type { VoiceMessage, VoiceStatus, VoicePreset } from "@/types/voice";

interface VoiceChatProps {
  messages: VoiceMessage[];
  status: VoiceStatus;
  activePreset: VoicePreset | null;
  onStartSession: () => void;
  onEndSession: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  onOpenSettings?: () => void;
  className?: string;
}

const statusConfig: Record<
  VoiceStatus,
  { label: string; color: string; dotColor: string }
> = {
  idle: { label: "Ready", color: "text-zinc-400", dotColor: "bg-zinc-400" },
  connecting: {
    label: "Connecting…",
    color: "text-amber-400",
    dotColor: "bg-amber-400 animate-pulse",
  },
  listening: {
    label: "Listening",
    color: "text-emerald-400",
    dotColor: "bg-emerald-400 animate-pulse",
  },
  processing: {
    label: "Thinking…",
    color: "text-blue-400",
    dotColor: "bg-blue-400 animate-pulse",
  },
  speaking: {
    label: "Speaking",
    color: "text-indigo-400",
    dotColor: "bg-indigo-400 animate-pulse",
  },
  error: { label: "Error", color: "text-red-400", dotColor: "bg-red-400" },
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function VoiceChat({
  messages,
  status,
  activePreset,
  onStartSession,
  onEndSession,
  onToggleMute,
  isMuted,
  onOpenSettings,
  className,
}: VoiceChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const isActive = status !== "idle" && status !== "error";

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  // Elapsed timer
  useEffect(() => {
    if (!isActive) {
      setElapsed(0);
      return;
    }
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  const { label, color, dotColor } = statusConfig[status];
  const totalDuration = messages.reduce((sum, m) => sum + (m.duration ?? 0), 0);

  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden dark:bg-zinc-900/50 bg-white",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", dotColor)} />
            <span className={cn("text-sm font-medium", color)}>{label}</span>
          </div>
          {activePreset && (
            <Badge
              variant="secondary"
              className="text-[10px] dark:bg-zinc-800 dark:text-zinc-400"
            >
              {activePreset.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isActive && (
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <Clock className="h-3 w-3" />
              {formatDuration(elapsed)}
            </div>
          )}
          {onOpenSettings && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onOpenSettings}
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[200px] max-h-[400px]"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="rounded-full bg-zinc-100 dark:bg-zinc-800 p-4 mb-4">
              <Mic className="h-6 w-6 text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Start a voice conversation
            </p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500 max-w-[240px]">
              {activePreset
                ? `Using ${activePreset.name} voice. Click the call button to begin.`
                : "Select a voice preset and click the call button to begin."}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5",
                  msg.role === "user"
                    ? "bg-indigo-500 text-white"
                    : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                )}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <div
                  className={cn(
                    "mt-1.5 flex items-center gap-2 text-[10px]",
                    msg.role === "user"
                      ? "text-indigo-200"
                      : "text-zinc-400 dark:text-zinc-500"
                  )}
                >
                  <span>{formatTime(msg.timestamp)}</span>
                  {msg.duration && <span>· {msg.duration.toFixed(1)}s</span>}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Streaming indicator when speaking */}
        {status === "speaking" && (
          <div className="flex gap-3">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-zinc-100 dark:bg-zinc-800">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-zinc-400">Speaking…</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Waveform + Controls */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-4 space-y-3">
        {isActive && <WaveformVisualizer status={status} height={48} bars={50} />}

        <div className="flex items-center justify-center gap-3">
          {isActive && (
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                "h-10 w-10 rounded-full",
                isMuted && "bg-red-500/10 border-red-500/20 text-red-400"
              )}
              onClick={onToggleMute}
            >
              {isMuted ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}

          <Button
            size="icon"
            className={cn(
              "h-12 w-12 rounded-full transition-all",
              isActive
                ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25"
                : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
            )}
            onClick={isActive ? onEndSession : onStartSession}
          >
            {isActive ? (
              <PhoneOff className="h-5 w-5" />
            ) : (
              <Phone className="h-5 w-5" />
            )}
          </Button>

          {isActive && (
            <div className="flex items-center gap-1 text-[10px] text-zinc-400 min-w-[60px]">
              <span>{formatDuration(totalDuration)} audio</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
