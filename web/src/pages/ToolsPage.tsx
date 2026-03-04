import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { toolUsage } from "../data/mock";
import { timeAgo, cn, formatNumber } from "../lib/utils";
import { Wrench, Clock, CheckCircle } from "lucide-react";
import { StatCard } from "../components/dashboard/StatCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ToolsPage() {
  const totalCalls = toolUsage.reduce((s, t) => s + t.calls, 0);
  const avgSuccess =
    toolUsage.reduce((s, t) => s + t.successRate * t.calls, 0) / totalCalls;
  const avgDuration =
    toolUsage.reduce((s, t) => s + t.avgDuration * t.calls, 0) / totalCalls;

  const chartData = toolUsage
    .sort((a, b) => b.calls - a.calls)
    .map((t) => ({
      name: t.name,
      calls: t.calls,
      avgMs: t.avgDuration,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Tool Usage</h1>
        <p className="text-sm text-zinc-500">Track how agents use available tools</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Tool Calls"
          value={formatNumber(totalCalls)}
          subtitle={`${toolUsage.length} unique tools`}
          icon={Wrench}
        />
        <StatCard
          title="Avg Success Rate"
          value={`${avgSuccess.toFixed(1)}%`}
          icon={CheckCircle}
        />
        <StatCard
          title="Avg Duration"
          value={`${Math.round(avgDuration)}ms`}
          icon={Clock}
        />
      </div>

      {/* Usage chart */}
      <Card>
        <CardHeader>
          <CardTitle>Calls by Tool</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" stroke="#52525b" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#52525b" fontSize={12} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  formatter={(value: number | undefined, name: string | undefined) => [
                    (name ?? "") === "calls" ? (value ?? 0) : `${value ?? 0}ms`,
                    (name ?? "") === "calls" ? "Calls" : "Avg Duration",
                  ]}
                />
                <Bar dataKey="calls" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tool detail cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {toolUsage
          .sort((a, b) => b.calls - a.calls)
          .map((tool) => (
            <Card key={tool.name} className="hover:border-zinc-700 transition-colors">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-zinc-800 p-1.5">
                      <Wrench size={14} className="text-zinc-400" />
                    </div>
                    <span className="text-sm font-mono font-medium text-zinc-200">
                      {tool.name}
                    </span>
                  </div>
                  <Badge
                    variant={
                      tool.successRate >= 98
                        ? "active"
                        : tool.successRate >= 95
                          ? "completed"
                          : "warning"
                    }
                  >
                    {tool.successRate}%
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase">Calls</p>
                    <p className="text-sm font-mono text-zinc-300">{tool.calls}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase">Avg ms</p>
                    <p className="text-sm font-mono text-zinc-300">{tool.avgDuration}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase">Last Used</p>
                    <p className="text-xs text-zinc-400">{timeAgo(tool.lastUsed)}</p>
                  </div>
                </div>

                {/* Success rate bar */}
                <div className="space-y-1">
                  <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        tool.successRate >= 98
                          ? "bg-emerald-500"
                          : tool.successRate >= 95
                            ? "bg-blue-500"
                            : "bg-amber-500"
                      )}
                      style={{ width: `${tool.successRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}
