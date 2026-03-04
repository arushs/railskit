import { api } from "./api";

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  status: "online" | "idle" | "offline";
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  model?: string;
  provider?: string;
  toolName?: string;
  tokenUsage?: { prompt: number; completion: number };
  cost?: number;
  createdAt: string;
}

export interface Conversation {
  id: string;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  title: string;
  preview: string;
  messageCount: number;
  totalCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface CostBreakdown {
  model: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  requestCount: number;
}

export interface CostSummary {
  totalCost: number;
  totalTokens: number;
  totalRequests: number;
  breakdown: CostBreakdown[];
  dailyCosts: { date: string; cost: number }[];
}

export interface ToolUsageStat {
  toolName: string;
  callCount: number;
  avgDurationMs: number;
  successRate: number;
  lastUsed: string;
}

export interface ToolUsageSummary {
  totalCalls: number;
  uniqueTools: number;
  stats: ToolUsageStat[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listAgents() {
  return api.get<Agent[]>("/api/agents");
}

export async function listConversations(params?: {
  agentId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.agentId) qs.set("agent_id", params.agentId);
  if (params?.search) qs.set("q", params.search);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("page_size", String(params.pageSize));
  const query = qs.toString();
  return api.get<PaginatedResponse<Conversation>>(
    `/api/agents/conversations${query ? `?${query}` : ""}`,
  );
}

export async function getConversation(id: string) {
  return api.get<Conversation>(`/api/agents/conversations/${id}`);
}

export async function getConversationMessages(
  conversationId: string,
  params?: { page?: number; pageSize?: number },
) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("page_size", String(params.pageSize));
  const query = qs.toString();
  return api.get<PaginatedResponse<Message>>(
    `/api/agents/conversations/${conversationId}/messages${query ? `?${query}` : ""}`,
  );
}

/**
 * @deprecated Use `useAgentStream` hook for ActionCable-based streaming instead.
 */
export function streamConversation(conversationId: string): EventSource {
  const base = import.meta.env.VITE_API_URL || "";
  return new EventSource(
    `${base}/api/agents/conversations/${conversationId}/stream`,
  );
}

/** Initiate a streaming agent chat. Subscribe to AgentChatChannel for tokens. */
export async function startStreamChat(
  agentName: string,
  message: string,
  conversationId?: string,
) {
  return api.post<{ conversation_id: string }>(`/api/agents/${agentName}/stream`, {
    message,
    conversation_id: conversationId,
  });
}

export async function getCostSummary(params?: {
  agentId?: string;
  from?: string;
  to?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.agentId) qs.set("agent_id", params.agentId);
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  const query = qs.toString();
  return api.get<CostSummary>(
    `/api/agents/costs${query ? `?${query}` : ""}`,
  );
}

export async function getToolUsage(params?: {
  agentId?: string;
  from?: string;
  to?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.agentId) qs.set("agent_id", params.agentId);
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  const query = qs.toString();
  return api.get<ToolUsageSummary>(
    `/api/agents/tools${query ? `?${query}` : ""}`,
  );
}
