import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Coins, Activity } from "lucide-react";
import { mockCostSummary } from "@/lib/mock-data";

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function CostTracking() {
  const { totalCost, totalTokens, totalRequests, breakdown, dailyCosts } = mockCostSummary;
  const maxDailyCost = Math.max(...dailyCosts.map((d) => d.cost));
  const providerColor: Record<string, "default" | "success" | "warning"> = { anthropic: "default", openai: "success", google: "warning" };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Cost Tracking</h1>
        <p className="text-zinc-400 mt-1">Per-model and per-provider cost breakdown.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Spend", value: `$${totalCost.toFixed(2)}`, icon: DollarSign, sub: "All time" },
          { label: "Total Tokens", value: formatTokens(totalTokens), icon: Coins, sub: `${formatTokens(totalTokens)} processed` },
          { label: "Total Requests", value: totalRequests.toLocaleString(), icon: Activity, sub: `${breakdown.length} models` },
          { label: "Today", value: `$${dailyCosts.at(-1)?.cost.toFixed(2) ?? "0.00"}`, icon: TrendingUp, sub: new Date().toLocaleDateString() },
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
          <CardTitle>Daily Costs (7 days)</CardTitle>
          <CardDescription>Visual breakdown of recent daily spending.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-40">
            {dailyCosts.map((day) => {
              const pct = maxDailyCost > 0 ? (day.cost / maxDailyCost) * 100 : 0;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-zinc-400">${day.cost.toFixed(2)}</span>
                  <div className="w-full rounded-t-md bg-indigo-500/40 hover:bg-indigo-500/60 transition-colors" style={{ height: `${pct}%`, minHeight: 4 }} />
                  <span className="text-[10px] text-zinc-500">{new Date(day.date).toLocaleDateString([], { weekday: "short" })}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Model Breakdown</CardTitle>
          <CardDescription>Cost and token usage per model.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Prompt Tokens</TableHead>
                <TableHead className="text-right">Completion Tokens</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {breakdown.sort((a, b) => b.cost - a.cost).map((row) => (
                <TableRow key={`${row.provider}-${row.model}`}>
                  <TableCell className="font-medium text-white">{row.model}</TableCell>
                  <TableCell><Badge variant={providerColor[row.provider] ?? "secondary"}>{row.provider}</Badge></TableCell>
                  <TableCell className="text-right">{row.requestCount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{formatTokens(row.promptTokens)}</TableCell>
                  <TableCell className="text-right">{formatTokens(row.completionTokens)}</TableCell>
                  <TableCell className="text-right font-medium text-white">${row.cost.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 border-zinc-700 font-semibold">
                <TableCell className="text-white">Total</TableCell>
                <TableCell />
                <TableCell className="text-right text-white">{totalRequests.toLocaleString()}</TableCell>
                <TableCell className="text-right text-white">{formatTokens(breakdown.reduce((a, b) => a + b.promptTokens, 0))}</TableCell>
                <TableCell className="text-right text-white">{formatTokens(breakdown.reduce((a, b) => a + b.completionTokens, 0))}</TableCell>
                <TableCell className="text-right text-white">${totalCost.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
