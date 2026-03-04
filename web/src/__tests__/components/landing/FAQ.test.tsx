import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FAQ from "@/components/landing/FAQ";

describe("FAQ", () => {
  it("renders without crashing", () => {
    const { container } = render(<FAQ />);
    expect(container.querySelector("section")).toBeTruthy();
  });

  it("displays FAQ questions", () => {
    render(<FAQ />);
    expect(screen.getByText(/is this really free/i)).toBeInTheDocument();
  });

  it("renders accordion items", () => {
    render(<FAQ />);
    // Should have multiple FAQ items as triggers
    const triggers = screen.getAllByRole("button");
    expect(triggers.length).toBeGreaterThan(0);
  });
});
