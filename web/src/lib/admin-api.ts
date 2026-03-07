import { api } from "./api";

export interface AdminStats {
  users: {
    total: number;
    this_month: number;
    by_plan: Record<string, number>;
    admins: number;
  };
  teams: { total: number; this_month: number };
  chats: { total: number; this_month: number };
}

export interface AdminUser {
  id: number;
  email: string;
  name: string | null;
  avatar_url: string | null;
  plan: string;
  admin: boolean;
  sign_in_count: number;
  last_sign_in_at: string | null;
  created_at: string;
}

export interface AdminTeam {
  id: number;
  name: string;
  slug: string;
  personal: boolean;
  owner: { id: number; name: string | null; email: string };
  member_count: number;
  created_at: string;
}

export interface QueueSummary {
  total: number;
  ready: number;
  scheduled: number;
  failed: number;
}

export interface QueueJob {
  id: number;
  class_name: string;
  queue_name: string;
  created_at: string;
  finished_at: string | null;
}

export const adminApi = {
  stats: () => api.get<AdminStats>("/api/admin/stats"),

  users: (page = 1, per = 25, q?: string) =>
    api.get<{ users: AdminUser[]; total: number; page: number; per: number; pages: number }>(
      `/api/admin/users?page=${page}&per=${per}${q ? `&q=${encodeURIComponent(q)}` : ""}`
    ),

  updateUser: (id: number, data: { plan?: string; admin?: boolean }) =>
    api.patch<AdminUser>(`/api/admin/users/${id}`, data),

  deleteUser: (id: number) =>
    api.delete<void>(`/api/admin/users/${id}`),

  teams: (page = 1, per = 25, q?: string) =>
    api.get<{ teams: AdminTeam[]; total: number; page: number; per: number; pages: number }>(
      `/api/admin/teams?page=${page}&per=${per}${q ? `&q=${encodeURIComponent(q)}` : ""}`
    ),

  queues: () =>
    api.get<{ summary: QueueSummary; recent_jobs: QueueJob[] }>("/api/admin/queues"),
};
