import { useState, useEffect, useRef, useCallback } from "react";

/**
 * AgentDemo — Interactive chat widget that simulates an AI agent conversation.
 *
 * Shows visitors what a RailsKit-powered agent can do via pre-scripted
 * conversations with streaming text, typing indicators, and tool call UI.
 * Pure React — no backend needed.
 */

// ── Types ──

interface ToolCall {
  name: string;
  status: "running" | "complete";
  description: string;
  result?: string;
}

interface AgentMessage {
  role: "agent";
  text: string;
  toolCall?: ToolCall;
}

interface UserMessage {
  role: "user";
  text: string;
}

type Message = AgentMessage | UserMessage;

interface QuickReply {
  label: string;
  path: ConversationPath;
}

type ConversationPath = "features" | "how-agents-work" | "get-started";

// ── Conversation Data ──

const INITIAL_GREETING: AgentMessage = {
  role: "agent",
  text: "Hey! 👋 I'm the RailsKit Assistant — an AI agent built with RailsKit in under 5 minutes. Ask me anything!",
};

const QUICK_REPLIES: QuickReply[] = [
  { label: "What can you help me with?", path: "features" },
  { label: "Show me how agents work", path: "how-agents-work" },
  { label: "How do I get started?", path: "get-started" },
];

const CONVERSATIONS: Record<ConversationPath, Message[]> = {
  features: [
    {
      role: "agent",
      text: "RailsKit gives you a production-ready Rails 8 API + React 19 monorepo. Here's what's included out of the box:",
    },
    {
      role: "agent",
      text: "🔐 **Auth** — Devise + JWT with refresh tokens, Google OAuth\n💳 **Payments** — Stripe subscriptions + webhooks\n🤖 **AI Agents** — Streaming chat, tool calling, memory\n🐳 **Deploy** — Docker + GitHub Actions CI/CD\n⚡ **Dev** — Vite HMR, TypeScript strict, hot reload",
    },
    {
      role: "agent",
      text: "The best part? You run one command and all of this is ready. No boilerplate assembly required.",
    },
  ],
  "how-agents-work": [
    {
      role: "agent",
      text: "Great question! Let me show you. I'll search our knowledge base — watch the tool call below 👇",
    },
    {
      role: "agent",
      text: "Here's what happened: I called a **tool** (a function your agent can use), it searched the knowledge base, and I used the result to answer you. That's the core of agentic AI.",
      toolCall: {
        name: "search_knowledge_base",
        status: "complete",
        description: "Searching knowledge base for \"how agents work\"...",
        result:
          '{"results": [{"title": "Agent Architecture", "content": "RailsKit agents use a tool-calling loop: receive message → decide if tools are needed → call tools → synthesize response. Tools are Ruby classes that agents can invoke."}]}',
      },
    },
    {
      role: "agent",
      text: "In RailsKit, you define tools as Ruby classes and the agent framework handles the rest — streaming responses, tool execution, conversation memory. All over ActionCable WebSockets.",
    },
  ],
  "get-started": [
    {
      role: "agent",
      text: "Getting started takes about 2 minutes. Here's the quick version:",
    },
    {
      role: "agent",
      text: "```\ngit clone https://github.com/arushs/railskit myapp\ncd myapp && bin/setup\nbin/dev\n```\n\nThat's it. Rails API on `:3000`, React on `:5173`, hot reload active.",
    },
    {
      role: "agent",
      text: "Want to add an AI agent? One more command:\n\n```\nrails generate agent HelpDesk\n```\n\nThis creates the agent class, streaming controller, React chat hook, and WebSocket channel. Wire it up and you're live. 🚀",
    },
  ],
};

// ── Subcomponents ──

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs shrink-0">
        🤖
      </div>
      <div className="flex items-center gap-1 ml-2 px-3 py-2 rounded-2xl bg-zinc-800">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function ToolCallPanel({ toolCall }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mx-4 my-1 rounded-lg border border-zinc-700/50 bg-zinc-800/50 overflow-hidden text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-700/30 transition-colors"
      >
        {toolCall.status === "running" ? (
          <span className="w-3 h-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin shrink-0" />
        ) : (
          <span className="text-green-400 shrink-0">✓</span>
        )}
        <span className="text-zinc-300 font-mono">{toolCall.name}</span>
        <span className="text-zinc-500 ml-auto">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && toolCall.result && (
        <div className="px-3 pb-2 border-t border-zinc-700/50">
          <div className="mt-2 text-zinc-500 mb-1">{toolCall.description}</div>
          <pre className="text-zinc-400 font-mono text-[10px] leading-relaxed whitespace-pre-wrap bg-zinc-900/50 rounded p-2 overflow-x-auto">
            {toolCall.result}
          </pre>
        </div>
      )}
    </div>
  );
}

