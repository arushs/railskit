import type { Handoff } from "@/types/workflow";
import { ArrowRight } from "lucide-react";

interface HandoffIndicatorProps {
  handoff: Handoff;
  compact?: boolean;
}

export function HandoffIndicator({ handoff, compact = false }: HandoffIndicatorProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
        <span>{handoff.fromAgentEmoji}</span>
        <ArrowRight className="h-3 w-3 text-indigo-400" />
        <span>{handoff.toAgentEmoji}</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
      {/* Decorative gradient line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

      {/* From agent */}
      <div className="flex items-center gap-2">
        <span className="text-lg">{handoff.fromAgentEmoji}</span>
        <span className="text-sm font-medium text-zinc-300">{handoff.fromAgentName}</span>
      </div>

      {/* Arrow with pulse */}
      <div className="flex items-center gap-1">
        <div className="h-px w-6 bg-gradient-to-r from-indigo-500/60 to-purple-500/60" />
        <div className="relative">
          <ArrowRight className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="h-px w-6 bg-gradient-to-r from-purple-500/60 to-indigo-500/60" />
      </div>

      {/* To agent */}
      <div className="flex items-center gap-2">
        <span className="text-lg">{handoff.toAgentEmoji}</span>
        <span className="text-sm font-medium text-zinc-300">{handoff.toAgentName}</span>
      </div>

      {/* Reason */}
      <div className="ml-auto max-w-xs">
        <p className="text-xs text-zinc-500 truncate" title={handoff.reason}>
          {handoff.reason}
        </p>
      </div>
    </div>
  );
}
