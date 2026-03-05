import { useState, useRef, useEffect, type FormEvent } from "react";
import { useAgentStream } from "@/hooks/useAgentStream";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function HelpDeskChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const streamMsgId = useRef<string | null>(null);

  const { sendMessage, isStreaming, streamContent } = useAgentStream({
    onStart() {
      // Add a placeholder assistant message for streaming content
      const id = crypto.randomUUID();
      streamMsgId.current = id;
      setMessages((prev) => [...prev, { id, role: "assistant", content: "" }]);
    },
    onToken(_token, accumulated) {
      // Update the streaming message in-place
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamMsgId.current
            ? { ...msg, content: accumulated }
            : msg
        )
      );
    },
    onComplete(fullContent) {
      // Finalize the streaming message with the complete content
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamMsgId.current
            ? { ...msg, content: fullContent }
            : msg
        )
      );
      streamMsgId.current = null;
    },
    onError(error) {
      // Replace streaming placeholder with error, or add new error message
      if (streamMsgId.current) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamMsgId.current
              ? { ...msg, content: error }
              : msg
          )
        );
        streamMsgId.current = null;
      } else {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: error },
        ]);
      }
    },
  });

  // Auto-scroll on new messages or streaming updates
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamContent]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const newChatId = await sendMessage(
      "help_desk",
      userMsg.content,
      chatId ?? undefined
    );
    if (newChatId && !chatId) {
      setChatId(newChatId);
    }
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Help Desk</h2>
        <p className="text-sm text-muted-foreground">
          Ask about tickets, orders, or browse our knowledge base
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-8 space-y-2">
            <p className="text-muted-foreground">
              How can we help you today?
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {[
                "Check ticket status",
                "Reset my password",
                "Billing question",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="rounded-full border px-3 py-1 text-sm hover:bg-accent"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {msg.content || (
                <span className="animate-pulse">Thinking…</span>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your issue…"
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          disabled={isStreaming}
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {isStreaming ? "Streaming…" : "Send"}
        </button>
      </form>
    </div>
  );
}
