import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DocumentUploader } from "@/components/rag/DocumentUploader";
import type { UploadProgress } from "@/types/rag";

describe("DocumentUploader", () => {
  const defaultProps = {
    onUpload: vi.fn().mockResolvedValue(undefined),
    uploads: [] as UploadProgress[],
    isUploading: false,
    onClear: vi.fn(),
  };

  it("renders drop zone with instructions", () => {
    render(<DocumentUploader {...defaultProps} />);
    expect(
      screen.getByText(/drag & drop files, or click to browse/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/PDF, TXT, MD, DOCX, HTML/i)).toBeInTheDocument();
  });

  it("has a hidden file input", () => {
    render(<DocumentUploader {...defaultProps} />);
    const input = screen.getByLabelText("Upload documents");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "file");
  });

  it("renders upload progress items", () => {
    const uploads: UploadProgress[] = [
      {
        file: new File([""], "test.pdf", { type: "application/pdf" }),
        progress: 50,
        status: "uploading",
      },
      {
        file: new File([""], "doc.txt", { type: "text/plain" }),
        progress: 100,
        status: "complete",
      },
    ];
    render(<DocumentUploader {...defaultProps} uploads={uploads} />);
    expect(screen.getByText("test.pdf")).toBeInTheDocument();
    expect(screen.getByText("doc.txt")).toBeInTheDocument();
    expect(screen.getByText("Uploads (1/2)")).toBeInTheDocument();
  });

  it("shows error state for failed uploads", () => {
    const uploads: UploadProgress[] = [
      {
        file: new File([""], "bad.pdf", { type: "application/pdf" }),
        progress: 0,
        status: "error",
        error: "Upload failed",
      },
    ];
    render(<DocumentUploader {...defaultProps} uploads={uploads} />);
    expect(screen.getByText("Upload failed")).toBeInTheDocument();
  });

  it("calls onClear when clear button is clicked", () => {
    const uploads: UploadProgress[] = [
      {
        file: new File([""], "done.pdf", { type: "application/pdf" }),
        progress: 100,
        status: "complete",
      },
    ];
    render(<DocumentUploader {...defaultProps} uploads={uploads} />);
    fireEvent.click(screen.getByText("Clear"));
    expect(defaultProps.onClear).toHaveBeenCalled();
  });

  it("shows drag-active state text on drag enter", () => {
    render(<DocumentUploader {...defaultProps} />);
    const dropZone = screen.getByRole("button");
    fireEvent.dragEnter(dropZone, { dataTransfer: { files: [] } });
    expect(screen.getByText("Drop files here")).toBeInTheDocument();
  });
});
