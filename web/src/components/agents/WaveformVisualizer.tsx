import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface WaveformVisualizerProps {
  /** AnalyserNode from AudioContext (user mic or agent playback) */
  analyser: AnalyserNode | null;
  /** Width of the canvas */
  width?: number;
  /** Height of the canvas */
  height?: number;
  /** Waveform color */
  color?: string;
  /** Label (e.g., "You" or "Agent") */
  label?: string;
  /** Whether the source is active */
  active?: boolean;
  className?: string;
}

/**
 * Canvas-based real-time audio waveform visualizer.
 * Renders a smooth waveform from an AnalyserNode.
 */
export function WaveformVisualizer({
  analyser,
  width = 300,
  height = 80,
  color = "hsl(var(--color-primary))",
  label,
  active = false,
  className,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      if (!analyser || !active) {
        // Draw flat line when inactive
        ctx.beginPath();
        ctx.strokeStyle = "rgba(113, 113, 122, 0.3)";
        ctx.lineWidth = 2;
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      const sliceWidth = w / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * h) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Draw glow effect when active
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.15;
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [analyser, active, color]);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && (
        <span className="text-xs font-medium text-zinc-400">{label}</span>
      )}
      <div
        className={cn(
          "rounded-lg border bg-zinc-900/50 p-2 transition-all",
          active
            ? "border-theme-primary/30 shadow-[0_0_12px_rgba(var(--color-primary),0.15)]"
            : "border-zinc-800"
        )}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="block w-full"
          style={{ height }}
          aria-label={
            label
              ? `${label} audio waveform`
              : "Audio waveform"
          }
        />
      </div>
    </div>
  );
}
