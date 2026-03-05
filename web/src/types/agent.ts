// ── Agent Chat Types ──

export interface Message {
  id?: number;
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[] | null;
  tool_call_id?: string | null;
  name?: string | null;
  finish_reason?: string | null;
  token_count?: number | null;
  cost_cents?: number | null;
  created_at?: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface Conversation {
  id: number;
  title: string | null;
  model: string;
  provider: string;
  system_prompt?: string | null;
  metadata?: Record<string, unknown>;
  messages?: Message[];
  created_at: string;
  updated_at: string;
}

// ── Streaming Event Types (from ActionCable / SSE) ──

export interface ChunkEvent {
  type: "chunk";
  data: { content: string; index: number };
}

export interface ToolCallChunkEvent {
  type: "tool_call_chunk";
  data: {
    index: number;
    id: string;
    name: string;
    arguments_delta: string;
  };
}

export interface ToolCallEvent {
  type: "tool_call";
  data: { id: string; name: string; arguments: string };
}

export interface ToolResultEvent {
  type: "tool_result";
  data: { id: number; tool_call_id: string; name: string; content: string };
}

export interface MessageEvent {
  type: "message";
  data: Message;
}

export interface ThinkingEvent {
  type: "thinking";
  data: { content: string };
}

export interface DoneEvent {
  type: "done";
  data: {
    finish_reason: string;
    usage?: Record<string, number>;
    round: number;
  };
}

export interface ErrorEvent {
  type: "error";
  data: { message: string };
}

export type AgentEvent =
  | ChunkEvent
  | ToolCallChunkEvent
  | ToolCallEvent
  | ToolResultEvent
  | MessageEvent
  | ThinkingEvent
  | DoneEvent
  | ErrorEvent;

// ── Hook Return Type ──

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface UseAgentChatReturn {
  /** All messages in the conversation */
  messages: Message[];
  /** Send a user message — triggers streaming response */
  sendMessage: (content: string) => void;
  /** Whether the agent is currently streaming a response */
  isStreaming: boolean;
  /** The partial (streaming) content of the current assistant response */
  streamingContent: string;
  /** Current thinking/reasoning content (Anthropic extended thinking) */
  thinkingContent: string;
  /** In-progress tool calls being streamed */
  activeToolCalls: ToolCall[];
  /** WebSocket connection status */
  connectionStatus: ConnectionStatus;
  /** Any error message */
  error: string | null;
  /** Clear error state */
  clearError: () => void;
  /** Reset conversation (clear messages) */
  reset: () => void;
  /** Total tokens used */
  totalTokens: number;
  /** Total cost in cents */
  totalCost: number;
}
