import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Play, Square, Sliders, Mic, Volume2 } from "lucide-react";
import type { VoicePreset } from "@/types/voice";

interface VoicePresetPickerProps {
  presets: VoicePreset[];
  selected: VoicePreset | null;
  onSelect: (preset: VoicePreset) => void;
  className?: string;
}

const providerColors: Record<string, string> = {
  elevenlabs: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  openai: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  deepgram: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  custom: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const providerIcons: Record<string, typeof Mic> = {
  elevenlabs: Volume2,
  openai: Mic,
  deepgram: Mic,
  custom: Sliders,
};

export default function VoicePresetPicker({
  presets,
  selected,
  onSelect,
  className,
}: VoicePresetPickerProps) {
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const providers = [...new Set(presets.map((p) => p.provider))];
  const filtered = filter ? presets.filter((p) => p.provider === filter) : presets;

  function handlePreview(preset: VoicePreset) {
    if (previewingId === preset.id) {
      setPreviewingId(null);
      return;
    }
    setPreviewingId(preset.id);
    // Simulate preview playback
    setTimeout(() => setPreviewingId(null), 3000);
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Provider filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter(null)}
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
            !filter
              ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          )}
        >
          All ({presets.length})
        </button>
        {providers.map((p) => {
          const count = presets.filter((pr) => pr.provider === p).length;
          return (
            <button
              key={p}
              onClick={() => setFilter(filter === p ? null : p)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                filter === p
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              {p} ({count})
            </button>
          );
        })}
      </div>

      {/* Preset grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((preset) => {
          const isSelected = selected?.id === preset.id;
          const isPreviewing = previewingId === preset.id;
          const ProviderIcon = providerIcons[preset.provider] ?? Mic;

          return (
            <Card
              key={preset.id}
              className={cn(
                "group relative cursor-pointer transition-all duration-200",
                "dark:bg-zinc-900/50 bg-white hover:shadow-md",
                isSelected &&
                  "ring-2 ring-indigo-500 dark:ring-indigo-400 shadow-lg shadow-indigo-500/10"
              )}
              onClick={() => onSelect(preset)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-zinc-900 dark:text-white truncate">
                        {preset.name}
                      </h3>
                      {isSelected && (
                        <div className="shrink-0 rounded-full bg-indigo-500 p-0.5">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                      {preset.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(preset);
                    }}
                  >
                    {isPreviewing ? (
                      <Square className="h-3.5 w-3.5 text-indigo-400" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>

                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] capitalize", providerColors[preset.provider])}
                  >
                    <ProviderIcon className="mr-1 h-2.5 w-2.5" />
                    {preset.provider}
                  </Badge>
                  {preset.tags.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-[10px] dark:bg-zinc-800 dark:text-zinc-400"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Config preview */}
                {(preset.config.stability !== undefined ||
                  preset.config.speed !== undefined) && (
                  <div className="mt-3 flex gap-3 text-[10px] text-zinc-400 dark:text-zinc-500">
                    {preset.config.stability !== undefined && (
                      <span>Stability: {(preset.config.stability * 100).toFixed(0)}%</span>
                    )}
                    {preset.config.similarity !== undefined && (
                      <span>Similarity: {(preset.config.similarity * 100).toFixed(0)}%</span>
                    )}
                    {preset.config.speed !== undefined && (
                      <span>Speed: {preset.config.speed}×</span>
                    )}
                  </div>
                )}

                {/* Preview indicator */}
                {isPreviewing && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="h-3 w-0.5 rounded-full bg-indigo-400 animate-pulse"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-indigo-400">Playing preview…</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
