import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { modelUsage } from "../data/mock";
import { formatCurrency, formatNumber } from "../lib/utils";
import { BarChart3, Zap, DollarSign, Clock } from "lucide-react";
import { StatCard } from "../components/dashboard/StatCard";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const COLORS: Record<string, string> = {
  "claude-opus-4": "#6366f1",
  "claude-sonnet-4": "#8b5cf6",
  "gpt-4o": "#10b981",
  "gemini-2.5-pro": "#f59e0b",
  "claude-haiku-3.5": "#ec4899",
};

export default function ModelsPage() {
  const totalRequests = modelUsage.reduce((s, m) => s + m.requests, 0);
  const totalCost = modelUsage.reduce((s, m) => s + m.totalCost, 0);
  const totalTokens = modelUsage.reduce(
    (s, m) => s + m.inputTokens + m.outputTokens,
    0
  );
  const avgLatency =
    modelUsage.reduce((s, m) => s + m.avgLatency * m.requests, 0) / totalRequests;

  // Radar data — normalize each metric to 0-100
  const maxReqs = Math.max(...modelUsage.map((m) => m.requests));
  const maxCost = Math.max(...modelUsage.map((m) => m.totalCost));
  const maxTokens = Math.max(...modelUsage.map((m) => m.inputTokens + m.outputTokens));
  const maxLatency = Math.max(...modelUsage.map((m) => m.avgLatency));

  const radarData = [
    {
      metric: "Requests",
      ...Object.fromEntries(modelUsage.map((m) => [m.model, (m.requests / maxReqs) * 100])),
    },
    {
      metric: "Cost",
      ...Object.fromEntries(modelUsage.map((m) => [m.model, (m.totalCost / maxCost) * 100])),
    },
    {
      metric: "Tokens",
      ...Object.fromEntries(
        modelUsage.map((m) => [m.model, ((m.inputTokens + m.outputTokens) / maxTokens) * 100])
      ),
    },
    {
      metric: "Speed",
      ...Object.fromEntries(
        modelUsage.map((m) => [m.model, (1 - m.avgLatency / maxLatency) * 100])
      ),
    },
  ];

  // Token usage comparison
  const tokenData = modelUsage
    .sort((a, b) => b.inputTokens + b.outputTokens - (a.inputTokens + a.outputTokens))
    .map((m) => ({
      model: m.model.replace("claude-", "").replace("gemini-", ""),
      input: m.inputTokens,
      output: m.outputTokens,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Model Breakdown</h1>
        <p className="text-sm text-zinc-500">Compare model usage, cost, and performance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Requests" value={formatNumber(totalRequests)} icon={BarChart3} />
        <StatCard title="Total Cost" value={formatCurrency(totalCost)} icon={DollarSign} />
        <StatCard title="Total Tokens" value={formatNumber(totalTokens)} icon={Zap} />
        <StatCard
          title="Avg Latency"
          value={`${Math.round(avgLatency)}ms`}
          icon={Clock}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Model Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis dataKey="metric" stroke="#52525b" fontSize={12} />
                  <PolarRadiusAxis stroke="#27272a" fontSize={10} />
                  {modelUsage.map((m) => (
                    <Radar
                      key={m.model}
                      name={m.model}
                      dataKey={m.model}
                      stroke={COLORS[m.model] || "#71717a"}
                      fill={COLORS[m.model] || "#71717a"}
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Token usage */}
        <Card>
          <CardHeader>
            <CardTitle>Token Usage by Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tokenData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="model" stroke="#52525b" fontSize={11} />
                  <YAxis
                    stroke="#52525b"
                    fontSize={12}
                    tickFormatter={(v: number) => formatNumber(v)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    formatter={(value: number | undefined) => [formatNumber(value ?? 0)]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="input" name="Input Tokens" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="output" name="Output Tokens" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modelUsage
          .sort((a, b) => b.totalCost - a.totalCost)
          .map((m) => {
            const pctCost = (m.totalCost / totalCost) * 100;
            const pctReqs = (m.requests / totalRequests) * 100;
            return (
              <Card key={m.model} className="hover:border-zinc-700 transition-colors">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[m.model] || "#71717a" }}
                      />
                      <span className="text-sm font-mono font-medium text-zinc-200">
                        {m.model}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500">{m.provider}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase">Cost</p>
                      <p className="text-sm font-mono text-zinc-300">
                        {formatCurrency(m.totalCost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase">Requests</p>
                      <p className="text-sm font-mono text-zinc-300">{m.requests}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase">Tokens</p>
                      <p className="text-sm font-mono text-zinc-300">
                        {formatNumber(m.inputTokens + m.outputTokens)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase">Latency</p>
                      <p className="text-sm font-mono text-zinc-300">{m.avgLatency}ms</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>{pctCost.toFixed(1)}% of cost</span>
                      <span>{pctReqs.toFixed(1)}% of requests</span>
                    </div>
                    <div className="flex gap-1 h-1.5">
                      <div
                        className="rounded-full bg-indigo-500"
                        style={{ width: `${pctCost}%` }}
                      />
                      <div
                        className="rounded-full bg-violet-500"
                        style={{ width: `${pctReqs}%` }}
                      />
                      <div className="flex-1 rounded-full bg-zinc-800" />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
