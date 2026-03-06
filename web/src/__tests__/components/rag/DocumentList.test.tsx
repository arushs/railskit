import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DocumentList } from "@/components/rag/DocumentList";
import type { Document } from "@/types/rag";

const mockDocs: Document[] = [
  {
    id: 1,
    name: "readme.md",
    file_type: "md",
    file_size: 2048,
    status: "ready",
    collection_id: 1,
    chunks_count: 5,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  {
    id: 2,
    name: "report.pdf",
    file_type: "pdf",
    file_size: 1048576,
    status: "processing",
    collection_id: 1,
    chunks_count: 0,
    created_at: "2026-01-02",
    updated_at: "2026-01-02",
  },
  {
    id: 3,
    name: "broken.txt",
    file_type: "txt",
    file_size: 512,
    status: "error",
    collection_id: 1,
    chunks_count: 0,
    error_message: "Extraction failed",
    created_at: "2026-01-03",
    updated_at: "2026-01-03",
  },
];

describe("DocumentList", () => {
  it("renders loading state", () => {
    render(<DocumentList documents={[]} loading />);
    // Loader2 renders an SVG with animate-spin
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders empty state when no documents", () => {
    render(<DocumentList documents={[]} />);
    expect(screen.getByText("No documents yet")).toBeInTheDocument();
  });

  it("renders document names and status badges", () => {
    render(<DocumentList documents={mockDocs} />);
    expect(screen.getByText("readme.md")).toBeInTheDocument();
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("Processing")).toBeInTheDocument();
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("shows error message for errored documents", () => {
    render(<DocumentList documents={mockDocs} />);
    expect(screen.getByText("Extraction failed")).toBeInTheDocument();
  });

  it("shows file size and chunk count", () => {
    render(<DocumentList documents={mockDocs} />);
    expect(screen.getByText(/2\.0 KB/)).toBeInTheDocument();
    expect(screen.getByText(/5 chunks/)).toBeInTheDocument();
  });

  it("calls onDelete when delete button clicked", () => {
    const onDelete = vi.fn();
    render(<DocumentList documents={mockDocs} onDelete={onDelete} />);
    // Hover to reveal actions
    const deleteButtons = screen.getAllByTitle("Delete");
    fireEvent.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it("calls onReprocess for errored documents", () => {
    const onReprocess = vi.fn();
    render(<DocumentList documents={mockDocs} onReprocess={onReprocess} />);
    const reprocessButtons = screen.getAllByTitle("Reprocess");
    fireEvent.click(reprocessButtons[0]);
    expect(onReprocess).toHaveBeenCalled();
  });
});
