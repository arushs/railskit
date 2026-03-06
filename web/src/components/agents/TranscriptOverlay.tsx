import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface TranscriptEntry {
  id: string;
  role: "user" | "agent";
  text: string;
  isFinal: boolean;
  timestamp: number;
}

export interface TranscriptOverlayProps {
  /** Transcript entries */
  entries: TranscriptEntry[];
  /** Maximum height before scrolling */
  maxHeight?: number;
  /** Whether to show the overlay */
  visible?: boolean;
  className?: string;
}

/**
 * Live transcript display alongside voice.
 * Shows both user speech and agent responses with auto-scroll.
 */
export function TranscriptOverlay({
  entries,
  maxHeight = 200,
  visible = true,
  className,
}: TranscriptOverlayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  if (!visible || entries.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
        <span className="text-xs font-medium text-zinc-400">
          Live Transcript
        </span>
      </div>
      <div
        ref={scrollRef}
        className="overflow-y-auto p-3 space-y-2"
        style={{ maxHeight }}
        role="log"
        aria-live="polite"
        aria-label="Voice conversation transcript"
      >
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={cn(
              "flex gap-2 text-sm",
              entry.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-3 py-1.5",
                entry.role === "user"
                  ? "bg-theme-primary/20 text-zinc-200"
                  : "bg-zinc-800 text-zinc-300",
                !entry.isFinal && "italic opacity-70"
              )}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {entry.role === "user" ? "You" : "Agent"}
              </span>
              <p className="mt-0.5 leading-relaxed">{entry.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
