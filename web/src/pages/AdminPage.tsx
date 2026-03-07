import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { adminApi } from "@/lib/admin-api";
import type {
  AdminStats,
  AdminUser,
  AdminTeam,
  QueueSummary,
  QueueJob,
  PgHeroStats,
} from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Shield,
  Activity,
  Database,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Loader2,
  Crown,
  RotateCcw,
  X,
  CheckSquare,
  BarChart3,
  HardDrive,
} from "lucide-react";

// ─── Stats Cards ───
function StatsOverview({ stats }: { stats: AdminStats }) {
  const tiles = [
    { label: "Total Users", value: stats.users.total, sub: `+${stats.users.this_month} this month`, icon: Users },
    { label: "Admins", value: stats.users.admins, sub: `of ${stats.users.total} users`, icon: Shield },
    { label: "Teams", value: stats.teams.total, sub: `+${stats.teams.this_month} this month`, icon: Users },
    { label: "Chats", value: stats.chats.total, sub: `+${stats.chats.this_month} this month`, icon: Activity },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map(({ label, value, sub, icon: Icon }) => (
        <Card key={label} className="dark:bg-zinc-900/50 bg-white">
          <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</CardTitle>
            <Icon className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">{value.toLocaleString()}</div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Plan breakdown ───
function PlanBreakdown({ byPlan }: { byPlan: Record<string, number> }) {
  const total = Object.values(byPlan).reduce((s, n) => s + n, 0) || 1;
  const plans = Object.entries(byPlan).sort(([, a], [, b]) => b - a);

  return (
    <Card className="dark:bg-zinc-900/50 bg-white">
      <CardHeader className="p-6 pb-3">
        <CardTitle className="text-sm font-medium text-zinc-900 dark:text-white">Plans</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-3">
          {plans.map(([plan, count]) => (
            <div key={plan} className="flex items-center gap-3">
              <span className="w-20 text-sm capitalize text-zinc-700 dark:text-zinc-300">{plan}</span>
              <div className="flex-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-theme-primary transition-all"
                  style={{ width: `${(count / total) * 100}%` }}
                />
              </div>
              <span className="w-10 text-right text-sm tabular-nums text-zinc-500">{count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Users Table ───
function UsersTable() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  function fetchUsers(p: number, q: string) {
    setLoading(true);
    adminApi.users(p, 15, q || undefined).then((res) => {
      if (res.ok) {
        setUsers(res.data.users);
        setTotal(res.data.total);
        setPages(res.data.pages);
      }
    }).finally(() => setLoading(false));
  }

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(page, search), 300);
    return () => clearTimeout(t);
  }, [page, search]);

  async function toggleAdmin(user: AdminUser) {
    const res = await adminApi.updateUser(user.id, { admin: !user.admin });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, admin: !u.admin } : u)));
    }
  }

  async function changePlan(user: AdminUser, plan: string) {
    const res = await adminApi.updateUser(user.id, { plan });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, plan } : u)));
    }
  }

  async function deleteUser(user: AdminUser) {
    if (!confirm(`Delete user ${user.email}? This cannot be undone.`)) return;
    const res = await adminApi.deleteUser(user.id);
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setTotal((t) => t - 1);
    }
  }

  return (
    <Card className="dark:bg-zinc-900/50 bg-white">
      <CardHeader className="p-6 flex flex-row items-center justify-between">
        <CardTitle className="text-zinc-900 dark:text-white">Users ({total})</CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-t border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <th className="text-left text-xs font-medium text-zinc-500 uppercase px-6 py-2.5">User</th>
                    <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-2.5">Plan</th>
                    <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-2.5">Role</th>
                    <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-2.5">Sign-ins</th>
                    <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-2.5">Joined</th>
                    <th className="text-right text-xs font-medium text-zinc-500 uppercase px-6 py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar src={u.avatar_url} fallback={u.name || u.email} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-zinc-900 dark:text-white">{u.name || "—"}</p>
                            <p className="text-xs text-zinc-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.plan}
                          onChange={(e) => changePlan(u, e.target.value)}
                          className="h-7 px-2 text-xs border border-zinc-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                        >
                          {["free", "starter", "pro", "enterprise"].map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleAdmin(u)}
                          title={u.admin ? "Remove admin" : "Make admin"}
                        >
                          <Badge variant={u.admin ? "default" : "outline"}>
                            {u.admin ? <><Crown className="w-3 h-3 mr-1" />Admin</> : "User"}
                          </Badge>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 tabular-nums">
                        {u.sign_in_count}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => deleteUser(u)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-sm text-zinc-500">
                  Page {page} of {pages}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(pages, page + 1))}
                    disabled={page === pages}
                    className="p-1.5 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Teams Table ───
