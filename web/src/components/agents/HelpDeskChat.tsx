import { useState, useRef, useEffect, type FormEvent } from "react";

interface Message { id: string; role: "user" | "assistant"; content: string; }

export function HelpDeskChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: input.trim() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/agents/help_desk/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content, conversation_id: conversationId }),
      });
      const data = await res.json();
      if (data.conversation_id) setConversationId(data.conversation_id);
      setMessages((p) => [...p, { id: crypto.randomUUID(), role: "assistant", content: data.response ?? "Error" }]);
    } catch {
      setMessages((p) => [...p, { id: crypto.randomUUID(), role: "assistant", content: "Failed to reach server." }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Help Desk</h2>
        <p className="text-sm text-muted-foreground">Ask about tickets, orders, or browse our knowledge base</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-8 space-y-2">
            <p className="text-muted-foreground">How can we help you today?</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {["Check ticket status", "Reset my password", "Billing question"].map((q) => (
                <button key={q} onClick={() => setInput(q)} className="rounded-full border px-3 py-1 text-sm hover:bg-accent">{q}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="bg-muted rounded-lg px-4 py-2 animate-pulse">Thinking…</div></div>}
        <div ref={endRef} />
      </div>
      <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe your issue…"
          className="flex-1 rounded-md border px-3 py-2 text-sm" disabled={loading} />
        <button type="submit" disabled={loading || !input.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Send</button>
      </form>
    </div>
  );
}
