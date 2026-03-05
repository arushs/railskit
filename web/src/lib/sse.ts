import type { AgentEvent, ToolDefinition } from "../types/agent";

const API_URL = import.meta.env.VITE_API_URL || "";

/**
 * SSE fallback for streaming agent responses when ActionCable isn't available.
 * Uses POST + EventSource-like fetch streaming.
 *
 * Returns an AbortController to cancel the stream.
 */
export function streamViaSSE(
  conversationId: number,
  content: string,
  tools: ToolDefinition[] | undefined,
  onEvent: (event: AgentEvent) => void,
  onError: (error: string) => void,
  onClose: () => void
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch(`${API_URL}/api/agent/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          content,
          tools,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.text();
        onError(`SSE request failed: ${response.status} ${err}`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError("No response body");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEventType = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEventType = line.slice(7).trim();
          } else if (line.startsWith("data: ") && currentEventType) {
            try {
              const data = JSON.parse(line.slice(6));
              onEvent({ type: currentEventType, data } as AgentEvent);
            } catch {
              // Skip malformed JSON
            }
            currentEventType = "";
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        onError((err as Error).message);
      }
    } finally {
      onClose();
    }
  })();

  return controller;
}
