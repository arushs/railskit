import { useState, useEffect } from "react";
import { Loader2, Hash, Type } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { documentsApi } from "@/lib/rag-api";
import type { Chunk } from "@/types/rag";

interface ChunkViewerProps {
  documentId: number;
  documentName?: string;
}

export function ChunkViewer({ documentId, documentName }: ChunkViewerProps) {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChunk, setSelectedChunk] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    documentsApi.chunks(documentId).then((res) => {
      if (!cancelled && res.ok) {
        setChunks(res.data.chunks);
      }
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  const totalTokens = chunks.reduce((sum, c) => sum + c.token_count, 0);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-4 text-xs text-zinc-400">
        {documentName && (
          <span className="font-medium text-zinc-300">{documentName}</span>
        )}
        <span className="flex items-center gap-1">
          <Hash className="h-3 w-3" />
          {chunks.length} chunks
        </span>
        <span className="flex items-center gap-1">
          <Type className="h-3 w-3" />
          {totalTokens.toLocaleString()} total tokens
        </span>
      </div>

      {/* Chunk list */}
      <div className="space-y-2">
        {chunks.map((chunk) => (
          <button
            key={chunk.id}
            type="button"
            onClick={() =>
              setSelectedChunk(selectedChunk === chunk.id ? null : chunk.id)
            }
            className={`w-full text-left rounded-lg border p-3 transition-colors ${
              selectedChunk === chunk.id
                ? "border-indigo-500/50 bg-indigo-500/5"
                : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">#{chunk.position}</Badge>
                <span className="text-xs text-zinc-500">
                  {chunk.token_count} tokens
                </span>
              </div>
              <div
                className="h-1.5 rounded-full bg-zinc-800 overflow-hidden"
                style={{ width: "60px" }}
                title={`${chunk.token_count} tokens`}
              >
                <div
                  className="h-full rounded-full bg-indigo-500/60"
                  style={{
                    width: `${Math.min(100, (chunk.token_count / (chunks[0]?.token_count || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <p
              className={`text-sm text-zinc-300 leading-relaxed ${
                selectedChunk === chunk.id ? "" : "line-clamp-2"
              }`}
            >
              {chunk.content}
            </p>
          </button>
        ))}
      </div>

      {chunks.length === 0 && (
        <p className="text-sm text-zinc-500 text-center py-8">
          No chunks found for this document.
        </p>
      )}
    </div>
  );
}
