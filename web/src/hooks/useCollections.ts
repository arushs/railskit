import { useState, useEffect, useCallback } from "react";
import { collectionsApi } from "@/lib/rag-api";
import type { DocumentCollection } from "@/types/rag";

export function useCollections() {
  const [collections, setCollections] = useState<DocumentCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await collectionsApi.list();
      if (res.ok) {
        setCollections(res.data.collections);
      } else {
        setError("Failed to fetch collections");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const createCollection = useCallback(
    async (data: Partial<DocumentCollection>) => {
      const res = await collectionsApi.create(data);
      if (res.ok) {
        setCollections((prev) => [...prev, res.data.collection]);
        return res.data.collection;
      }
      throw new Error("Failed to create collection");
    },
    []
  );

  const updateCollection = useCallback(
    async (id: number, data: Partial<DocumentCollection>) => {
      const res = await collectionsApi.update(id, data);
      if (res.ok) {
        setCollections((prev) =>
          prev.map((c) => (c.id === id ? res.data.collection : c))
        );
        return res.data.collection;
      }
      throw new Error("Failed to update collection");
    },
    []
  );

  const deleteCollection = useCallback(async (id: number) => {
    await collectionsApi.delete(id);
    setCollections((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return {
    collections,
    loading,
    error,
    refetch: fetch,
    createCollection,
    updateCollection,
    deleteCollection,
  };
}
