import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router";
import { MessageSquare, DollarSign, Wrench, Zap } from "lucide-react";
import { mockAgents, mockConversations, mockCostSummary, mockToolUsage } from "@/lib/mock-data";

export default function DashboardOverview() {
  const stats = [
    { label: "Active Conversations", value: mockConversations.length.toString(), icon: MessageSquare, change: "+3 today" },
    { label: "Total Spend", value: `$${mockCostSummary.totalCost.toFixed(2)}`, icon: DollarSign, change: `$${mockCostSummary.dailyCosts.at(-1)?.cost.toFixed(2)} today` },
    { label: "Tool Calls", value: mockToolUsage.totalCalls.toLocaleString(), icon: Wrench, change: `${mockToolUsage.uniqueTools} unique tools` },
    { label: "Total Requests", value: mockCostSummary.totalRequests.toLocaleString(), icon: Zap, change: `${(mockCostSummary.totalTokens / 1_000_000).toFixed(1)}M tokens` },
  ];

  const statusColor = { online: "success" as const, idle: "warning" as const, offline: "secondary" as const };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-zinc-400 mt-1">Monitor your AI agents, costs, and tool usage.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-zinc-400">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-zinc-500">{stat.change}</p>
                  </div>
                  <div className="rounded-lg bg-indigo-500/10 p-3">
                    <Icon className="h-5 w-5 text-indigo-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>Agents</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mockAgents.map((agent) => (
              <div key={agent.id} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
                <span className="text-2xl">{agent.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{agent.name}</p>
                  <p className="text-sm text-zinc-400 truncate">{agent.role}</p>
                </div>
                <Badge variant={statusColor[agent.status]}>{agent.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Conversations</CardTitle>
          <Link to="/dashboard/conversations" className="text-sm text-indigo-400 hover:text-indigo-300">{"View all \u2192"}</Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockConversations.slice(0, 3).map((conv) => (
              <Link key={conv.id} to={`/dashboard/conversations/${conv.id}`}
                className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 hover:bg-zinc-800/50 transition-colors">
                <span className="text-xl mt-0.5">{conv.agentEmoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white truncate">{conv.title}</p>
                    <span className="text-xs text-zinc-500 whitespace-nowrap">
                      {new Date(conv.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 truncate mt-0.5">{conv.preview}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                    <span>{conv.messageCount} messages</span>
                    <span>${conv.totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
