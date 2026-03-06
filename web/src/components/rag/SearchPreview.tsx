import { useState } from "react";
import type { SearchResult, Collection } from "@/types/rag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Search, FileText, Sparkles, ArrowRight } from "lucide-react";

interface SearchPreviewProps {
  collections: Collection[];
  results?: SearchResult[];
  onSearch?: (query: string, collectionIds: string[], topK: number) => void;
  className?: string;
}

function similarityColor(score: number): string {
  if (score >= 0.9) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 0.8) return "text-blue-600 dark:text-blue-400";
  if (score >= 0.7) return "text-amber-600 dark:text-amber-400";
  return "text-zinc-500 dark:text-zinc-400";
}

function similarityBg(score: number): string {
  if (score >= 0.9) return "bg-emerald-500";
  if (score >= 0.8) return "bg-blue-500";
  if (score >= 0.7) return "bg-amber-500";
  return "bg-zinc-400";
}

export function SearchPreview({
  collections,
  results: externalResults,
  onSearch,
  className,
}: SearchPreviewProps) {
  const [query, setQuery] = useState("");
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [topK, setTopK] = useState(5);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | undefined>(externalResults);

  const toggleCollection = (id: string) => {
    setSelectedCollections((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsSearching(true);

    if (onSearch) {
      onSearch(query, selectedCollections, topK);
    }

    // Simulate search delay for demo
    setTimeout(() => {
      setResults(externalResults);
      setIsSearching(false);
    }, 800);
  };

  return (
    <Card className={cn("dark:bg-zinc-900/50 bg-white", className)}>
      <CardHeader className="p-4 pb-0">
        <CardTitle className="flex items-center gap-2 text-base text-zinc-900 dark:text-white">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          Semantic Search
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Search input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Ask a question about your documents…"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-10 pr-4 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!query.trim() || isSearching}
            className="rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5 shrink-0"
          >
            {isSearching ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            Search
          </button>
        </div>

        {/* Collection filter */}
        <div className="flex flex-wrap gap-2">
          {collections.map((col) => {
            const isSelected = selectedCollections.includes(col.id);
            return (
              <button
                key={col.id}
                onClick={() => toggleCollection(col.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-all duration-150",
                  isSelected
                    ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-700"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                )}
              >
                {col.name}
                <span className="ml-1 opacity-60">{col.document_count}</span>
              </button>
            );
          })}
        </div>

        {/* Top-K slider */}
        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <label htmlFor="topk">Results:</label>
          <input
            id="topk"
            type="range"
            min={1}
            max={20}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className="flex-1 accent-indigo-500"
          />
          <span className="font-mono w-6 text-right">{topK}</span>
        </div>

        {/* Results */}
        {results && results.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {results.length} results
            </h4>
            {results.map((result, i) => (
              <div
                key={result.id}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 space-y-2 bg-white dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono text-zinc-400 shrink-0">
                      #{i + 1}
                    </span>
                    <FileText className="h-4 w-4 text-zinc-400 shrink-0" />
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 truncate">
                      {result.document_name}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      chunk {result.chunk_index}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="h-1.5 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", similarityBg(result.similarity))}
                        style={{ width: `${result.similarity * 100}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-xs font-mono font-medium",
                        similarityColor(result.similarity)
                      )}
                    >
                      {(result.similarity * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {result.content}
                </p>
                <div className="text-[10px] text-zinc-400">
                  {result.collection_name}
                </div>
              </div>
            ))}
          </div>
        )}

        {results && results.length === 0 && (
          <div className="text-center py-8">
            <Search className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              No matching documents found
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
