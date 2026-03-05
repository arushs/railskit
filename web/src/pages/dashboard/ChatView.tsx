import { useParams, Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot, User, Terminal, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockChats, mockMessages } from "@/lib/mock-data";
import type { Message } from "@/lib/agents-api";

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isTool = message.role === "tool";

  const roleIcon = isUser ? <User className="h-4 w-4" /> : isTool ? <Terminal className="h-4 w-4" /> : <Bot className="h-4 w-4" />;
  const roleColor = isUser ? "bg-indigo-500/10 text-indigo-400" : isTool ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400";

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn("mt-1 rounded-lg p-2 shrink-0", roleColor)}>{roleIcon}</div>
      <div className={cn("max-w-[80%] rounded-2xl px-4 py-3",
        isUser ? "bg-indigo-600/20 border border-indigo-500/30" : isTool ? "bg-amber-600/10 border border-amber-500/20" : "bg-zinc-800/50 border border-zinc-700",
      )}>
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-xs font-medium text-zinc-300 capitalize">{message.role}</span>
          {message.toolName && <Badge variant="warning" className="text-[10px] px-1.5 py-0">{message.toolName}</Badge>}
          {message.model && <Badge variant="outline" className="text-[10px] px-1.5 py-0"><Cpu className="h-2.5 w-2.5 mr-1" />{message.model}</Badge>}
          <span className="text-[10px] text-zinc-500 ml-auto">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>
        <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{message.content}</p>
        {(message.tokenUsage || message.cost !== undefined) && (
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-zinc-700/50 text-[10px] text-zinc-500">
            {message.tokenUsage && (<><span>{message.tokenUsage.prompt.toLocaleString()} prompt</span><span>{message.tokenUsage.completion.toLocaleString()} completion</span></>)}
            {message.cost !== undefined && <span className="text-indigo-400">${message.cost.toFixed(4)}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatView() {
  const { id } = useParams<{ id: string }>();
  const chat = mockChats.find((c) => c.id === id);
  const messages = mockMessages.filter((m) => m.chatId === id);

  if (!chat) {
    return (
      <div className="space-y-4">
        <Link to="/agents/chats" className="text-indigo-400 hover:text-indigo-300 text-sm">{"← Back to chats"}</Link>
        <Card><CardContent className="p-12 text-center"><p className="text-zinc-400">Chat not found.</p></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link to="/agents/chats"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{chat.agentEmoji}</span>
            <div>
              <h1 className="text-xl font-bold truncate">{chat.title}</h1>
              <p className="text-sm text-zinc-400">{chat.agentName} · {chat.messageCount} messages · ${chat.totalCost.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {messages.length === 0 ? (
          <Card><CardContent className="p-12 text-center">
            <p className="text-zinc-400">No messages to display.</p>
            <p className="text-xs text-zinc-500 mt-1">Messages will appear here once the backend is connected.</p>
          </CardContent></Card>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
      </div>

      <div className="flex items-center gap-2 text-zinc-500 text-sm">
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 animate-pulse" />
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 animate-pulse [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 animate-pulse [animation-delay:300ms]" />
        </div>
        <span>{"Listening for new messages\u2026"}</span>
      </div>
    </div>
  );
}
