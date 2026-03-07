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
  admin?: boolean;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ── Chats API ──

export interface Chat {
  id: number;
  title: string | null;
  agent_class: string;
  model_id?: string | null;
  metadata?: Record<string, unknown>;
  messages?: Message[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  id?: number;
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: unknown[] | null;
  tool_call_id?: string | null;
  name?: string | null;
  finish_reason?: string | null;
  token_count?: number | null;
  cost_cents?: number | null;
  created_at?: string;
}

export const chatsApi = {
  list: (limit = 50, offset = 0) =>
    api.get<{ chats: Chat[] }>(`/api/chats?limit=${limit}&offset=${offset}`),

  get: (id: number) =>
    api.get<{ chat: Chat }>(`/api/chats/${id}`),

  create: (data: { title?: string; agent_class?: string }) =>
    api.post<{ chat: Chat }>("/api/chats", { chat: data }),

  update: (id: number, data: { title?: string; model_id?: string }) =>
    api.patch<{ chat: Chat }>(`/api/chats/${id}`, { chat: data }),

  delete: (id: number) =>
    api.delete<void>(`/api/chats/${id}`),

  messages: (id: number, limit = 100, offset = 0) =>
    api.get<{ messages: Message[] }>(`/api/chats/${id}/messages?limit=${limit}&offset=${offset}`),
};

// ── Auth API ──

export const authApi = {
  signUp: (email: string, password: string, name?: string) =>
    api.post<AuthResponse>("/api/auth/signup", {
      user: { email, password, password_confirmation: password, name },
    }),

  signIn: (email: string, password: string) =>
    api.post<AuthResponse>("/api/auth/login", {
      user: { email, password },
    }),

  signOut: () => api.delete<{ message: string }>("/api/auth/logout"),

  me: () => api.get<{ user: User }>("/api/auth/me"),

  updateProfile: (data: { name?: string; avatar_url?: string }) =>
    api.patch<{ user: User }>("/api/auth/me", { user: data }),

  requestMagicLink: (email: string) =>
    api.post<{ message: string }>("/api/auth/magic_link", { email }),

  verifyMagicLink: (token: string) =>
    api.post<AuthResponse>("/api/auth/magic_link/verify", { token }),

  googleOAuthUrl: () => `${API_BASE}/api/auth/users/auth/google_oauth2`,
};
