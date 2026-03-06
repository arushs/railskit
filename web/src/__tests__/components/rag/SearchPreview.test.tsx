import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SearchPreview } from "@/components/rag/SearchPreview";
import type { SearchResult } from "@/types/rag";

const mockResults: SearchResult[] = [
  {
    chunk: { id: 1, content: "React is a JavaScript library for building user interfaces", position: 1, token_count: 12, document_id: 1 },
    score: 0.92,
    document_name: "react-docs.md",
    highlights: ["React"],
  },
  {
    chunk: { id: 2, content: "Vue is another popular frontend framework", position: 3, token_count: 8, document_id: 2 },
    score: 0.65,
    document_name: "vue-guide.md",
    highlights: [],
  },
];

describe("SearchPreview", () => {
  const defaultProps = {
    results: [] as SearchResult[],
    loading: false,
    error: null,
    onSearch: vi.fn(),
  };

  it("renders search input", () => {
    render(<SearchPreview {...defaultProps} />);
    expect(screen.getByLabelText("Search documents")).toBeInTheDocument();
  });

  it("calls onSearch when typing", () => {
    render(<SearchPreview {...defaultProps} />);
    fireEvent.change(screen.getByLabelText("Search documents"), {
      target: { value: "react" },
    });
    expect(defaultProps.onSearch).toHaveBeenCalledWith("react");
  });

  it("renders search results with scores", () => {
    render(<SearchPreview {...defaultProps} results={mockResults} />);
    expect(screen.getByText("react-docs.md")).toBeInTheDocument();
    expect(screen.getByText("vue-guide.md")).toBeInTheDocument();
    expect(screen.getByText("92.0%")).toBeInTheDocument();
    expect(screen.getByText("65.0%")).toBeInTheDocument();
    expect(screen.getByText("2 results")).toBeInTheDocument();
  });

  it("shows error message", () => {
    render(<SearchPreview {...defaultProps} error="Search failed" />);
    expect(screen.getByText("Search failed")).toBeInTheDocument();
  });

  it("shows loading spinner", () => {
    render(<SearchPreview {...defaultProps} loading />);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("shows empty results message when query has no matches", () => {
    render(<SearchPreview {...defaultProps} />);
    fireEvent.change(screen.getByLabelText("Search documents"), {
      target: { value: "nonexistent" },
    });
    expect(screen.getByText(/No results found/)).toBeInTheDocument();
  });
});
