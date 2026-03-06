import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSearch } from "@/hooks/useSearch";

vi.mock("@/lib/rag-api", () => ({
  searchApi: {
    search: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        results: [
          {
            chunk: { id: 1, content: "Test content", position: 0, token_count: 3, document_id: 1 },
            score: 0.9,
            document_name: "test.md",
            highlights: ["Test"],
          },
        ],
      },
    }),
  },
}));

describe("useSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it("returns empty results initially", () => {
    const { result } = renderHook(() => useSearch(1));
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("does not search with null collectionId", async () => {
    const { result } = renderHook(() => useSearch(null));
    act(() => {
      result.current.search("test");
    });
    vi.advanceTimersByTime(400);
    expect(result.current.results).toEqual([]);
  });

  it("does not search with empty query", async () => {
    const { result } = renderHook(() => useSearch(1));
    act(() => {
      result.current.search("   ");
    });
    vi.advanceTimersByTime(400);
    expect(result.current.results).toEqual([]);
  });

  it("searches after debounce delay", async () => {
    vi.useRealTimers();
    const { result } = renderHook(() => useSearch(1));
    act(() => {
      result.current.search("test query");
    });
    await waitFor(
      () => {
        expect(result.current.results).toHaveLength(1);
      },
      { timeout: 1000 }
    );
    expect(result.current.results[0].score).toBe(0.9);
  });

  it("clears results", async () => {
    vi.useRealTimers();
    const { result } = renderHook(() => useSearch(1));
    act(() => {
      result.current.search("test");
    });
    await waitFor(
      () => {
        expect(result.current.results).toHaveLength(1);
      },
      { timeout: 1000 }
    );
    act(() => {
      result.current.clearResults();
    });
    expect(result.current.results).toEqual([]);
  });
});
