import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDocuments } from "@/hooks/useDocuments";

vi.mock("@/lib/rag-api", () => ({
  documentsApi: {
    list: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        documents: [
          { id: 1, name: "file1.pdf", file_type: "pdf", file_size: 1024, status: "ready", collection_id: 1, chunks_count: 3, created_at: "2026-01-01", updated_at: "2026-01-01" },
          { id: 2, name: "file2.txt", file_type: "txt", file_size: 512, status: "processing", collection_id: 1, chunks_count: 0, created_at: "2026-01-02", updated_at: "2026-01-02" },
        ],
      },
    }),
    delete: vi.fn().mockResolvedValue({ ok: true }),
    reprocess: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        document: { id: 1, name: "file1.pdf", file_type: "pdf", file_size: 1024, status: "processing", collection_id: 1, chunks_count: 3, created_at: "2026-01-01", updated_at: "2026-01-01" },
      },
    }),
  },
}));

describe("useDocuments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches documents for a collection", async () => {
    const { result } = renderHook(() => useDocuments(1));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.documents).toHaveLength(2);
    expect(result.current.documents[0].name).toBe("file1.pdf");
  });

  it("does not fetch when collectionId is null", async () => {
    const { result } = renderHook(() => useDocuments(null));
    expect(result.current.documents).toHaveLength(0);
    expect(result.current.loading).toBe(false);
  });

  it("deletes a document from the list", async () => {
    const { result } = renderHook(() => useDocuments(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteDocument(1);
    });
    expect(result.current.documents).toHaveLength(1);
    expect(result.current.documents[0].id).toBe(2);
  });

  it("reprocesses a document", async () => {
    const { result } = renderHook(() => useDocuments(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.reprocessDocument(1);
    });
    expect(result.current.documents[0].status).toBe("processing");
  });
});
