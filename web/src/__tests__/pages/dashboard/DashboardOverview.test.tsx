import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import DashboardOverview from "@/pages/dashboard/DashboardOverview";

describe("DashboardOverview", () => {
  const renderOverview = () =>
    render(
      <BrowserRouter>
        <DashboardOverview />
      </BrowserRouter>
    );

  it("renders without crashing", () => {
    const { container } = renderOverview();
    expect(container).toBeTruthy();
  });

  it("displays dashboard heading", () => {
    renderOverview();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("displays stat cards with mock data", () => {
    renderOverview();
    expect(screen.getByText("Active Conversations")).toBeInTheDocument();
    expect(screen.getByText("Total Spend")).toBeInTheDocument();
    expect(screen.getByText("Tool Calls")).toBeInTheDocument();
    expect(screen.getByText("Total Requests")).toBeInTheDocument();
  });
});
