import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Database, X } from "lucide-react";
import type { DocumentCollection, RAGSettings } from "@/types/rag";

interface RAGSettingsPanelProps {
  settings: RAGSettings;
  collections: DocumentCollection[];
  onSave: (settings: RAGSettings) => void;
}

export function RAGSettingsPanel({
  settings,
  collections,
  onSave,
}: RAGSettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState<RAGSettings>(settings);
  const isDirty = JSON.stringify(localSettings) !== JSON.stringify(settings);

  const toggleCollection = (id: number) => {
    setLocalSettings((prev) => ({
      ...prev,
      collection_ids: prev.collection_ids.includes(id)
        ? prev.collection_ids.filter((c) => c !== id)
        : [...prev.collection_ids, id],
    }));
  };

  return (
    <Card className="dark:bg-zinc-900/50 bg-white">
      <CardHeader className="p-6 pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="h-4 w-4" />
          RAG Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-5">
        {/* Collection Selection */}
        <div className="space-y-2">
          <Label className="text-xs text-zinc-400">Knowledge Collections</Label>
          {collections.length === 0 ? (
            <p className="text-xs text-zinc-500">
              No collections available. Create one first.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {collections.map((col) => {
                const selected = localSettings.collection_ids.includes(col.id);
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => toggleCollection(col.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm border transition-colors ${
                      selected
                        ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                        : "border-zinc-700 bg-zinc-900/30 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    {col.name}
                    {selected && <X className="h-3 w-3" />}
                    <Badge variant="secondary" className="ml-1 text-[10px]">
                      {col.documents_count}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Auto-inject toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="auto-inject" className="text-sm text-zinc-300">
              Auto-inject context
            </Label>
            <p className="text-xs text-zinc-500 mt-0.5">
              Automatically inject relevant chunks into agent prompts
            </p>
          </div>
          <button
            id="auto-inject"
            type="button"
            role="switch"
            aria-checked={localSettings.auto_inject}
            onClick={() =>
              setLocalSettings((prev) => ({
                ...prev,
                auto_inject: !prev.auto_inject,
              }))
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              localSettings.auto_inject ? "bg-indigo-500" : "bg-zinc-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                localSettings.auto_inject ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Top-K slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="rag-top-k" className="text-xs text-zinc-400">
              Top-K Chunks
            </Label>
            <span className="text-xs font-mono text-zinc-300">
              {localSettings.top_k}
            </span>
          </div>
          <input
            id="rag-top-k"
            type="range"
            min={1}
            max={10}
            step={1}
            value={localSettings.top_k}
            onChange={(e) =>
              setLocalSettings((prev) => ({
                ...prev,
                top_k: Number(e.target.value),
              }))
            }
            className="w-full h-1.5 rounded-full bg-zinc-700 appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-600">
            <span>1</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>

        {/* Save button */}
        {isDirty && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => onSave(localSettings)}
            >
              <Save className="h-4 w-4 mr-1" />
              Save Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocalSettings(settings)}
            >
              Reset
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
