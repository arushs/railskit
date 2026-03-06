import { useRef, useEffect, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import type { VoiceStatus } from "@/types/voice";

interface WaveformVisualizerProps {
  status: VoiceStatus;
  /** Number of bars to render */
  bars?: number;
  className?: string;
  /** Bar color — defaults to current text color */
  color?: string;
  /** Height in px */
  height?: number;
}

/**
 * Animated waveform visualizer that responds to voice status.
 * - idle: flat line
 * - listening: gentle pulse (user mic input)
 * - processing: ripple animation
 * - speaking: active waveform
 * - error: red pulse
 */
export default function WaveformVisualizer({
  status,
  bars = 40,
  className,
  color,
  height = 64,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ width: 300, height });

  // Observe container width
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

  const draw = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width: w, height: h } = dimensions;
      canvas.width = w * 2; // retina
      canvas.height = h * 2;
      ctx.scale(2, 2);
      ctx.clearRect(0, 0, w, h);

      const barWidth = Math.max(2, (w / bars) * 0.6);
      const gap = (w - barWidth * bars) / (bars - 1);
      const centerY = h / 2;

      // Determine fill color
      const computedColor =
        color ??
        (status === "error"
          ? "#ef4444"
          : status === "speaking"
          ? "#6366f1"
          : status === "listening"
          ? "#22c55e"
          : "#71717a");

      ctx.fillStyle = computedColor;

      for (let i = 0; i < bars; i++) {
        let amplitude = 0;
        const t = time / 1000;
        const x = i * (barWidth + gap);

        switch (status) {
          case "idle":
            amplitude = 2 + Math.sin(t * 0.5 + i * 0.2) * 1;
            break;
          case "connecting":
            amplitude = 4 + Math.sin(t * 2 + i * 0.3) * 3;
            break;
          case "listening": {
            const wave = Math.sin(t * 3 + i * 0.15) * 0.6;
            const pulse = Math.sin(t * 1.5) * 0.3;
            amplitude = 4 + (wave + pulse) * (h * 0.25);
            break;
          }
          case "processing": {
            const ripple = Math.sin(t * 4 - i * 0.4) * 0.5 + 0.5;
            amplitude = 3 + ripple * (h * 0.15);
            break;
          }
          case "speaking": {
            // Multi-frequency waveform for natural speech look
            const f1 = Math.sin(t * 5.5 + i * 0.25) * 0.4;
            const f2 = Math.sin(t * 3.2 + i * 0.18) * 0.3;
            const f3 = Math.sin(t * 8.1 + i * 0.35) * 0.2;
            const env = 0.5 + Math.sin(t * 0.8 + i * 0.05) * 0.3;
            amplitude = 4 + (f1 + f2 + f3) * env * (h * 0.35);
            break;
          }
          case "error":
            amplitude = 3 + Math.sin(t * 6) * Math.sin(i * 0.5) * (h * 0.2);
            break;
        }

        const barHeight = Math.max(2, Math.abs(amplitude));
        const radius = Math.min(barWidth / 2, barHeight / 2);
        
        // Draw rounded rect centered vertically
        const y = centerY - barHeight / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    },
    [bars, color, dimensions, height, status]
  );

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationRef.current);
  }, [draw]);

  return (
    <div ref={containerRef} className={cn("w-full", className)} style={{ height }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: dimensions.width, height: dimensions.height }}
      />
    </div>
  );
}
