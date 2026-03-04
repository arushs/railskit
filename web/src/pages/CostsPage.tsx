import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { costHistory, getDailyCosts, getCostByModel, getCostByProvider } from "../data/mock";
import { formatCurrency, formatNumber } from "../lib/utils";
import { DollarSign, TrendingUp, Zap, BarChart3 } from "lucide-react";
import { StatCard } from "../components/dashboard/StatCard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const MODEL_COLORS: Record<string, string> = {
  "claude-opus-4": "#6366f1",
  "claude-sonnet-4": "#8b5cf6",
  "gpt-4o": "#10b981",
  "gemini-2.5-pro": "#f59e0b",
  "claude-haiku-3.5": "#ec4899",
};

export default function CostsPage() {
  const dailyCosts = getDailyCosts();
  const costByModel = getCostByModel();
  const costByProvider = getCostByProvider();
  const totalCost = costHistory.reduce((s, e) => s + e.cost, 0);
  const totalTokens = costHistory.reduce((s, e) => s + e.inputTokens + e.outputTokens, 0);
  const totalRequests = costHistory.reduce((s, e) => s + e.requests, 0);

  // Stacked bar: cost per model per day
  const modelNames = [...new Set(costHistory.map((e) => e.model))];
  const stackedData = dailyCosts.map((d) => {
    const entry: Record<string, string | number> = { date: d.date };
    for (const model of modelNames) {
      const match = costHistory.find((e) => e.date === d.date && e.model === model);
      entry[model] = match ? match.cost : 0;
    }
    return entry;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Cost Tracking</h1>
        <p className="text-sm text-zinc-500">Monitor spending across models and providers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Cost (7d)"
          value={formatCurrency(totalCost)}
          trend={{ value: -8, label: "vs prior week" }}
          icon={DollarSign}
        />
        <StatCard
          title="Avg Daily Cost"
          value={formatCurrency(totalCost / 7)}
          icon={TrendingUp}
        />
        <StatCard
          title="Total Tokens (7d)"
          value={formatNumber(totalTokens)}
          icon={Zap}
        />
        <StatCard
          title="Total Requests"
          value={formatNumber(totalRequests)}
          icon={BarChart3}
        />
      </div>

      {/* Cost over time */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyCosts}>
                <defs>
                  <linearGradient id="costGrad2" x1="0" y1="0" x2="0" y2="1">
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
                />
                <Area type="monotone" dataKey="cost" stroke="#6366f1" fill="url(#costGrad2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Stacked by model */}
      <Card>
        <CardHeader>
          <CardTitle>Cost by Model (Stacked)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedData}>
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
                  formatter={(value: number | undefined) => [`$${(value ?? 0).toFixed(3)}`]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {modelNames.map((model) => (
                  <Bar
                    key={model}
                    dataKey={model}
                    stackId="a"
                    fill={MODEL_COLORS[model] || "#71717a"}
                    radius={model === modelNames[modelNames.length - 1] ? [4, 4, 0, 0] : undefined}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Provider + Model breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {costByProvider
                .sort((a, b) => b.cost - a.cost)
                .map((p) => {
                  const pct = (p.cost / totalCost) * 100;
                  return (
                    <div key={p.provider} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-300">{p.provider}</span>
                        <span className="font-mono text-zinc-400">{formatCurrency(p.cost)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {costByModel.map((m) => {
                const pct = (m.cost / totalCost) * 100;
                return (
                  <div key={m.model} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: MODEL_COLORS[m.model] || "#71717a" }}
                        />
                        <span className="font-mono text-zinc-300">{m.model}</span>
                      </div>
                      <span className="font-mono text-zinc-400">{formatCurrency(m.cost)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: MODEL_COLORS[m.model] || "#71717a",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
