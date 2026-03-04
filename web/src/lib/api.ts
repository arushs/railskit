const API_BASE = import.meta.env.VITE_API_URL || "";

interface ApiResponse<T> {
  data: T;
  ok: boolean;
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    credentials: "include", // Send httpOnly cookies
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  const data = await response.json();
  return { data, ok: response.ok };
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export async function healthCheck() {
  return api.get<{ status: string; timestamp: string; version: string }>(
    "/api/health"
  );
}

// ── Auth API ──

export interface User {
  id: number;
  email: string;
  name: string | null;
  avatar_url: string | null;
  plan: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  signUp: (email: string, password: string, name?: string) =>
    api.post<AuthResponse>("/api/auth/sign_up", {
      user: { email, password, password_confirmation: password, name },
    }),

  signIn: (email: string, password: string) =>
    api.post<AuthResponse>("/api/auth/sign_in", {
      user: { email, password },
    }),

  signOut: () => api.delete<{ message: string }>("/api/auth/sign_out"),

  me: () => api.get<{ user: User }>("/api/auth/me"),

  updateProfile: (data: { name?: string; avatar_url?: string }) =>
    api.patch<{ user: User }>("/api/auth/me", { user: data }),

  requestMagicLink: (email: string) =>
    api.post<{ message: string }>("/api/auth/magic_link", { email }),

  verifyMagicLink: (token: string) =>
    api.post<AuthResponse>("/api/auth/magic_link/verify", { token }),

  googleOAuthUrl: () => `${API_BASE}/api/auth/google_oauth2`,
};
