import { useEffect, useRef, useState } from "react";
import type { VoiceStatus } from "@/types/voice";
import { cn } from "@/lib/utils";

interface WaveformVisualizerProps {
  status: VoiceStatus;
  className?: string;
  barCount?: number;
}

export function WaveformVisualizer({
  status,
  className,
  barCount = 32,
}: WaveformVisualizerProps) {
  const [levels, setLevels] = useState<number[]>(() =>
    Array.from({ length: barCount }, () => 0.05)
  );
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (status !== "listening" && status !== "speaking") {
      setLevels(Array.from({ length: barCount }, () => 0.05));
      return;
    }

    const animate = () => {
      setLevels((prev) =>
        prev.map((_, i) => {
          const center = barCount / 2;
          const dist = Math.abs(i - center) / center;
          const base = status === "speaking" ? 0.4 : 0.2;
          const amplitude = status === "speaking" ? 0.6 : 0.4;
          const wave = Math.sin(Date.now() / 200 + i * 0.5) * 0.5 + 0.5;
          const noise = Math.random() * 0.3;
          return Math.min(1, base + (wave + noise) * amplitude * (1 - dist * 0.6));
        })
      );
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [status, barCount]);

  const barColor =
    status === "speaking"
      ? "bg-indigo-500 dark:bg-indigo-400"
      : status === "listening"
        ? "bg-emerald-500 dark:bg-emerald-400"
        : "bg-zinc-300 dark:bg-zinc-700";

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-[2px] h-16",
        className
      )}
      role="img"
      aria-label={`Voice waveform — ${status}`}
    >
      {levels.map((level, i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-full transition-colors duration-200",
            barColor
          )}
          style={{
            height: `${Math.max(4, level * 100)}%`,
            transition: "height 80ms ease-out",
          }}
        />
      ))}
    </div>
  );
}
