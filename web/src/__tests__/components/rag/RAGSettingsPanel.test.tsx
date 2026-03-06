import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RAGSettingsPanel } from "@/components/rag/RAGSettingsPanel";
import type { DocumentCollection, RAGSettings } from "@/types/rag";

const mockCollections: DocumentCollection[] = [
  {
    id: 1,
    name: "Product Docs",
    chunking_strategy: "paragraph",
    chunk_size: 512,
    chunk_overlap: 50,
    embedding_model: "text-embedding-3-small",
    documents_count: 10,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  {
    id: 2,
    name: "FAQ",
    chunking_strategy: "markdown",
    chunk_size: 256,
    chunk_overlap: 25,
    embedding_model: "text-embedding-3-small",
    documents_count: 3,
    created_at: "2026-01-02",
    updated_at: "2026-01-02",
  },
];

const mockSettings: RAGSettings = {
  collection_ids: [1],
  auto_inject: true,
  top_k: 3,
};

describe("RAGSettingsPanel", () => {
  const defaultProps = {
    settings: mockSettings,
    collections: mockCollections,
    onSave: vi.fn(),
  };

  it("renders collection buttons", () => {
    render(<RAGSettingsPanel {...defaultProps} />);
    expect(screen.getByText("Product Docs")).toBeInTheDocument();
    expect(screen.getByText("FAQ")).toBeInTheDocument();
  });

  it("shows selected collection as active", () => {
    render(<RAGSettingsPanel {...defaultProps} />);
    const productDocs = screen.getByText("Product Docs").closest("button")!;
    expect(productDocs.className).toContain("indigo");
  });

  it("renders auto-inject toggle", () => {
    render(<RAGSettingsPanel {...defaultProps} />);
    expect(screen.getByText("Auto-inject context")).toBeInTheDocument();
    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("renders top-k slider with current value", () => {
    render(<RAGSettingsPanel {...defaultProps} />);
    const slider = screen.getByLabelText("Top-K Chunks");
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveValue("3");
  });

  it("shows save button when settings change", () => {
    render(<RAGSettingsPanel {...defaultProps} />);
    // Initially no save button (no changes)
    expect(screen.queryByText("Save Settings")).not.toBeInTheDocument();
    // Toggle auto-inject
    fireEvent.click(screen.getByRole("switch"));
    expect(screen.getByText("Save Settings")).toBeInTheDocument();
  });

  it("calls onSave with updated settings", () => {
    render(<RAGSettingsPanel {...defaultProps} />);
    // Toggle auto-inject off
    fireEvent.click(screen.getByRole("switch"));
    fireEvent.click(screen.getByText("Save Settings"));
    expect(defaultProps.onSave).toHaveBeenCalledWith(
      expect.objectContaining({ auto_inject: false })
    );
  });

  it("shows empty state when no collections", () => {
    render(
      <RAGSettingsPanel {...defaultProps} collections={[]} />
    );
    expect(
      screen.getByText(/No collections available/i)
    ).toBeInTheDocument();
  });
});