function TeamsTable() {
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  function fetchTeams(p: number, q: string) {
    setLoading(true);
    adminApi.teams(p, 15, q || undefined).then((res) => {
      if (res.ok) {
        setTeams(res.data.teams);
        setTotal(res.data.total);
        setPages(res.data.pages);
      }
    }).finally(() => setLoading(false));
  }

  useEffect(() => {
    const t = setTimeout(() => fetchTeams(page, search), 300);
    return () => clearTimeout(t);
  }, [page, search]);

  async function deleteTeam(team: AdminTeam) {
    if (!confirm(`Delete team "${team.name}"? This cannot be undone.`)) return;
    const res = await adminApi.deleteTeam(team.id);
    if (res.ok) {
      setTeams((prev) => prev.filter((t) => t.id !== team.id));
      setTotal((t) => t - 1);
    }
  }

  return (
    <Card className="dark:bg-zinc-900/50 bg-white">
      <CardHeader className="p-6 flex flex-row items-center justify-between">
        <CardTitle className="text-zinc-900 dark:text-white">Teams ({total})</CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search teams..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-t border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <th className="text-left text-xs font-medium text-zinc-500 uppercase px-6 py-2.5">Team</th>
                    <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-2.5">Owner</th>
                    <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-2.5">Members</th>
                    <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-2.5">Type</th>
                    <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-2.5">Created</th>
                    <th className="text-right text-xs font-medium text-zinc-500 uppercase px-6 py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t) => (
                    <tr key={t.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <td className="px-6 py-3">
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">{t.name}</p>
                          <p className="text-xs text-zinc-400 font-mono">{t.slug}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300">{t.owner.name || "—"}</p>
                          <p className="text-xs text-zinc-400">{t.owner.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 tabular-nums">
                        {t.member_count}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={t.personal ? "outline" : "default"}>
                          {t.personal ? "Personal" : "Team"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => deleteTeam(t)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                          title="Delete team"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-sm text-zinc-500">
                  Page {page} of {pages}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(pages, page + 1))}
                    disabled={page === pages}
                    className="p-1.5 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Queue Dashboard ───
function QueueDashboard() {
  const [summary, setSummary] = useState<QueueSummary | null>(null);
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  function fetchQueues() {
    setLoading(true);
    adminApi.queues().then((res) => {
      if (res.ok) {
        setSummary(res.data.summary);
        setJobs(res.data.recent_jobs);
      }
    }).finally(() => setLoading(false));
  }

  useEffect(() => { fetchQueues(); }, []);

  async function retryJob(id: number) {
    setActionLoading(id);
    const res = await adminApi.retryJob(id);
    if (res.ok) fetchQueues();
    setActionLoading(null);
  }

  async function discardJob(id: number) {
    if (!confirm("Discard this failed job? This cannot be undone.")) return;
    setActionLoading(id);
    const res = await adminApi.discardJob(id);
    if (res.ok) fetchQueues();
    setActionLoading(null);
  }

  async function bulkRetry() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setActionLoading(-1);
    const res = await adminApi.bulkRetry(ids);
    if (res.ok) { setSelected(new Set()); fetchQueues(); }
    setActionLoading(null);
  }

  async function bulkDiscard() {
    const ids = Array.from(selected);
    if (ids.length === 0 || !confirm(`Discard ${ids.length} failed job(s)?`)) return;
    setActionLoading(-2);
    const res = await adminApi.bulkDiscard(ids);
    if (res.ok) { setSelected(new Set()); fetchQueues(); }
    setActionLoading(null);
  }

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const failedIds = jobs.filter((j) => j.status === "failed").map((j) => j.id);
    if (failedIds.every((id) => selected.has(id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(failedIds));
    }
  }

  const failedJobs = jobs.filter((j) => j.status === "failed");

  if (loading) {
    return (
      <Card className="dark:bg-zinc-900/50 bg-white">
        <CardContent className="p-12 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
        </CardContent>
      </Card>
    );
  }

  const statusBadge = (status: QueueJob["status"]) => {
    const variants: Record<string, "success" | "warning" | "destructive" | "outline" | "default"> = {
      completed: "success",
      ready: "default",
      scheduled: "warning",
      failed: "destructive",
      pending: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <Card className="dark:bg-zinc-900/50 bg-white">
      <CardHeader className="p-6">
        <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-white">
          <Database className="w-5 h-5" />
          SolidQueue
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-6">
        {summary && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total", value: summary.total, color: "text-zinc-900 dark:text-white" },
              { label: "Ready", value: summary.ready, color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Scheduled", value: summary.scheduled, color: "text-amber-600 dark:text-amber-400" },
              { label: "Failed", value: summary.failed, color: summary.failed > 0 ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-white" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
                <div className="text-xs text-zinc-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Bulk actions for selected failed jobs */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              {selected.size} job(s) selected
            </span>
            <button
              onClick={bulkRetry}
              disabled={actionLoading === -1}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {actionLoading === -1 ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
              Retry All
            </button>
            <button
              onClick={bulkDiscard}
              disabled={actionLoading === -2}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
            >
              {actionLoading === -2 ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
              Discard All
            </button>
          </div>
        )}

        {jobs.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Recent Jobs</h4>
                {failedJobs.length > 0 && (
                  <button
                    onClick={toggleSelectAll}
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    {failedJobs.every((j) => selected.has(j.id)) ? "Deselect all failed" : "Select all failed"}
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg border transition-colors ${
                      selected.has(job.id)
                        ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                        : "bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {job.status === "failed" && (
                        <input
                          type="checkbox"
                          checked={selected.has(job.id)}
                          onChange={() => toggleSelect(job.id)}
                          className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-mono text-zinc-900 dark:text-white truncate">{job.class_name}</p>
                        <p className="text-xs text-zinc-400">
                          {job.queue_name} · {new Date(job.created_at).toLocaleString()}
                        </p>
                        {job.error && (
                          <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 truncate max-w-md" title={job.error}>
                            {job.error}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      {statusBadge(job.status)}
                      {job.status === "failed" && (
                        <>
                          <button
                            onClick={() => retryJob(job.id)}
                            disabled={actionLoading === job.id}
                            className="p-1.5 text-amber-500 hover:text-amber-600 transition-colors disabled:opacity-50"
                            title="Retry job"
                          >
                            {actionLoading === job.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => discardJob(job.id)}
                            disabled={actionLoading === job.id}
                            className="p-1.5 text-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
                            title="Discard job"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── PgHero Dashboard ───
function PgHeroDashboard() {
  const [data, setData] = useState<PgHeroStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.pghero().then((res) => {
      if (res.ok) {
        setData(res.data);
      } else {
        setError("Failed to load PgHero stats. Is the pghero gem installed?");
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="dark:bg-zinc-900/50 bg-white">
        <CardContent className="p-12 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="dark:bg-zinc-900/50 bg-white">
        <CardContent className="p-12 text-center">
          <HardDrive className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
          <p className="text-sm text-zinc-500">{error || "No data available"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="dark:bg-zinc-900/50 bg-white">
          <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Database Size</CardTitle>
            <HardDrive className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-2xl font-bold text-zinc-900 dark:text-white">{data.database_size}</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-zinc-900/50 bg-white">
          <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Cache Hit Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className={`text-2xl font-bold tabular-nums ${
              data.cache_hit_rate >= 99 ? "text-emerald-600 dark:text-emerald-400"
              : data.cache_hit_rate >= 95 ? "text-amber-600 dark:text-amber-400"
              : "text-red-600 dark:text-red-400"
            }`}>
              {data.cache_hit_rate?.toFixed(1)}%
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Target: ≥99%</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-zinc-900/50 bg-white">
          <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Active Queries</CardTitle>
            <Activity className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
              {data.running_queries.length}
            </div>
            {data.long_running_queries.length > 0 && (
              <p className="mt-1 text-xs text-red-500">{data.long_running_queries.length} long-running</p>
            )}
          </CardContent>
        </Card>
        <Card className="dark:bg-zinc-900/50 bg-white">
          <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Missing Indexes</CardTitle>
            <Database className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className={`text-2xl font-bold tabular-nums ${
              data.missing_indexes.length === 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            }`}>
              {data.missing_indexes.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Stats */}
      <Card className="dark:bg-zinc-900/50 bg-white">
        <CardHeader className="p-6 pb-3">
          <CardTitle className="text-sm font-medium text-zinc-900 dark:text-white">Tables</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <th className="text-left text-xs font-medium text-zinc-500 uppercase px-6 py-2.5">Table</th>
                  <th className="text-right text-xs font-medium text-zinc-500 uppercase px-4 py-2.5">Rows (est.)</th>
                  <th className="text-right text-xs font-medium text-zinc-500 uppercase px-6 py-2.5">Size</th>
                </tr>
              </thead>
              <tbody>
                {data.table_stats.map((t) => (
                  <tr key={t.table} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="px-6 py-2.5 text-sm font-mono text-zinc-900 dark:text-white">{t.table}</td>
                    <td className="px-4 py-2.5 text-sm text-right text-zinc-600 dark:text-zinc-400 tabular-nums">
                      {t.estimated_rows.toLocaleString()}
                    </td>
                    <td className="px-6 py-2.5 text-sm text-right text-zinc-500 dark:text-zinc-400">{t.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Index Usage */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="dark:bg-zinc-900/50 bg-white">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="text-sm font-medium text-zinc-900 dark:text-white">Index Usage</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
              {data.index_usage.map((idx) => (
                <div key={idx.table} className="flex items-center gap-3">
                  <span className="w-36 text-sm font-mono text-zinc-700 dark:text-zinc-300 truncate" title={idx.table}>
                    {idx.table}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        idx.index_usage >= 95 ? "bg-emerald-500" : idx.index_usage >= 80 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${idx.index_usage}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm tabular-nums text-zinc-500">
                    {idx.index_usage?.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Unused Indexes */}
        <Card className="dark:bg-zinc-900/50 bg-white">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="text-sm font-medium text-zinc-900 dark:text-white">
              Unused Indexes ({data.unused_indexes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {data.unused_indexes.length === 0 ? (
              <p className="text-sm text-zinc-500">No unused indexes — great!</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {data.unused_indexes.map((idx) => (
                  <div key={idx.index} className="py-2 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                    <p className="text-sm font-mono text-zinc-900 dark:text-white truncate">{idx.index}</p>
                    <p className="text-xs text-zinc-400">
                      {idx.table} · {idx.index_size}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Missing Indexes */}
      {data.missing_indexes.length > 0 && (
        <Card className="dark:bg-zinc-900/50 bg-white border-amber-200 dark:border-amber-800">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">
              ⚠ Missing Indexes ({data.missing_indexes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-2">
              {data.missing_indexes.map((idx, i) => (
                <div key={i} className="py-2 px-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900">
                  <p className="text-sm font-mono text-zinc-900 dark:text-white">{idx.table}</p>
                  <p className="text-xs text-zinc-500">
                    Columns: {idx.columns?.join(", ")} · ~{idx.estimated_rows?.toLocaleString()} rows
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Page ───
export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "users" | "teams" | "queues" | "pghero">("overview");

  useEffect(() => {
    adminApi.stats().then((res) => {
      if (res.ok) setStats(res.data);
    }).finally(() => setLoading(false));
  }, []);

  if (!user?.admin) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
          <p className="text-zinc-700 dark:text-zinc-300 font-medium">Admin Access Required</p>
          <p className="text-sm text-zinc-500 mt-1">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "users" as const, label: "Users" },
    { key: "teams" as const, label: "Teams" },
    { key: "queues" as const, label: "Queues" },
    { key: "pghero" as const, label: "PgHero" },
  ];

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Admin Dashboard</h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Manage users, teams, and system health.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? "border-theme-primary text-theme-primary"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && stats && (
        <div className="space-y-6">
          <StatsOverview stats={stats} />
          <div className="grid gap-6 lg:grid-cols-2">
            <PlanBreakdown byPlan={stats.users.by_plan} />
            <QueueDashboard />
          </div>
        </div>
      )}

      {tab === "users" && <UsersTable />}
      {tab === "teams" && <TeamsTable />}
      {tab === "queues" && <QueueDashboard />}
      {tab === "pghero" && <PgHeroDashboard />}
    </div>
  );
}
