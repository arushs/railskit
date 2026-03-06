import { Label } from "@/components/ui/label";

interface RelevanceTunerProps {
  topK: number;
  threshold: number;
  onTopKChange: (value: number) => void;
  onThresholdChange: (value: number) => void;
}

export function RelevanceTuner({
  topK,
  threshold,
  onTopKChange,
  onThresholdChange,
}: RelevanceTunerProps) {
  return (
    <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <p className="text-sm font-medium text-zinc-300">Retrieval Parameters</p>

      {/* Top-K slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="top-k-slider" className="text-xs text-zinc-400">
            Top-K Results
          </Label>
          <span className="text-xs font-mono text-zinc-300">{topK}</span>
        </div>
        <input
          id="top-k-slider"
          type="range"
          min={1}
          max={20}
          step={1}
          value={topK}
          onChange={(e) => onTopKChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full bg-zinc-700 appearance-none cursor-pointer accent-indigo-500"
        />
        <div className="flex justify-between text-[10px] text-zinc-600">
          <span>1</span>
          <span>10</span>
          <span>20</span>
        </div>
      </div>

      {/* Threshold slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="threshold-slider" className="text-xs text-zinc-400">
            Relevance Threshold
          </Label>
          <span className="text-xs font-mono text-zinc-300">
            {(threshold * 100).toFixed(0)}%
          </span>
        </div>
        <input
          id="threshold-slider"
          type="range"
          min={0}
          max={100}
          step={5}
          value={threshold * 100}
          onChange={(e) => onThresholdChange(Number(e.target.value) / 100)}
          className="w-full h-1.5 rounded-full bg-zinc-700 appearance-none cursor-pointer accent-indigo-500"
        />
        <div className="flex justify-between text-[10px] text-zinc-600">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
