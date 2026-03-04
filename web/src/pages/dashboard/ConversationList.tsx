import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { mockConversations, mockAgents } from "@/lib/mock-data";

export default function ConversationList() {
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = mockConversations;
    if (agentFilter) result = result.filter((c) => c.agentId === agentFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q) || c.agentName.toLowerCase().includes(q),
      );
    }
    return result;
  }, [search, agentFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Conversations</h1>
        <p className="text-zinc-400 mt-1">Browse and search agent conversations.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Search conversations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setAgentFilter(null)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${!agentFilter ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"}`}>
            All
          </button>
          {mockAgents.map((agent) => (
            <button key={agent.id} onClick={() => setAgentFilter(agentFilter === agent.id ? null : agent.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${agentFilter === agent.id ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"}`}>
              {agent.emoji} {agent.name}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center"><p className="text-zinc-400">No conversations found.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((conv) => (
            <Link key={conv.id} to={`/dashboard/conversations/${conv.id}`}>
              <Card className="hover:border-zinc-700 transition-colors cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <span className="text-2xl mt-0.5">{conv.agentEmoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate">{conv.title}</p>
                          <p className="text-sm text-zinc-400 mt-0.5">{conv.agentName}</p>
                        </div>
                        <span className="text-xs text-zinc-500 whitespace-nowrap">
                          {new Date(conv.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{conv.preview}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <Badge variant="secondary">{conv.messageCount} messages</Badge>
                        <Badge variant="default">${conv.totalCost.toFixed(2)}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
