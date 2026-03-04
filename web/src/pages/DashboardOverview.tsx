import { useNavigate } from "react-router";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  conversations,
  getDailyCosts,
  getCostByModel,
  getTotalCost,
  getTotalTokens,
  getTotalConversations,
  getActiveConversations,
} from "../data/mock";
import { formatCurrency, formatNumber, timeAgo } from "../lib/utils";
import { MessageSquare, DollarSign, Zap, Activity } from "lucide-react";
import { StatCard } from "../components/dashboard/StatCard";

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899"];

export default function DashboardOverview() {
  const navigate = useNavigate();
  const dailyCosts = getDailyCosts();
  const costByModel = getCostByModel();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-zinc-500">Monitor your agent activity and costs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Conversations"
          value={getTotalConversations().toString()}
          subtitle={`${getActiveConversations()} active`}
          icon={MessageSquare}
        />
        <StatCard
          title="Total Cost (7d)"
          value={formatCurrency(getTotalCost())}
          trend={{ value: -12, label: "vs prior week" }}
          icon={DollarSign}
        />
        <StatCard
          title="Total Tokens"
          value={formatNumber(getTotalTokens())}
          icon={Zap}
        />
        <StatCard
          title="Active Agents"
          value="2"
          subtitle="Parker 🎨, Jarvis ⚙️"
          icon={Activity}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Cost trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cost Trend (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyCosts}>
                  <defs>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#52525b" fontSize={12} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis stroke="#52525b" fontSize={12} tickFormatter={(v: number) => `$${v.toFixed(1)}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    formatter={(value: number | undefined) => [`$${(value ?? 0).toFixed(3)}`, "Cost"]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area type="monotone" dataKey="cost" stroke="#6366f1" fill="url(#costGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cost by model pie */}
        <Card>
          <CardHeader>
            <CardTitle>Cost by Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costByModel}
                    dataKey="cost"
                    nameKey="model"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {costByModel.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    formatter={(value: number | undefined) => [`$${(value ?? 0).toFixed(3)}`, "Cost"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1.5">
              {costByModel.map((m, i) => (
                <div key={m.model} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-zinc-400 font-mono">{m.model}</span>
                  </div>
                  <span className="text-zinc-500 font-mono">{formatCurrency(m.cost)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent conversations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Conversations</CardTitle>
            <button
              onClick={() => navigate("/dashboard/conversations")}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View all →
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {conversations.slice(0, 5).map((conv) => (
              <button
                key={conv.id}
                onClick={() => navigate(`/dashboard/conversations/${conv.id}`)}
                className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Badge
                    variant={
                      conv.status === "active"
                        ? "active"
                        : conv.status === "error"
                          ? "error"
                          : "completed"
                    }
                  >
                    {conv.status}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{conv.title}</p>
                    <p className="text-xs text-zinc-500">
                      {conv.agent} · {conv.model}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-xs text-zinc-500">
                  <span className="font-mono">{formatCurrency(conv.totalCost)}</span>
                  <span>{timeAgo(conv.lastMessageAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
