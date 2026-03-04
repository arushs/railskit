import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import Hero from "@/components/landing/Hero";

describe("Hero", () => {
  const renderHero = () =>
    render(
      <BrowserRouter>
        <Hero />
      </BrowserRouter>
    );

  it("renders without crashing", () => {
    const { container } = renderHero();
    expect(container.querySelector("section")).toBeTruthy();
  });

  it("displays the headline", () => {
    renderHero();
    expect(screen.getByText(/stop scaffolding/i)).toBeInTheDocument();
    expect(screen.getByText(/start shipping/i)).toBeInTheDocument();
  });

  it("displays CTA buttons", () => {
    renderHero();
    expect(screen.getByText(/get started/i)).toBeInTheDocument();
    expect(screen.getByText(/star on github/i)).toBeInTheDocument();
  });

  it("renders the terminal demo widget", () => {
    renderHero();
    expect(screen.getByText("railskit")).toBeInTheDocument();
  });
});
