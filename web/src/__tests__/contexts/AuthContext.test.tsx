import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, AuthContext } from "@/contexts/AuthContext";
import { useContext } from "react";

// Mock the API module
vi.mock("@/lib/api", () => ({
  authApi: {
    me: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    requestMagicLink: vi.fn(),
    verifyMagicLink: vi.fn(),
    updateProfile: vi.fn(),
  },
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { authApi } from "@/lib/api";

const mockUser = {
  id: 1,
  email: "test@example.com",
  name: "Test User",
  avatar_url: null,
  plan: "free",
  created_at: "2024-01-01T00:00:00Z",
};

function TestConsumer() {
  const auth = useContext(AuthContext);
  if (!auth) return <div>No context</div>;
  return (
    <div>
      <span data-testid="user">{auth.user?.email ?? "null"}</span>
      <span data-testid="loading">{auth.loading.toString()}</span>
      <button onClick={() => auth.signIn("test@example.com", "pass")}>Sign In</button>
      <button onClick={() => auth.signOut()}>Sign Out</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts in loading state and fetches current user", async () => {
    vi.mocked(authApi.me).mockResolvedValueOnce({
      ok: true,
      data: { user: mockUser },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });
    expect(screen.getByTestId("user")).toHaveTextContent("test@example.com");
  });

  it("sets user to null when me() fails", async () => {
    vi.mocked(authApi.me).mockResolvedValueOnce({ ok: false, data: {} as never });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });
    expect(screen.getByTestId("user")).toHaveTextContent("null");
  });

  it("signIn updates user state", async () => {
    vi.mocked(authApi.me).mockResolvedValueOnce({ ok: false, data: {} as never });
    vi.mocked(authApi.signIn).mockResolvedValueOnce({
      ok: true,
      data: { user: mockUser, token: "jwt123" },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    const user = userEvent.setup();
    await user.click(screen.getByText("Sign In"));

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("test@example.com");
    });
  });

  it("signOut clears user state", async () => {
    vi.mocked(authApi.me).mockResolvedValueOnce({
      ok: true,
      data: { user: mockUser },
    });
    vi.mocked(authApi.signOut).mockResolvedValueOnce({
      ok: true,
      data: { message: "Signed out" },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("test@example.com");
    });

    const user = userEvent.setup();
    await user.click(screen.getByText("Sign Out"));

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("null");
    });
  });
});
