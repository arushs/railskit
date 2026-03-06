import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface VoicePreset {
  id: string;
  name: string;
  description: string;
  provider: string;
  voiceId: string;
  /** Tags like "warm", "professional", "energetic" */
  characteristics: string[];
  /** URL to a sample audio clip */
  sampleUrl?: string;
  /** Preview image/avatar */
  avatarUrl?: string;
}

export interface VoicePresetPickerProps {
  /** Available voice presets */
  presets: VoicePreset[];
  /** Currently selected preset ID */
  selectedId?: string;
  /** Called when a preset is selected */
  onSelect: (preset: VoicePreset) => void;
  /** Whether picker is loading presets */
  isLoading?: boolean;
  className?: string;
}

/**
 * Voice preset picker with visual cards and audio preview.
 * Allows selecting an agent voice from available presets.
 */
export function VoicePresetPicker({
  presets,
  selectedId,
  onSelect,
  isLoading = false,
  className,
}: VoicePresetPickerProps) {
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [audioEl] = useState(() =>
    typeof Audio !== "undefined" ? new Audio() : null
  );

  const handlePreview = (preset: VoicePreset) => {
    if (!audioEl || !preset.sampleUrl) return;

    if (previewingId === preset.id) {
      // Stop preview
      audioEl.pause();
      audioEl.currentTime = 0;
      setPreviewingId(null);
      return;
    }

    audioEl.src = preset.sampleUrl;
    audioEl.onended = () => setPreviewingId(null);
    audioEl.onerror = () => setPreviewingId(null);
    audioEl.play();
    setPreviewingId(preset.id);
  };

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/50"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-zinc-300">Select Voice</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {presets.map((preset) => {
          const isSelected = preset.id === selectedId;
          const isPreviewing = preset.id === previewingId;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset)}
              className={cn(
                "group relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all",
                "hover:border-theme-primary/50 hover:bg-zinc-800/50",
                isSelected
                  ? "border-theme-primary bg-theme-primary/10 shadow-[0_0_16px_rgba(var(--color-primary),0.1)]"
                  : "border-zinc-800 bg-zinc-900/50"
              )}
              aria-pressed={isSelected}
              aria-label={`Select ${preset.name} voice`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg",
                    isSelected
                      ? "bg-theme-primary/20"
                      : "bg-zinc-800"
                  )}
                >
                  {preset.avatarUrl ? (
                    <img
                      src={preset.avatarUrl}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span role="img" aria-hidden>
                      🎙️
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-200">
                      {preset.name}
                    </span>
                    {isSelected && (
                      <span className="rounded-full bg-theme-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-theme-primary">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">
                    {preset.description}
                  </p>
                </div>
              </div>

              {/* Characteristics */}
              <div className="flex flex-wrap gap-1">
                {preset.characteristics.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Preview indicator — actual preview triggered via separate element */}
              {preset.sampleUrl && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(preset);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      e.preventDefault();
                      handlePreview(preset);
                    }
                  }}
                  className="mt-1 inline-flex cursor-pointer items-center gap-1 self-start rounded-lg px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                  aria-label={
                    isPreviewing
                      ? `Stop preview of ${preset.name}`
                      : `Preview ${preset.name} voice`
                  }
                >
                  {isPreviewing ? "⏹ Stop" : "▶ Preview"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