function ChatBubble({
  message,
  streaming,
  displayedText,
}: {
  message: Message;
  streaming?: boolean;
  displayedText?: string;
}) {
  const isAgent = message.role === "agent";
  const text = streaming ? (displayedText ?? "") : message.text;

  return (
    <div className={`flex gap-2 px-4 py-1 ${isAgent ? "" : "justify-end"}`}>
      {isAgent && (
        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs shrink-0 mt-1">
          🤖
        </div>
      )}
      <div
        className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
          isAgent
            ? "bg-zinc-800 text-zinc-200"
            : "bg-indigo-600 text-white"
        }`}
      >
        <FormattedText text={text} />
        {streaming && <span className="inline-block w-1 h-3.5 bg-indigo-400 animate-pulse ml-0.5 align-middle" />}
      </div>
    </div>
  );
}

/** Renders markdown-lite text: **bold**, `code`, ```codeblock```, newlines */
function FormattedText({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={key++}
            className="my-1 px-2 py-1.5 rounded bg-zinc-900/80 font-mono text-xs text-green-400 overflow-x-auto"
          >
            {codeLines.join("\n")}
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }
    // Inline formatting
    elements.push(
      <span key={key++} className="block">
        {formatInline(line)}
      </span>
    );
  }

  return <>{elements}</>;
}

function formatInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(
        <strong key={key++} className="font-semibold text-white">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      parts.push(
        <code
          key={key++}
          className="px-1 py-0.5 rounded bg-zinc-700 font-mono text-xs text-indigo-300"
        >
          {match[3]}
        </code>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

// ── Main Component ──

export default function AgentDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingIdx, setStreamingIdx] = useState<number | null>(null);
  const [streamedText, setStreamedText] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [activeToolCall, setActiveToolCall] = useState<ToolCall | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, streamedText, activeToolCall]);

  // Stream text character by character
  const streamText = useCallback(
    (text: string, msgIndex: number): Promise<void> => {
      return new Promise((resolve) => {
        setStreamingIdx(msgIndex);
        setStreamedText("");
        let i = 0;
        const interval = setInterval(() => {
          if (abortRef.current) {
            clearInterval(interval);
            resolve();
            return;
          }
          i++;
          setStreamedText(text.slice(0, i));
          if (i >= text.length) {
            clearInterval(interval);
            setStreamingIdx(null);
            resolve();
          }
        }, 18); // ~55 chars/sec — fast enough to feel real, slow enough to read
      });
    },
    []
  );

  const handleQuickReply = useCallback(
    async (path: ConversationPath, label: string) => {
      if (isTyping) return;
      abortRef.current = false;
      setHasInteracted(true);
      setShowQuickReplies(false);

      // Add user message
      const userMsg: UserMessage = { role: "user", text: label };
      setMessages((prev) => [...prev, userMsg]);

      const responses = CONVERSATIONS[path];
      let currentIdx = messages.length + 1; // +1 for the user msg we just added

      for (const resp of responses) {
        if (abortRef.current) break;

        // Show typing indicator
        setIsTyping(true);
        await delay(800 + Math.random() * 600);
        if (abortRef.current) break;
        setIsTyping(false);

        // If this message has a tool call, show the running state first
        if (resp.role === "agent" && resp.toolCall) {
          const runningTool: ToolCall = {
            ...resp.toolCall,
            status: "running",
            result: undefined,
          };
          setActiveToolCall(runningTool);
          await delay(1800);
          if (abortRef.current) break;
          // Complete the tool call
          setActiveToolCall(resp.toolCall);
          await delay(600);
          if (abortRef.current) break;
          setActiveToolCall(null);
        }

        // Add message and stream it
        setMessages((prev) => [...prev, resp]);
        await streamText(resp.text, currentIdx);
        currentIdx++;

        // Pause between messages
        await delay(400);
      }

      // Show quick replies again after conversation
      await delay(300);
      setShowQuickReplies(true);
    },
    [isTyping, messages.length, streamText]
  );

  const handleReset = useCallback(() => {
    abortRef.current = true;
    setMessages([INITIAL_GREETING]);
    setIsTyping(false);
    setStreamingIdx(null);
    setStreamedText("");
    setActiveToolCall(null);
    setShowQuickReplies(true);
    setHasInteracted(false);
  }, []);

  return (
    <>
      {/* Floating chat bubble */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95"
            aria-label="Open chat demo"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {/* Pulse ring */}
            {!hasInteracted && (
              <span className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-20" />
            )}
            {/* Tooltip */}
            <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
              Try the AI agent demo →
            </span>
          </button>
        )}
      </div>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-3rem)] rounded-2xl border border-zinc-700/50 bg-zinc-900 shadow-2xl shadow-black/50 flex flex-col overflow-hidden animate-in">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-800/80 border-b border-zinc-700/50">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm">
                🤖
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-zinc-800" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white">RailsKit Assistant</div>
              <div className="text-xs text-zinc-400">AI Agent · Built with RailsKit</div>
            </div>
            {hasInteracted && (
              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors"
                title="Reset conversation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-2">
            {messages.map((msg, i) => (
              <div key={i}>
                <ChatBubble
                  message={msg}
                  streaming={streamingIdx === i}
                  displayedText={streamingIdx === i ? streamedText : undefined}
                />
                {/* Show tool call panel right before the message that has it */}
                {msg.role === "agent" && msg.toolCall && streamingIdx !== i && (
                  <ToolCallPanel toolCall={msg.toolCall} />
                )}
              </div>
            ))}

            {/* Active tool call (while running) */}
            {activeToolCall && <ToolCallPanel toolCall={activeToolCall} />}

            {/* Typing indicator */}
            {isTyping && <TypingIndicator />}

            {/* Quick replies */}
            {showQuickReplies && !isTyping && streamingIdx === null && (
              <div className="px-4 pt-2 flex flex-wrap gap-2">
                {QUICK_REPLIES.map((qr) => (
                  <button
                    key={qr.path}
                    onClick={() => handleQuickReply(qr.path, qr.label)}
                    className="px-3 py-1.5 text-xs rounded-full border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 hover:border-indigo-500/50 transition-colors"
                  >
                    {qr.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-zinc-700/50 bg-zinc-800/30">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700/50 text-zinc-500 text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>Pick a question above to try the demo</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
