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
  status: "ready" | "scheduled" | "failed" | "completed" | "pending";
  error: string | null;
  created_at: string;
  finished_at: string | null;
}

export interface PgHeroStats {
  database_size: string;
  cache_hit_rate: number;
  connections: Array<{ pid: number; state: string; query: string }>;
  running_queries: Array<{
    pid: number;
    duration_ms: number;
    query: string;
    state: string;
    source: string | null;
  }>;
  long_running_queries: Array<{
    pid: number;
    duration_ms: number;
    query: string;
  }>;
  index_usage: Array<{
    table: string;
    index_usage: number;
    rows: number;
  }>;
  unused_indexes: Array<{
    table: string;
    index: string;
    index_size: string;
  }>;
  missing_indexes: Array<{
    table: string;
    columns: string[];
    estimated_rows: number;
  }>;
  duplicate_indexes: Array<{
    table: string;
    indexes: string[];
  }>;
  table_stats: Array<{
    table: string;
    estimated_rows: number;
    size: string;
  }>;
}

export const adminApi = {
  stats: () => api.get<AdminStats>("/api/admin/stats"),

  // Users
  users: (page = 1, per = 25, q?: string) =>
    api.get<{ users: AdminUser[]; total: number; page: number; per: number; pages: number }>(
      `/api/admin/users?page=${page}&per=${per}${q ? `&q=${encodeURIComponent(q)}` : ""}`
    ),

  updateUser: (id: number, data: { plan?: string; admin?: boolean }) =>
    api.patch<AdminUser>(`/api/admin/users/${id}`, data),

  deleteUser: (id: number) =>
    api.delete<void>(`/api/admin/users/${id}`),

  // Teams
  teams: (page = 1, per = 25, q?: string) =>
    api.get<{ teams: AdminTeam[]; total: number; page: number; per: number; pages: number }>(
      `/api/admin/teams?page=${page}&per=${per}${q ? `&q=${encodeURIComponent(q)}` : ""}`
    ),

  deleteTeam: (id: number) =>
    api.delete<void>(`/api/admin/teams/${id}`),

  // Queues
  queues: () =>
    api.get<{ summary: QueueSummary; recent_jobs: QueueJob[] }>("/api/admin/queues"),

  retryJob: (id: number) =>
    api.post<void>(`/api/admin/queues/${id}/retry`),

  discardJob: (id: number) =>
    api.post<void>(`/api/admin/queues/${id}/discard`),

  bulkRetry: (jobIds: number[]) =>
    api.post<{ retried: number }>("/api/admin/queues/bulk_retry", { job_ids: jobIds }),

  bulkDiscard: (jobIds: number[]) =>
    api.post<{ discarded: number }>("/api/admin/queues/bulk_discard", { job_ids: jobIds }),

  // PgHero
  pghero: () => api.get<PgHeroStats>("/api/admin/pghero"),
};
