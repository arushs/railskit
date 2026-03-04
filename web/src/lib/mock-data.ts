import type { Agent, Conversation, Message, CostSummary, ToolUsageSummary } from "./agents-api";

export const mockAgents: Agent[] = [
  { id: "1", name: "Parker", emoji: "🎨", role: "Frontend Developer", status: "online" },
  { id: "2", name: "Jarvis", emoji: "⚙️", role: "Backend Developer", status: "online" },
  { id: "3", name: "Shuri", emoji: "🔬", role: "QA Engineer", status: "idle" },
  { id: "4", name: "Loki", emoji: "📝", role: "Technical Writer", status: "offline" },
  { id: "5", name: "Friday", emoji: "🤖", role: "PM Agent", status: "online" },
];

export const mockConversations: Conversation[] = [
  { id: "conv-1", agentId: "1", agentName: "Parker", agentEmoji: "🎨", title: "Agent Dashboard UI Implementation", preview: "Building the conversation list with search and filtering...", messageCount: 47, totalCost: 0.82, createdAt: "2026-03-04T10:00:00Z", updatedAt: "2026-03-04T10:55:00Z" },
  { id: "conv-2", agentId: "2", agentName: "Jarvis", agentEmoji: "⚙️", title: "API Endpoint Design for Agent Metrics", preview: "Setting up the /api/agents/costs endpoint with proper aggregation...", messageCount: 32, totalCost: 1.24, createdAt: "2026-03-04T09:15:00Z", updatedAt: "2026-03-04T10:30:00Z" },
  { id: "conv-3", agentId: "3", agentName: "Shuri", agentEmoji: "🔬", title: "Visual QA Review Landing Page", preview: "Running lighthouse and checking mobile breakpoints...", messageCount: 18, totalCost: 0.35, createdAt: "2026-03-03T16:00:00Z", updatedAt: "2026-03-03T17:20:00Z" },
  { id: "conv-4", agentId: "5", agentName: "Friday", agentEmoji: "🤖", title: "Sprint Planning Week 10", preview: "Prioritizing backlog items and assigning to agents...", messageCount: 24, totalCost: 0.56, createdAt: "2026-03-03T09:00:00Z", updatedAt: "2026-03-03T10:45:00Z" },
  { id: "conv-5", agentId: "4", agentName: "Loki", agentEmoji: "📝", title: "README and API Documentation Update", preview: "Documenting the new agent dashboard API endpoints...", messageCount: 12, totalCost: 0.18, createdAt: "2026-03-02T14:00:00Z", updatedAt: "2026-03-02T15:30:00Z" },
];

export const mockMessages: Message[] = [
  { id: "msg-1", conversationId: "conv-1", role: "user", content: "Build the agent dashboard UI with conversation list, cost tracking, and tool usage views.", createdAt: "2026-03-04T10:00:00Z" },
  { id: "msg-2", conversationId: "conv-1", role: "assistant", content: "Starting with the typed API client and dashboard layout. Setting up routing first.", model: "claude-opus-4", provider: "anthropic", tokenUsage: { "prompt": 245, "completion": 180 }, cost: 0.023, createdAt: "2026-03-04T10:00:15Z" },
  { id: "msg-3", conversationId: "conv-1", role: "assistant", content: "Created agents-api.ts with full type definitions for Agent, Conversation, Message, CostBreakdown, and ToolUsageStat.", model: "claude-opus-4", provider: "anthropic", toolName: "write", tokenUsage: { "prompt": 890, "completion": 420 }, cost: 0.065, createdAt: "2026-03-04T10:02:30Z" },
  { id: "msg-4", conversationId: "conv-1", role: "tool", content: "Successfully wrote 4123 bytes to agents-api.ts", toolName: "write", createdAt: "2026-03-04T10:02:31Z" },
  { id: "msg-5", conversationId: "conv-1", role: "assistant", content: "Building the dashboard layout with navigation. Using the existing dark theme with zinc/indigo palette.", model: "claude-opus-4", provider: "anthropic", tokenUsage: { "prompt": 1200, "completion": 680 }, cost: 0.094, createdAt: "2026-03-04T10:05:00Z" },
];

export const mockCostSummary: CostSummary = {
  totalCost: 47.82, totalTokens: 2_450_000, totalRequests: 1_247,
  breakdown: [
    { model: "claude-opus-4", provider: "anthropic", promptTokens: 980_000, completionTokens: 420_000, totalTokens: 1_400_000, cost: 28.50, requestCount: 485 },
    { model: "claude-sonnet-4", provider: "anthropic", promptTokens: 350_000, completionTokens: 180_000, totalTokens: 530_000, cost: 8.20, requestCount: 312 },
    { model: "gpt-4o", provider: "openai", promptTokens: 220_000, completionTokens: 110_000, totalTokens: 330_000, cost: 6.12, requestCount: 250 },
    { model: "gpt-4o-mini", provider: "openai", promptTokens: 120_000, completionTokens: 70_000, totalTokens: 190_000, cost: 1.80, requestCount: 200 },
  ],
  dailyCosts: [
    { date: "2026-02-26", cost: 5.20 }, { date: "2026-02-27", cost: 7.80 }, { date: "2026-02-28", cost: 6.40 },
    { date: "2026-03-01", cost: 8.92 }, { date: "2026-03-02", cost: 4.50 }, { date: "2026-03-03", cost: 9.10 }, { date: "2026-03-04", cost: 5.90 },
  ],
};

export const mockToolUsage: ToolUsageSummary = {
  totalCalls: 3_842, uniqueTools: 12,
  stats: [
    { toolName: "read", callCount: 1240, avgDurationMs: 45, successRate: 0.99, lastUsed: "2026-03-04T10:55:00Z" },
    { toolName: "write", callCount: 680, avgDurationMs: 62, successRate: 0.97, lastUsed: "2026-03-04T10:54:00Z" },
    { toolName: "exec", callCount: 520, avgDurationMs: 2300, successRate: 0.91, lastUsed: "2026-03-04T10:53:00Z" },
    { toolName: "edit", callCount: 410, avgDurationMs: 55, successRate: 0.95, lastUsed: "2026-03-04T10:50:00Z" },
    { toolName: "web_search", callCount: 320, avgDurationMs: 1800, successRate: 0.94, lastUsed: "2026-03-04T10:45:00Z" },
    { toolName: "web_fetch", callCount: 280, avgDurationMs: 2100, successRate: 0.88, lastUsed: "2026-03-04T10:40:00Z" },
    { toolName: "browser", callCount: 180, avgDurationMs: 4500, successRate: 0.85, lastUsed: "2026-03-04T10:30:00Z" },
    { toolName: "image", callCount: 92, avgDurationMs: 3200, successRate: 0.96, lastUsed: "2026-03-04T09:20:00Z" },
    { toolName: "message", callCount: 65, avgDurationMs: 320, successRate: 0.98, lastUsed: "2026-03-04T10:52:00Z" },
    { toolName: "tts", callCount: 30, avgDurationMs: 1500, successRate: 0.93, lastUsed: "2026-03-03T16:00:00Z" },
    { toolName: "pdf", callCount: 15, avgDurationMs: 5600, successRate: 0.87, lastUsed: "2026-03-02T14:00:00Z" },
    { toolName: "voice_call", callCount: 10, avgDurationMs: 8200, successRate: 0.90, lastUsed: "2026-03-01T11:00:00Z" },
  ],
};
