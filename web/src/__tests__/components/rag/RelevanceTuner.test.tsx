import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RelevanceTuner } from "@/components/rag/RelevanceTuner";

describe("RelevanceTuner", () => {
  const defaultProps = {
    topK: 5,
    threshold: 0.7,
    onTopKChange: vi.fn(),
    onThresholdChange: vi.fn(),
  };

  it("renders sliders with current values", () => {
    render(<RelevanceTuner {...defaultProps} />);
    expect(screen.getByText("Retrieval Parameters")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument(); // topK value
    expect(screen.getByText("70%")).toBeInTheDocument(); // threshold value
  });

  it("renders top-k slider", () => {
    render(<RelevanceTuner {...defaultProps} />);
    expect(screen.getByLabelText("Top-K Results")).toBeInTheDocument();
  });

  it("renders threshold slider", () => {
    render(<RelevanceTuner {...defaultProps} />);
    expect(screen.getByLabelText("Relevance Threshold")).toBeInTheDocument();
  });

  it("calls onTopKChange when slider changes", () => {
    render(<RelevanceTuner {...defaultProps} />);
    fireEvent.change(screen.getByLabelText("Top-K Results"), {
      target: { value: "10" },
    });
    expect(defaultProps.onTopKChange).toHaveBeenCalledWith(10);
  });

  it("calls onThresholdChange when slider changes", () => {
    render(<RelevanceTuner {...defaultProps} />);
    fireEvent.change(screen.getByLabelText("Relevance Threshold"), {
      target: { value: "80" },
    });
    expect(defaultProps.onThresholdChange).toHaveBeenCalledWith(0.8);
  });
});
