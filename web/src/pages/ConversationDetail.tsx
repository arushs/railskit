import { useParams, useNavigate } from "react-router";
import { ArrowLeft, User, Bot, Wrench, Clock, Zap, DollarSign } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { conversations, type Message } from "../data/mock";
import { formatCurrency, cn } from "../lib/utils";
import { useState, useEffect, useRef } from "react";

function MessageBubble({ message, isStreaming }: { message: Message; isStreaming: boolean }) {
  const isUser = message.role === "user";
  const isTool = message.role === "tool";

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs",
          isUser
            ? "bg-indigo-500/20 text-indigo-400"
            : isTool
              ? "bg-amber-500/20 text-amber-400"
              : "bg-zinc-800 text-zinc-400"
        )}
      >
        {isUser ? <User size={14} /> : isTool ? <Wrench size={14} /> : <Bot size={14} />}
      </div>
      <div className={cn("max-w-[70%] space-y-1", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-xl px-3.5 py-2 text-sm",
            isUser
              ? "bg-indigo-600 text-white"
              : isTool
                ? "border border-amber-500/20 bg-amber-500/5 text-amber-200"
                : "bg-zinc-800 text-zinc-200"
          )}
        >
          {isTool && message.toolName && (
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-mono text-amber-500">
              <Wrench size={10} />
              {message.toolName}
              {message.duration && (
                <span className="text-amber-600">({message.duration}ms)</span>
              )}
            </div>
          )}
          <p className={cn(isStreaming && "after:content-['▌'] after:animate-pulse after:ml-0.5")}>
            {message.content}
          </p>
        </div>
        <div className="flex items-center gap-2 px-1 text-[10px] text-zinc-600">
          <span>
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {message.model && <span className="font-mono">{message.model}</span>}
          {message.tokens && (
            <span className="flex items-center gap-0.5">
              <Zap size={8} />
              {message.tokens.input + message.tokens.output}
            </span>
          )}
          {message.cost != null && (
            <span className="flex items-center gap-0.5">
              <DollarSign size={8} />
              {message.cost.toFixed(4)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConversationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const conv = conversations.find((c) => c.id === id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simulate streaming for active conversations
  const [visibleCount, setVisibleCount] = useState(conv?.status === "active" ? 0 : conv?.messages.length || 0);

  useEffect(() => {
    if (!conv || conv.status !== "active") return;
    if (visibleCount >= conv.messages.length) return;
    const timer = setTimeout(() => setVisibleCount((c) => c + 1), 300);
    return () => clearTimeout(timer);
  }, [visibleCount, conv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleCount]);

  if (!conv) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-zinc-500">Conversation not found</p>
        <button
          onClick={() => navigate("/dashboard/conversations")}
          className="mt-3 text-sm text-indigo-400 hover:text-indigo-300"
        >
          ← Back to conversations
        </button>
      </div>
    );
  }

  const visibleMessages = conv.messages.slice(0, visibleCount);
  const runningCost = visibleMessages.reduce((s, m) => s + (m.cost || 0), 0);
  const runningTokens = visibleMessages.reduce(
    (s, m) => s + (m.tokens ? m.tokens.input + m.tokens.output : 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/conversations")}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{conv.title}</h1>
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
            <p className="text-xs text-zinc-500">
              {conv.agent} · {conv.model} · Started{" "}
              {conv.startedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <div className="flex items-center gap-2 p-3">
            <DollarSign size={14} className="text-zinc-500" />
            <div>
              <p className="text-xs text-zinc-500">Cost</p>
              <p className="text-sm font-mono text-zinc-200">{formatCurrency(runningCost)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 p-3">
            <Zap size={14} className="text-zinc-500" />
            <div>
              <p className="text-xs text-zinc-500">Tokens</p>
              <p className="text-sm font-mono text-zinc-200">{runningTokens.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 p-3">
            <Clock size={14} className="text-zinc-500" />
            <div>
              <p className="text-xs text-zinc-500">Messages</p>
              <p className="text-sm font-mono text-zinc-200">
                {visibleCount}/{conv.messages.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {visibleMessages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isStreaming={conv.status === "active" && i === visibleCount - 1}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
