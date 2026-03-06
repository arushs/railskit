import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCollections } from "@/hooks/useCollections";

vi.mock("@/lib/rag-api", () => ({
  collectionsApi: {
    list: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        collections: [
          { id: 1, name: "Docs", chunking_strategy: "paragraph", chunk_size: 512, chunk_overlap: 50, embedding_model: "text-embedding-3-small", documents_count: 5, created_at: "2026-01-01", updated_at: "2026-01-01" },
          { id: 2, name: "FAQ", chunking_strategy: "markdown", chunk_size: 256, chunk_overlap: 25, embedding_model: "text-embedding-3-small", documents_count: 2, created_at: "2026-01-02", updated_at: "2026-01-02" },
        ],
      },
    }),
    create: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        collection: { id: 3, name: "New", chunking_strategy: "semantic", chunk_size: 1024, chunk_overlap: 100, embedding_model: "text-embedding-3-large", documents_count: 0, created_at: "2026-01-03", updated_at: "2026-01-03" },
      },
    }),
    update: vi.fn().mockResolvedValue({ ok: true, data: { collection: { id: 1, name: "Updated" } } }),
    delete: vi.fn().mockResolvedValue({ ok: true }),
  },
}));

describe("useCollections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches collections on mount", async () => {
    const { result } = renderHook(() => useCollections());
    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.collections).toHaveLength(2);
    expect(result.current.collections[0].name).toBe("Docs");
  });

  it("creates a collection", async () => {
    const { result } = renderHook(() => useCollections());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createCollection({ name: "New" });
    });
    expect(result.current.collections).toHaveLength(3);
  });

  it("deletes a collection", async () => {
    const { result } = renderHook(() => useCollections());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteCollection(1);
    });
    expect(result.current.collections).toHaveLength(1);
    expect(result.current.collections[0].id).toBe(2);
  });
});
