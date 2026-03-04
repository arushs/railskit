import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { conversations } from "../data/mock";
import { formatCurrency, formatNumber, timeAgo } from "../lib/utils";
import { Search, MessageSquare, Clock, DollarSign, Zap } from "lucide-react";
import { StatCard } from "../components/dashboard/StatCard";

type StatusFilter = "all" | "active" | "completed" | "error";

export default function ConversationsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      const matchesSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.agent.toLowerCase().includes(search.toLowerCase()) ||
        c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const totalCost = conversations.reduce((s, c) => s + c.totalCost, 0);
  const totalTokens = conversations.reduce((s, c) => s + c.totalTokens, 0);
  const activeCount = conversations.filter((c) => c.status === "active").length;

  const statuses: StatusFilter[] = ["all", "active", "completed", "error"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Conversations</h1>
        <p className="text-sm text-zinc-500">Browse and search agent conversations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Conversations"
          value={conversations.length.toString()}
          icon={MessageSquare}
        />
        <StatCard
          title="Active Now"
          value={activeCount.toString()}
          icon={Clock}
        />
        <StatCard
          title="Total Cost"
          value={formatCurrency(totalCost)}
          icon={DollarSign}
        />
        <StatCard
          title="Total Tokens"
          value={formatNumber(totalTokens)}
          icon={Zap}
        />
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-800/50">
            {filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => navigate(`/dashboard/conversations/${conv.id}`)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-zinc-800/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-200 truncate">{conv.title}</p>
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
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                    <span>{conv.agent}</span>
                    <span>·</span>
                    <span className="font-mono">{conv.model}</span>
                    <span>·</span>
                    <span>{conv.messageCount} messages</span>
                    {conv.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-xs">
                  <div className="text-right">
                    <p className="font-mono text-zinc-300">{formatCurrency(conv.totalCost)}</p>
                    <p className="text-zinc-600">{formatNumber(conv.totalTokens)} tokens</p>
                  </div>
                  <span className="text-zinc-600 w-16 text-right">{timeAgo(conv.lastMessageAt)}</span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-zinc-500">
                No conversations found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
