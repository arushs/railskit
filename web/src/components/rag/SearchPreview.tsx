import { useState } from "react";
import { Search, Loader2, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { SearchResult } from "@/types/rag";

interface SearchPreviewProps {
  results: SearchResult[];
  loading: boolean;
  error?: string | null;
  onSearch: (query: string) => void;
}

function highlightText(text: string, highlights: string[]): React.ReactNode {
  if (!highlights.length) return text;

  let result = text;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Simple highlight: bold matching segments
  for (const highlight of highlights) {
    const idx = result.toLowerCase().indexOf(highlight.toLowerCase(), lastIndex);
    if (idx >= 0) {
      if (idx > lastIndex) {
        parts.push(result.slice(lastIndex, idx));
      }
      parts.push(
        <mark
          key={`${idx}-${highlight}`}
          className="bg-indigo-500/30 text-indigo-200 rounded px-0.5"
        >
          {result.slice(idx, idx + highlight.length)}
        </mark>
      );
      lastIndex = idx + highlight.length;
    }
  }
  if (lastIndex < result.length) {
    parts.push(result.slice(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}

function scoreColor(score: number): string {
  if (score >= 0.8) return "text-emerald-400";
  if (score >= 0.6) return "text-amber-400";
  return "text-zinc-400";
}

export function SearchPreview({
  results,
  loading,
  error,
  onSearch,
}: SearchPreviewProps) {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onSearch(val);
  };

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          value={query}
          onChange={handleChange}
          placeholder="Test a search query..."
          className="pl-10"
          aria-label="Search documents"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-indigo-400" />
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          {results.map((result, i) => (
            <div
              key={`${result.chunk.id}-${i}`}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="text-xs text-zinc-400">
                    {result.document_name}
                  </span>
                  <Badge variant="secondary">
                    Chunk #{result.chunk.position}
                  </Badge>
                </div>
                <span
                  className={`text-xs font-mono font-semibold ${scoreColor(result.score)}`}
                >
                  {(result.score * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {highlightText(result.chunk.content, result.highlights)}
              </p>
              <p className="text-xs text-zinc-600">
                {result.chunk.token_count} tokens
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && query.trim() && results.length === 0 && !error && (
        <p className="text-sm text-zinc-500 text-center py-6">
          No results found for "{query}"
        </p>
      )}
    </div>
  );
}
