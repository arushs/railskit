import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, FileText, Loader2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import type { SearchResult, DocumentCollection } from "@/types/rag";

interface SearchPreviewProps {
  collections: DocumentCollection[];
  results: SearchResult[];
  onSearch: (query: string, collectionIds?: string[]) => void;
  isSearching?: boolean;
  className?: string;
}

function scoreColor(score: number): string {
  if (score >= 0.9) return "text-emerald-400";
  if (score >= 0.8) return "text-blue-400";
  if (score >= 0.7) return "text-amber-400";
  return "text-zinc-400";
}

function scoreBg(score: number): string {
  if (score >= 0.9) return "bg-emerald-500/10 border-emerald-500/20";
  if (score >= 0.8) return "bg-blue-500/10 border-blue-500/20";
  if (score >= 0.7) return "bg-amber-500/10 border-amber-500/20";
  return "bg-zinc-500/10 border-zinc-500/20";
}

export default function SearchPreview({
  collections,
  results,
  onSearch,
  isSearching = false,
  className,
}: SearchPreviewProps) {
  const [query, setQuery] = useState("");
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    onSearch(
      query.trim(),
      selectedCollections.length ? selectedCollections : undefined
    );
  }, [query, selectedCollections, onSearch]);

  const toggleCollection = useCallback((id: string) => {
    setSelectedCollections((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search your documents with natural language…"
            className="pl-10 dark:bg-zinc-900/50 dark:border-zinc-700"
          />
        </div>
        <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Collection filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[10px] uppercase tracking-wider text-zinc-400 shrink-0">
          Filter:
        </span>
        {collections.map((col) => (
          <button
            key={col.id}
            onClick={() => toggleCollection(col.id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors border",
              selectedCollections.includes(col.id)
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            {col.name}
          </button>
        ))}
      </div>

      {/* Results */}
      {results.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-zinc-400">
            {results.length} results • ranked by relevance
          </p>
          {results.map((result, index) => {
            const isExpanded = expandedId === result.id;
            return (
              <Card
                key={result.id}
                className="dark:bg-zinc-900/50 bg-white overflow-hidden transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Rank */}
                    <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-500">
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {result.documentName}
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-[10px] dark:bg-zinc-800 dark:text-zinc-400"
                        >
                          {result.collectionName}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-mono",
                            scoreBg(result.score),
                            scoreColor(result.score)
                          )}
                        >
                          {(result.score * 100).toFixed(0)}% match
                        </Badge>
                      </div>

                      {/* Content preview */}
                      <p
                        className={cn(
                          "mt-2 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed",
                          !isExpanded && "line-clamp-2"
                        )}
                      >
                        {result.content}
                      </p>

                      {/* Metadata + expand */}
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-[10px] text-zinc-400">
                          Chunk #{result.chunkIndex}
                        </span>
                        {Object.entries(result.metadata)
                          .slice(0, 3)
                          .map(([key, val]) => (
                            <span
                              key={key}
                              className="text-[10px] text-zinc-400"
                            >
                              {key}: {val}
                            </span>
                          ))}
                        <button
                          onClick={() =>
                            setExpandedId(isExpanded ? null : result.id)
                          }
                          className="ml-auto flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              Less <ChevronUp className="h-3 w-3" />
                            </>
                          ) : (
                            <>
                              More <ChevronDown className="h-3 w-3" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : query && !isSearching ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-3" />
          <p className="text-sm text-zinc-500">No results found</p>
          <p className="mt-1 text-xs text-zinc-400">
            Try different keywords or broaden your collection filters
          </p>
        </div>
      ) : !query ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Sparkles className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-3" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Search across your document collections
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Uses vector embeddings for semantic search — ask questions in natural
            language
          </p>
        </div>
      ) : null}
    </div>
  );
}
