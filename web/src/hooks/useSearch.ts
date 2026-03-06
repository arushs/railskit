import { useState, useCallback, useRef, useEffect } from "react";
import { searchApi } from "@/lib/rag-api";
import type { SearchResult } from "@/types/rag";

export function useSearch(collectionId: number | null) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);

  const search = useCallback(
    async (query: string, topK = 5, threshold = 0.5) => {
      if (!collectionId || !query.trim()) {
        setResults([]);
        return;
      }

      // Cancel previous debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      abortRef.current = false;

      debounceRef.current = setTimeout(async () => {
        if (abortRef.current) return;
        setLoading(true);
        setError(null);
        try {
          const res = await searchApi.search({
            collection_id: collectionId,
            query: query.trim(),
            top_k: topK,
            threshold,
          });
          if (!abortRef.current && res.ok) {
            setResults(res.data.results);
          } else if (!abortRef.current) {
            setError("Search failed");
          }
        } catch (e) {
          if (!abortRef.current) {
            setError(e instanceof Error ? e.message : "Search error");
          }
        } finally {
          if (!abortRef.current) {
            setLoading(false);
          }
        }
      }, 300);
    },
    [collectionId]
  );

  const clearResults = useCallback(() => {
    abortRef.current = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setResults([]);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { results, loading, error, search, clearResults };
}
