import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ChunkViewer } from "@/components/rag/ChunkViewer";

vi.mock("@/lib/rag-api", () => ({
  documentsApi: {
    chunks: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        chunks: [
          { id: 1, content: "First chunk of text content here.", position: 0, token_count: 8, document_id: 1 },
          { id: 2, content: "Second chunk with more detailed content.", position: 1, token_count: 10, document_id: 1 },
          { id: 3, content: "Third and final chunk.", position: 2, token_count: 5, document_id: 1 },
        ],
      },
    }),
  },
}));

describe("ChunkViewer", () => {
  it("renders loading state initially", () => {
    render(<ChunkViewer documentId={1} />);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders chunks after loading", async () => {
    render(<ChunkViewer documentId={1} documentName="test.md" />);
    await waitFor(() => {
      expect(screen.getByText("test.md")).toBeInTheDocument();
    });
    expect(screen.getByText("3 chunks")).toBeInTheDocument();
    expect(screen.getByText("23 total tokens")).toBeInTheDocument();
  });

  it("renders individual chunk content", async () => {
    render(<ChunkViewer documentId={1} />);
    await waitFor(() => {
      expect(screen.getByText(/First chunk/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Second chunk/)).toBeInTheDocument();
    expect(screen.getByText(/Third and final/)).toBeInTheDocument();
  });

  it("renders token counts per chunk", async () => {
    render(<ChunkViewer documentId={1} />);
    await waitFor(() => {
      expect(screen.getByText("8 tokens")).toBeInTheDocument();
    });
    expect(screen.getByText("10 tokens")).toBeInTheDocument();
    expect(screen.getByText("5 tokens")).toBeInTheDocument();
  });

  it("expands chunk on click", async () => {
    render(<ChunkViewer documentId={1} />);
    await waitFor(() => {
      expect(screen.getByText(/First chunk/)).toBeInTheDocument();
    });
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    const chunkText = screen.getByText(/First chunk/);
    expect(chunkText.className).not.toContain("line-clamp-2");
  });
});
