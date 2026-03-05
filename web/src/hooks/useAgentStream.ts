import { useCallback, useEffect, useRef, useState } from "react";
import { createConsumer, type Subscription } from "@rails/actioncable";

const API_BASE = import.meta.env.VITE_API_URL || "";
const WS_BASE = import.meta.env.VITE_WS_URL || API_BASE.replace(/^http/, "ws");

interface StreamToken {
  type: "stream_start" | "stream_token" | "stream_end" | "stream_error";
  token?: string;
  chat_id?: string;
  message_id?: string;
  model?: string;
  error?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

interface UseAgentStreamOptions {
  /** JWT token for ActionCable auth (passed as query param) */
  token?: string;
  /** Called when streaming starts */
  onStart?: () => void;
  /** Called for each token received */
  onToken?: (token: string, accumulated: string) => void;
  /** Called when streaming completes */
  onComplete?: (
    fullContent: string,
    meta: { model?: string; usage?: StreamToken["usage"] }
  ) => void;
  /** Called on error */
  onError?: (error: string) => void;
}

interface UseAgentStreamReturn {
  /** Send a message to the agent and start streaming */
  sendMessage: (
    agentName: string,
    message: string,
    chatId?: string
  ) => Promise<string | null>;
  /** Whether we're currently streaming a response */
  isStreaming: boolean;
  /** The accumulated content so far during streaming */
  streamContent: string;
  /** Subscribe to a specific chat (auto-called by sendMessage) */
  subscribe: (chatId: string) => void;
  /** Unsubscribe from the current chat */
  unsubscribe: () => void;
}

/**
 * React hook for streaming agent responses via ActionCable.
 *
 * Flow:
 * 1. `sendMessage` POSTs to /api/agents/:name/stream → gets chat_id
 * 2. Subscribes to AgentChatChannel with that chat_id
 * 3. Server enqueues AgentStreamJob which broadcasts tokens via ActionCable
 * 4. Hook receives stream_start → stream_token* → stream_end events
 */
export function useAgentStream(
  options: UseAgentStreamOptions = {}
): UseAgentStreamReturn {
  const { token, onStart, onToken, onComplete, onError } = options;

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");

  const consumerRef = useRef<ReturnType<typeof createConsumer> | null>(null);
  const subscriptionRef = useRef<Subscription | null>(null);
  const contentRef = useRef("");

  // Stable refs for callbacks to avoid re-creating subscriptions
  const onStartRef = useRef(onStart);
  const onTokenRef = useRef(onToken);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  onStartRef.current = onStart;
  onTokenRef.current = onToken;
  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  // Create ActionCable consumer once
  useEffect(() => {
    const wsUrl = token
      ? `${WS_BASE}/cable?token=${encodeURIComponent(token)}`
      : `${WS_BASE}/cable`;

    consumerRef.current = createConsumer(wsUrl);

    return () => {
      consumerRef.current?.disconnect();
      consumerRef.current = null;
    };
  }, [token]);

  const unsubscribe = useCallback(() => {
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;
  }, []);

  const subscribe = useCallback(
    (chatId: string) => {
      // Clean up any existing subscription
      unsubscribe();

      if (!consumerRef.current) return;

      subscriptionRef.current = consumerRef.current.subscriptions.create(
        { channel: "AgentChatChannel", chat_id: chatId },
        {
          received(data: StreamToken) {
            switch (data.type) {
              case "stream_start":
                contentRef.current = "";
                setStreamContent("");
                setIsStreaming(true);
                onStartRef.current?.();
                break;

              case "stream_token":
                if (data.token) {
                  contentRef.current += data.token;
                  setStreamContent(contentRef.current);
                  onTokenRef.current?.(data.token, contentRef.current);
                }
                break;

              case "stream_end":
                setIsStreaming(false);
                onCompleteRef.current?.(contentRef.current, {
                  model: data.model,
                  usage: data.usage,
                });
                break;

              case "stream_error":
                setIsStreaming(false);
                onErrorRef.current?.(data.error || "Unknown error");
                break;
            }
          },

          connected() {
            console.log("[AgentStream] Connected to chat", chatId);
          },

          disconnected() {
            console.log("[AgentStream] Disconnected from chat", chatId);
          },

          rejected() {
            console.error(
              "[AgentStream] Subscription rejected for chat",
              chatId
            );
            onErrorRef.current?.(
              "Connection rejected. Please check your authentication."
            );
          },
        }
      );
    },
    [unsubscribe]
  );

  const sendMessage = useCallback(
    async (
      agentName: string,
      message: string,
      chatId?: string
    ): Promise<string | null> => {
      try {
        const res = await fetch(
          `${API_BASE}/api/agents/${agentName}/stream`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              message,
              chat_id: chatId,
            }),
          }
        );

        if (!res.ok) {
          const err = await res
            .json()
            .catch(() => ({ error: "Request failed" }));
          onErrorRef.current?.(err.error || "Request failed");
          return null;
        }

        const data = await res.json();
        const newChatId = data.chat_id;

        // Subscribe to the chat channel to receive streamed tokens
        subscribe(newChatId);

        return newChatId;
      } catch (err) {
        onErrorRef.current?.(
          err instanceof Error ? err.message : "Network error"
        );
        return null;
      }
    },
    [subscribe]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    sendMessage,
    isStreaming,
    streamContent,
    subscribe,
    unsubscribe,
  };
}
