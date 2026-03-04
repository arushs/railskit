import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import Pricing from "@/components/landing/Pricing";

// Mock the auth context since Pricing may use it for checkout
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
  }),
}));

describe("Pricing", () => {
  const renderPricing = () =>
    render(
      <BrowserRouter>
        <Pricing />
      </BrowserRouter>
    );

  it("renders without crashing", () => {
    const { container } = renderPricing();
    expect(container.querySelector("section")).toBeTruthy();
  });

  it("displays pricing tiers", () => {
    renderPricing();
    expect(screen.getByText("Starter")).toBeInTheDocument();
  });

  it("shows feature lists", () => {
    renderPricing();
    // Each tier should have at least one check mark or feature
    const checks = screen.getAllByRole("listitem");
    expect(checks.length).toBeGreaterThan(0);
  });
});
