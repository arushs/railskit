import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Save, X } from "lucide-react";
import type { DocumentCollection, ChunkingStrategy } from "@/types/rag";

const CHUNKING_STRATEGIES: { value: ChunkingStrategy; label: string; description: string }[] = [
  { value: "paragraph", label: "Paragraph", description: "Split by paragraph breaks" },
  { value: "page", label: "Page", description: "Split by page (PDFs)" },
  { value: "semantic", label: "Semantic", description: "Split by semantic boundaries" },
  { value: "sliding_window", label: "Sliding Window", description: "Overlapping windows" },
  { value: "markdown", label: "Markdown", description: "Split by headers" },
];

const EMBEDDING_MODELS = [
  "text-embedding-3-small",
  "text-embedding-3-large",
  "text-embedding-ada-002",
];

interface CollectionManagerProps {
  collection?: DocumentCollection | null;
  onSave: (data: Partial<DocumentCollection>) => Promise<unknown>;
  onCancel?: () => void;
}

export function CollectionManager({
  collection,
  onSave,
  onCancel,
}: CollectionManagerProps) {
  const [name, setName] = useState(collection?.name ?? "");
  const [description, setDescription] = useState(collection?.description ?? "");
  const [chunkingStrategy, setChunkingStrategy] = useState<ChunkingStrategy>(
    collection?.chunking_strategy ?? "paragraph"
  );
  const [chunkSize, setChunkSize] = useState(collection?.chunk_size ?? 512);
  const [chunkOverlap, setChunkOverlap] = useState(
    collection?.chunk_overlap ?? 50
  );
  const [embeddingModel, setEmbeddingModel] = useState(
    collection?.embedding_model ?? "text-embedding-3-small"
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        chunking_strategy: chunkingStrategy,
        chunk_size: chunkSize,
        chunk_overlap: chunkOverlap,
        embedding_model: embeddingModel,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="dark:bg-zinc-900/50 bg-white">
      <CardHeader className="p-6 pb-4">
        <CardTitle className="text-base">
          {collection ? "Edit Collection" : "New Collection"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="collection-name">Name</Label>
            <Input
              id="collection-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Product Docs"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="collection-desc">Description</Label>
            <Input
              id="collection-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chunking-strategy">Chunking Strategy</Label>
            <select
              id="chunking-strategy"
              value={chunkingStrategy}
              onChange={(e) =>
                setChunkingStrategy(e.target.value as ChunkingStrategy)
              }
              className="flex h-10 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {CHUNKING_STRATEGIES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label} — {s.description}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chunk-size">Chunk Size (tokens)</Label>
              <Input
                id="chunk-size"
                type="number"
                min={64}
                max={4096}
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chunk-overlap">Overlap (tokens)</Label>
              <Input
                id="chunk-overlap"
                type="number"
                min={0}
                max={512}
                value={chunkOverlap}
                onChange={(e) => setChunkOverlap(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="embedding-model">Embedding Model</Label>
            <select
              id="embedding-model"
              value={embeddingModel}
              onChange={(e) => setEmbeddingModel(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {EMBEDDING_MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button type="submit" size="sm" disabled={saving || !name.trim()}>
              {saving ? (
                <span className="animate-spin mr-1">⏳</span>
              ) : collection ? (
                <Save className="h-4 w-4 mr-1" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              {collection ? "Save Changes" : "Create Collection"}
            </Button>
            {onCancel && (
              <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
