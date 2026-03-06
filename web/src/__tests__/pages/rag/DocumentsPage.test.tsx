import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router";
import { DocumentsPage } from "@/pages/rag/DocumentsPage";

const mockCollections = [
  { id: 1, name: "Product Docs", description: "All product documentation", chunking_strategy: "paragraph" as const, chunk_size: 512, chunk_overlap: 50, embedding_model: "text-embedding-3-small", documents_count: 10, created_at: "2026-01-01", updated_at: "2026-01-01" },
];

const mockCreateCollection = vi.fn().mockResolvedValue(mockCollections[0]);
const mockDeleteCollection = vi.fn();

vi.mock("@/hooks/useCollections", () => ({
  useCollections: () => ({
    collections: mockCollections,
    loading: false,
    error: null,
    refetch: vi.fn(),
    createCollection: mockCreateCollection,
    updateCollection: vi.fn(),
    deleteCollection: mockDeleteCollection,
  }),
}));

vi.mock("@/components/seo/SEO", () => ({
  default: () => null,
}));

describe("DocumentsPage", () => {
  it("renders page title", () => {
    render(
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>
    );
    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(
      screen.getByText(/Manage knowledge base collections/i)
    ).toBeInTheDocument();
  });

  it("renders collection cards", () => {
    render(
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>
    );
    expect(screen.getByText("Product Docs")).toBeInTheDocument();
    expect(screen.getByText("10 docs")).toBeInTheDocument();
  });

  it("shows new collection form when button clicked", () => {
    render(
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText("New Collection"));
    expect(screen.getByText("New Collection", { selector: "div" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });
});
