import { useState, useEffect, useCallback } from "react";
import { documentsApi } from "@/lib/rag-api";
import type { Document } from "@/types/rag";

export function useDocuments(collectionId: number | null) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!collectionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await documentsApi.list(collectionId);
      if (res.ok) {
        setDocuments(res.data.documents);
      } else {
        setError("Failed to fetch documents");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const deleteDocument = useCallback(async (id: number) => {
    await documentsApi.delete(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const reprocessDocument = useCallback(async (id: number) => {
    const res = await documentsApi.reprocess(id);
    if (res.ok) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? res.data.document : d))
      );
    }
  }, []);

  return {
    documents,
    loading,
    error,
    refetch: fetch,
    deleteDocument,
    reprocessDocument,
  };
}
