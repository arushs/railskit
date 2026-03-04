import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wrench, Zap, Clock, CheckCircle } from "lucide-react";
import { mockToolUsage } from "@/lib/mock-data";
import type { ToolUsageStat } from "@/lib/agents-api";

function formatDuration(ms: number) {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

function successRateColor(rate: number): "success" | "warning" | "destructive" {
  if (rate >= 0.95) return "success";
  if (rate >= 0.85) return "warning";
  return "destructive";
}

export default function ToolUsage() {
  const { totalCalls, uniqueTools, stats } = mockToolUsage;
  const topTool = stats[0];
  const avgSuccess = stats.reduce((sum: number, s: ToolUsageStat) => sum + s.successRate, 0) / stats.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Tool Usage</h1>
        <p className="text-zinc-400 mt-1">How agents use tools across conversations.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Calls", value: totalCalls.toLocaleString(), icon: Zap, sub: "All tools combined" },
          { label: "Unique Tools", value: uniqueTools.toString(), icon: Wrench, sub: "Distinct tool types" },
          { label: "Most Used", value: topTool?.toolName ?? "\u2014", icon: Clock, sub: `${topTool?.callCount.toLocaleString()} calls` },
          { label: "Avg Success", value: `${(avgSuccess * 100).toFixed(1)}%`, icon: CheckCircle, sub: "Across all tools" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}><CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-zinc-400">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-zinc-500">{s.sub}</p>
                </div>
                <div className="rounded-lg bg-indigo-500/10 p-3"><Icon className="h-5 w-5 text-indigo-400" /></div>
              </div>
            </CardContent></Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Call Distribution</CardTitle>
          <CardDescription>Relative usage of each tool.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.map((tool: ToolUsageStat) => {
              const pct = totalCalls > 0 ? (tool.callCount / totalCalls) * 100 : 0;
              return (
                <div key={tool.toolName} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-white">{tool.toolName}</span>
                    <span className="text-zinc-400">{tool.callCount.toLocaleString()} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-800">
                    <div className="h-full rounded-full bg-indigo-500/60 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tool Details</CardTitle>
          <CardDescription>Performance metrics per tool.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead className="text-right">Calls</TableHead>
                <TableHead className="text-right">Avg Duration</TableHead>
                <TableHead className="text-right">Success Rate</TableHead>
                <TableHead className="text-right">Last Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((tool: ToolUsageStat) => (
                <TableRow key={tool.toolName}>
                  <TableCell className="font-medium text-white">{tool.toolName}</TableCell>
                  <TableCell className="text-right">{tool.callCount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{formatDuration(tool.avgDurationMs)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={successRateColor(tool.successRate)}>{(tool.successRate * 100).toFixed(0)}%</Badge>
                  </TableCell>
                  <TableCell className="text-right text-zinc-400 text-xs">
                    {new Date(tool.lastUsed).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
