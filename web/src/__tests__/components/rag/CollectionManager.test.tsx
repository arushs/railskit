import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CollectionManager } from "@/components/rag/CollectionManager";

describe("CollectionManager", () => {
  const defaultProps = {
    onSave: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
  };

  it("renders create form with all fields", () => {
    render(<CollectionManager {...defaultProps} />);
    expect(screen.getByText("New Collection")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Chunking Strategy")).toBeInTheDocument();
    expect(screen.getByLabelText("Chunk Size (tokens)")).toBeInTheDocument();
    expect(screen.getByLabelText("Overlap (tokens)")).toBeInTheDocument();
    expect(screen.getByLabelText("Embedding Model")).toBeInTheDocument();
  });

  it("renders edit form with pre-filled values", () => {
    render(
      <CollectionManager
        {...defaultProps}
        collection={{
          id: 1,
          name: "Test Collection",
          description: "Test desc",
          chunking_strategy: "markdown",
          chunk_size: 1024,
          chunk_overlap: 100,
          embedding_model: "text-embedding-3-large",
          documents_count: 5,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
        }}
      />
    );
    expect(screen.getByText("Edit Collection")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Collection")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test desc")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1024")).toBeInTheDocument();
  });

  it("calls onSave with form data on submit", async () => {
    render(<CollectionManager {...defaultProps} />);
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "My Docs" },
    });
    fireEvent.click(screen.getByText("Create Collection"));
    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith(
        expect.objectContaining({ name: "My Docs" })
      );
    });
  });

  it("calls onCancel when cancel clicked", () => {
    render(<CollectionManager {...defaultProps} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it("disables submit when name is empty", () => {
    render(<CollectionManager {...defaultProps} />);
    const submitButton = screen.getByText("Create Collection").closest("button")!;
    expect(submitButton).toBeDisabled();
  });
});
