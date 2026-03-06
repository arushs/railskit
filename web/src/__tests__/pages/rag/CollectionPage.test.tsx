import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { CollectionPage } from "@/pages/rag/CollectionPage";

vi.mock("@/lib/rag-api", () => ({
  collectionsApi: {
    get: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        collection: {
          id: 1,
          name: "Test Collection",
          description: "Test desc",
          chunking_strategy: "paragraph",
          chunk_size: 512,
          chunk_overlap: 50,
          embedding_model: "text-embedding-3-small",
          documents_count: 5,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
        },
      },
    }),
    update: vi.fn(),
  },
  documentsApi: {
    list: vi.fn().mockResolvedValue({ ok: true, data: { documents: [] } }),
    upload: vi.fn(),
    delete: vi.fn(),
    reprocess: vi.fn(),
  },
  searchApi: {
    search: vi.fn().mockResolvedValue({ ok: true, data: { results: [] } }),
  },
}));

vi.mock("@/components/seo/SEO", () => ({
  default: () => null,
}));

function renderWithRoute() {
  return render(
    <MemoryRouter initialEntries={["/dashboard/collections/1"]}>
      <Routes>
        <Route path="/dashboard/collections/:id" element={<CollectionPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("CollectionPage", () => {
  it("renders collection name after loading", async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText("Test Collection")).toBeInTheDocument();
    });
  });

  it("renders tabs for documents and search", async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText("Test Collection")).toBeInTheDocument();
    });
    expect(screen.getByRole("tab", { name: "Documents" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Search" })).toBeInTheDocument();
  });

  it("renders upload section on documents tab", async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText("Upload Documents")).toBeInTheDocument();
    });
  });

  it("renders document list section", async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText("Documents (0)")).toBeInTheDocument();
    });
  });
});
