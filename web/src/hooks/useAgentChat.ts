import { useState, useCallback, useRef, useEffect } from "react";
import { getConsumer } from "../lib/cable";
import { streamViaSSE } from "../lib/sse";
import type {
  Message,
  ToolCall,
  ToolDefinition,
  AgentEvent,
  ConnectionStatus,
  UseAgentChatReturn,
} from "../types/agent";
import type { Subscription } from "@rails/actioncable";

interface UseAgentChatOptions {
  /** The conversation ID to connect to */
  conversationId: number;
  /** JWT token for ActionCable auth */
  token?: string;
  /** Tool definitions to send with each message */
  tools?: ToolDefinition[];
  /** Initial messages (e.g., loaded from API) */
  initialMessages?: Message[];
  /** Use SSE instead of ActionCable (fallback mode) */
  forceSSE?: boolean;
  /** Called when a complete message is received */
  onMessage?: (message: Message) => void;
  /** Called when a tool call is received */
  onToolCall?: (toolCall: ToolCall) => void;
  /** Called on error */
  onError?: (error: string) => void;
  /** Called when streaming completes */
  onDone?: (finishReason: string) => void;
}

/**
 * useAgentChat — React hook for streaming LLM conversations.
 *
 * Connects to Rails ActionCable (WebSocket) with automatic SSE fallback.
 * Handles streaming chunks, tool calls, thinking, and conversation history.
 *
 * @example
 * ```tsx
 * const { messages, sendMessage, isStreaming, streamingContent } = useAgentChat({
 *   conversationId: 42,
 *   token: user.jwt,
 *   tools: [{ type: "function", function: { name: "search", ... } }],
 *   onToolCall: (tc) => console.log("Tool called:", tc.function.name),
 * });
 *
 * return (
 *   <div>
 *     {messages.map(m => <MessageBubble key={m.id} message={m} />)}
 *     {isStreaming && <StreamingBubble content={streamingContent} />}
 *     <ChatInput onSend={sendMessage} disabled={isStreaming} />
 *   </div>
 * );
 * ```
 */
export function useAgentChat(options: UseAgentChatOptions): UseAgentChatReturn {
  const {
    conversationId,
    token,
    tools,
    initialMessages = [],
    forceSSE = false,
    onMessage,
    onToolCall,
    onError,
    onDone,
  } = options;

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [thinkingContent, setThinkingContent] = useState("");
  const [activeToolCalls, setActiveToolCalls] = useState<ToolCall[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);

  const subscriptionRef = useRef<Subscription | null>(null);
  const sseAbortRef = useRef<AbortController | null>(null);
  const toolCallsAccRef = useRef<Record<number, ToolCall>>({});

  // ── Event Handler ──

  const handleEvent = useCallback(
    (event: AgentEvent) => {
      switch (event.type) {
        case "chunk":
          setStreamingContent((prev) => prev + event.data.content);
          break;

        case "tool_call_chunk": {
          const { index, id, name, arguments_delta } = event.data;
          toolCallsAccRef.current[index] = toolCallsAccRef.current[index] || {
            id: "",
            type: "function" as const,
            function: { name: "", arguments: "" },
          };
          const tc = toolCallsAccRef.current[index];
          if (id) tc.id = id;
          if (name) tc.function.name = name;
          tc.function.arguments += arguments_delta;
          setActiveToolCalls(Object.values(toolCallsAccRef.current));
          break;
        }

        case "tool_call":
          onToolCall?.({
            id: event.data.id,
            type: "function",
            function: { name: event.data.name, arguments: event.data.arguments },
          });
          break;

        case "tool_result":
          setMessages((prev) => [
            ...prev,
            {
              role: "tool" as const,
              content: event.data.content,
              tool_call_id: event.data.tool_call_id,
              name: event.data.name,
              id: event.data.id,
            },
          ]);
          break;

        case "message":
          if (event.data.role === "assistant") {
            // Reset streaming state — the full message replaces the partial
            setStreamingContent("");
            setActiveToolCalls([]);
            toolCallsAccRef.current = {};
          }
          setMessages((prev) => [...prev, event.data]);
          onMessage?.(event.data);
          break;

        case "thinking":
          setThinkingContent((prev) => prev + event.data.content);
          break;

        case "done":
          setIsStreaming(false);
          setStreamingContent("");
          setThinkingContent("");
          setActiveToolCalls([]);
          toolCallsAccRef.current = {};
          onDone?.(event.data.finish_reason);
          break;

        case "error":
          setIsStreaming(false);
          setError(event.data.message);
          onError?.(event.data.message);
          break;
      }
    },
    [onMessage, onToolCall, onError, onDone]
  );

  // ── ActionCable Connection ──

  useEffect(() => {
    if (forceSSE || !conversationId) return;

    setConnectionStatus("connecting");

    try {
      const consumer = getConsumer(token);
      const subscription = consumer.subscriptions.create(
        { channel: "AgentChannel", conversation_id: conversationId },
        {
          connected() {
            setConnectionStatus("connected");
          },
          disconnected() {
            setConnectionStatus("disconnected");
          },
          rejected() {
            setConnectionStatus("error");
            setError("ActionCable connection rejected — check authentication");
          },
          received(data: AgentEvent) {
            handleEvent(data);
          },
        }
      );

      subscriptionRef.current = subscription;

      return () => {
        subscription.unsubscribe();
        subscriptionRef.current = null;
      };
    } catch (err) {
      setConnectionStatus("error");
      setError((err as Error).message);
    }
  }, [conversationId, token, forceSSE, handleEvent]);

  // ── Send Message ──

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || isStreaming) return;

      // Optimistically add user message
      const userMsg: Message = {
        role: "user",
        content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);
      setStreamingContent("");
      setThinkingContent("");
      setActiveToolCalls([]);
      toolCallsAccRef.current = {};
      setError(null);

      if (forceSSE || connectionStatus !== "connected") {
        // SSE fallback
        sseAbortRef.current?.abort();
        sseAbortRef.current = streamViaSSE(
          conversationId,
          content,
          tools,
          handleEvent,
          (err) => {
            setIsStreaming(false);
            setError(err);
            onError?.(err);
          },
          () => {
            // SSE stream closed
          }
        );
      } else {
        // ActionCable
        subscriptionRef.current?.perform("send_message", { content, tools });
      }
    },
    [conversationId, tools, forceSSE, connectionStatus, isStreaming, handleEvent, onError]
  );

  // ── Computed Values ──

  const totalTokens = messages.reduce((sum, m) => sum + (m.token_count || 0), 0);
  const totalCost = messages.reduce((sum, m) => sum + (m.cost_cents || 0), 0);

  // ── Cleanup ──

  useEffect(() => {
    return () => {
      sseAbortRef.current?.abort();
    };
  }, []);

  return {
    messages,
    sendMessage,
    isStreaming,
    streamingContent,
    thinkingContent,
    activeToolCalls,
    connectionStatus,
    error,
    clearError: () => setError(null),
    reset: () => {
      setMessages([]);
      setStreamingContent("");
      setThinkingContent("");
      setActiveToolCalls([]);
      setError(null);
    },
    totalTokens,
    totalCost,
  };
}
