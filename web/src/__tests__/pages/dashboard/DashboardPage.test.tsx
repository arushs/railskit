import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import DashboardPage from "@/pages/DashboardPage";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      email: "test@example.com",
      name: "Test User",
      avatar_url: null,
      plan: "pro",
      created_at: "2024-01-01T00:00:00Z",
    },
    loading: false,
  }),
}));

describe("DashboardPage", () => {
  const renderDashboard = () =>
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

  it("renders without crashing", () => {
    const { container } = renderDashboard();
    expect(container).toBeTruthy();
  });

  it("displays welcome message with user name", () => {
    renderDashboard();
    expect(screen.getByText(/welcome back.*test user/i)).toBeInTheDocument();
  });

  it("displays stat cards", () => {
    renderDashboard();
    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    expect(screen.getByText("Active Users")).toBeInTheDocument();
    expect(screen.getByText("API Requests")).toBeInTheDocument();
    expect(screen.getByText("Uptime")).toBeInTheDocument();
  });
});
