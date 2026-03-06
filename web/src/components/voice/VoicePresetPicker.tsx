import { useState } from "react";
import type { VoicePreset } from "@/types/voice";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Mic, Play, Volume2, Gauge } from "lucide-react";

interface VoicePresetPickerProps {
  presets: VoicePreset[];
  selected: VoicePreset;
  onSelect: (preset: VoicePreset) => void;
  className?: string;
}

const providerColors: Record<string, string> = {
  elevenlabs: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  openai: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  deepgram: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
};

export function VoicePresetPicker({
  presets,
  selected,
  onSelect,
  className,
}: VoicePresetPickerProps) {
  const [previewing, setPreviewing] = useState<string | null>(null);

  const handlePreview = (e: React.MouseEvent, presetId: string) => {
    e.stopPropagation();
    setPreviewing((prev) => (prev === presetId ? null : presetId));
    // In production, this would play the preview_url audio
    setTimeout(() => setPreviewing(null), 2000);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        <Mic className="h-4 w-4" />
        Voice Preset
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {presets.map((preset) => {
          const isSelected = selected.id === preset.id;
          const isPreviewing = previewing === preset.id;

          return (
            <Card
              key={preset.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(preset)}
              onKeyDown={(e) => e.key === "Enter" && onSelect(preset)}
              className={cn(
                "cursor-pointer transition-all duration-150",
                isSelected
                  ? "ring-2 ring-indigo-500 dark:ring-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
                  : "hover:border-zinc-300 dark:hover:border-zinc-600"
              )}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      {preset.name}
                    </span>
                    <Badge
                      className={cn(
                        "text-[10px] font-medium",
                        providerColors[preset.provider]
                      )}
                    >
                      {preset.provider}
                    </Badge>
                  </div>
                  <button
                    onClick={(e) => handlePreview(e, preset.id)}
                    className={cn(
                      "rounded-full p-1.5 transition-colors",
                      isPreviewing
                        ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
                        : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800"
                    )}
                    aria-label={`Preview ${preset.name}`}
                  >
                    {isPreviewing ? (
                      <Volume2 className="h-4 w-4 animate-pulse" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {preset.description}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-zinc-400 dark:text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3 w-3" />
                    {preset.speed}x
                  </span>
                  {preset.accent && (
                    <span>
                      {preset.accent}
                    </span>
                  )}
                  <span className="uppercase">{preset.language}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
