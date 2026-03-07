import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import TeamsPage from "../../pages/TeamsPage";

// Mock auth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: 1, email: "test@test.com", name: "Test User" },
    loading: false,
  }),
}));

// Mock API
vi.mock("@/lib/teams-api", () => ({
  teamsApi: {
    list: vi.fn().mockResolvedValue({
      ok: true,
      data: [
        {
          id: 1,
          name: "Engineering",
          slug: "engineering",
          personal: false,
          owner_id: 1,
          member_count: 3,
          role: "owner",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
        {
          id: 2,
          name: "Design",
          slug: "design",
          personal: false,
          owner_id: 2,
          member_count: 5,
          role: "member",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ],
    }),
    create: vi.fn(),
  },
}));

describe("TeamsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders team list", async () => {
    render(
      <MemoryRouter>
        <TeamsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Engineering")).toBeInTheDocument();
      expect(screen.getByText("Design")).toBeInTheDocument();
    });
  });

  it("shows member counts", async () => {
    render(
      <MemoryRouter>
        <TeamsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("3 members")).toBeInTheDocument();
      expect(screen.getByText("5 members")).toBeInTheDocument();
    });
  });

  it("shows role badges", async () => {
    render(
      <MemoryRouter>
        <TeamsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Owner")).toBeInTheDocument();
      expect(screen.getByText("Member")).toBeInTheDocument();
    });
  });

  it("has New Team button", async () => {
    render(
      <MemoryRouter>
        <TeamsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /new team/i })).toBeInTheDocument();
    });
  });
});
