import { useState, useRef, useEffect } from "react";
import type { VoiceStatus, VoiceMessage, VoicePreset } from "@/types/voice";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { VoicePresetPicker } from "./VoicePresetPicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Settings2,
  Clock,
  ChevronUp,
} from "lucide-react";

interface VoiceChatProps {
  presets: VoicePreset[];
  initialPreset: VoicePreset;
  initialMessages?: VoiceMessage[];
  className?: string;
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusConfig: Record<VoiceStatus, { label: string; color: string }> = {
  idle: { label: "Ready", color: "bg-zinc-400" },
  connecting: { label: "Connecting…", color: "bg-amber-400 animate-pulse" },
  listening: { label: "Listening", color: "bg-emerald-400 animate-pulse" },
  speaking: { label: "Speaking", color: "bg-indigo-400 animate-pulse" },
  processing: { label: "Thinking…", color: "bg-amber-400 animate-pulse" },
  error: { label: "Error", color: "bg-red-400" },
};

export function VoiceChat({
  presets,
  initialPreset,
  initialMessages = [],
  className,
}: VoiceChatProps) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [messages, setMessages] = useState<VoiceMessage[]>(initialMessages);
  const [selectedPreset, setSelectedPreset] = useState<VoicePreset>(initialPreset);
  const [showSettings, setShowSettings] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  const isActive = status !== "idle" && status !== "error";

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Timer for active sessions
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1000), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  const handleToggleCall = () => {
    if (isActive) {
      setStatus("idle");
      setElapsed(0);
    } else {
      setStatus("connecting");
      // Simulate connection + listening cycle
      setTimeout(() => setStatus("listening"), 1200);
      setTimeout(() => {
        setStatus("processing");
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-${Date.now()}`,
              role: "user",
              content: "Hello, can you hear me?",
              duration_ms: 1800,
              timestamp: new Date().toISOString(),
            },
          ]);
          setStatus("speaking");
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: `msg-${Date.now() + 1}`,
                role: "assistant",
                content: "Yes, I can hear you perfectly! How can I help you today?",
                duration_ms: 3200,
                timestamp: new Date().toISOString(),
              },
            ]);
            setStatus("listening");
          }, 3000);
        }, 1500);
      }, 4000);
    }
  };

  const handleMuteToggle = () => {
    if (status === "listening") {
      setStatus("idle");
    } else if (status === "idle" && isActive) {
      setStatus("listening");
    }
  };

  const { label, color } = statusConfig[status];

  return (
    <Card className={cn("dark:bg-zinc-900/50 bg-white overflow-hidden", className)}>
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base text-zinc-900 dark:text-white">
              Voice Chat
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <div className={cn("h-2 w-2 rounded-full", color)} />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <Badge variant="secondary" className="text-xs font-mono gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(elapsed)}
              </Badge>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Voice settings"
            >
              {showSettings ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <Settings2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Settings panel */}
        {showSettings && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <VoicePresetPicker
              presets={presets}
              selected={selectedPreset}
              onSelect={setSelectedPreset}
            />
          </div>
        )}

        {/* Waveform */}
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 p-4">
          <WaveformVisualizer status={status} />
        </div>

        {/* Transcript */}
        <div
          ref={scrollRef}
          className="max-h-64 overflow-y-auto space-y-3 scroll-smooth"
        >
          {messages.length === 0 ? (
            <p className="text-center text-sm text-zinc-400 dark:text-zinc-500 py-8">
              Start a voice session to begin chatting
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col gap-1 max-w-[85%]",
                  msg.role === "user" ? "ml-auto items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-indigo-500 text-white rounded-br-md"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-md"
                  )}
                >
                  {msg.content}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-500 px-1">
                  <span>{formatTime(msg.timestamp)}</span>
                  {msg.duration_ms && (
                    <span>{(msg.duration_ms / 1000).toFixed(1)}s</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={handleMuteToggle}
            disabled={!isActive}
            className={cn(
              "rounded-full p-3 transition-all duration-200",
              isActive
                ? status === "listening"
                  ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-500"
                : "bg-zinc-100 text-zinc-300 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600"
            )}
            aria-label={status === "listening" ? "Mute" : "Unmute"}
          >
            {status === "listening" ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </button>

          <button
            onClick={handleToggleCall}
            className={cn(
              "rounded-full p-4 shadow-lg transition-all duration-200",
              isActive
                ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/25"
                : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/25"
            )}
            aria-label={isActive ? "End call" : "Start call"}
          >
            {isActive ? (
              <PhoneOff className="h-6 w-6" />
            ) : (
              <Phone className="h-6 w-6" />
            )}
          </button>

          <div className="w-11" /> {/* Spacer for symmetry */}
        </div>

        {/* Selected preset indicator */}
        <div className="text-center">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            Using{" "}
            <span className="font-medium text-zinc-600 dark:text-zinc-300">
              {selectedPreset.name}
            </span>{" "}
            voice via {selectedPreset.provider}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
