// Mock data for agent dashboard

export interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: Date;
  model?: string;
  tokens?: { input: number; output: number };
  cost?: number;
  toolName?: string;
  duration?: number;
}

export interface Conversation {
  id: string;
  title: string;
  agent: string;
  status: "active" | "completed" | "error";
  startedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  totalCost: number;
  totalTokens: number;
  model: string;
  messages: Message[];
  tags: string[];
}

export interface CostEntry {
  date: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  requests: number;
}

export interface ToolUsageEntry {
  name: string;
  calls: number;
  avgDuration: number;
  successRate: number;
  lastUsed: Date;
}

export interface ModelUsage {
  model: string;
  provider: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  avgLatency: number;
}

const now = new Date();
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000);

const MODELS = [
  { model: "claude-opus-4", provider: "Anthropic" },
  { model: "claude-sonnet-4", provider: "Anthropic" },
  { model: "gpt-4o", provider: "OpenAI" },
  { model: "gemini-2.5-pro", provider: "Google" },
  { model: "claude-haiku-3.5", provider: "Anthropic" },
];

function makeMessages(count: number, model: string): Message[] {
  const messages: Message[] = [];
  const snippets = [
    "Can you help me refactor the authentication module?",
    "I'll analyze the codebase structure first. Let me check the auth directory.",
    "Found 3 files that need updating: auth.ts, middleware.ts, and session.ts.",
    "What about the token refresh logic?",
    "The token refresh uses a sliding window approach. I'll update it to use rotating refresh tokens for better security.",
    "I've made the changes. Here's a summary of what was updated...",
    "Looks good! Can you also add rate limiting?",
    "I'll add rate limiting using a token bucket algorithm. Checking the existing middleware...",
    "Done. Rate limiting is now configured at 100 requests per minute per user.",
    "Perfect, let's deploy this to staging.",
  ];
  const toolNames = ["read_file", "write_file", "exec", "web_search", "browser"];

  for (let i = 0; i < count; i++) {
    const isUser = i % 3 === 0;
    const isTool = !isUser && i % 5 === 0;
    messages.push({
      id: `msg-${i}`,
      role: isTool ? "tool" : isUser ? "user" : "assistant",
      content: snippets[i % snippets.length],
      timestamp: ago(count - i),
      model: isUser ? undefined : model,
      tokens: isUser ? undefined : { input: 200 + Math.floor(Math.random() * 800), output: 100 + Math.floor(Math.random() * 400) },
      cost: isUser ? undefined : 0.001 + Math.random() * 0.05,
      toolName: isTool ? toolNames[Math.floor(Math.random() * toolNames.length)] : undefined,
      duration: isTool ? 200 + Math.floor(Math.random() * 3000) : undefined,
    });
  }
  return messages;
}

export const conversations: Conversation[] = [
  {
    id: "conv-1",
    title: "Auth module refactor",
    agent: "Jarvis ⚙️",
    status: "completed",
    startedAt: ago(120),
    lastMessageAt: ago(45),
    messageCount: 24,
    totalCost: 0.847,
    totalTokens: 45200,
    model: "claude-opus-4",
    messages: makeMessages(24, "claude-opus-4"),
    tags: ["backend", "security"],
  },
  {
    id: "conv-2",
    title: "Dashboard UI components",
    agent: "Parker 🎨",
    status: "active",
    startedAt: ago(60),
    lastMessageAt: ago(2),
    messageCount: 18,
    totalCost: 0.234,
    totalTokens: 28300,
    model: "claude-sonnet-4",
    messages: makeMessages(18, "claude-sonnet-4"),
    tags: ["frontend", "ui"],
  },
  {
    id: "conv-3",
    title: "API endpoint testing",
    agent: "Shuri 🔬",
    status: "completed",
    startedAt: ago(180),
    lastMessageAt: ago(150),
    messageCount: 12,
    totalCost: 0.156,
    totalTokens: 18900,
    model: "claude-haiku-3.5",
    messages: makeMessages(12, "claude-haiku-3.5"),
    tags: ["qa", "testing"],
  },
  {
    id: "conv-4",
    title: "Database migration planning",
    agent: "Jarvis ⚙️",
    status: "completed",
    startedAt: ago(240),
    lastMessageAt: ago(200),
    messageCount: 32,
    totalCost: 1.23,
    totalTokens: 62100,
    model: "claude-opus-4",
    messages: makeMessages(32, "claude-opus-4"),
    tags: ["backend", "database"],
  },
  {
    id: "conv-5",
    title: "Landing page copy",
    agent: "Loki 📝",
    status: "completed",
    startedAt: ago(300),
    lastMessageAt: ago(270),
    messageCount: 8,
    totalCost: 0.089,
    totalTokens: 12400,
    model: "gpt-4o",
    messages: makeMessages(8, "gpt-4o"),
    tags: ["docs", "content"],
  },
  {
    id: "conv-6",
    title: "Performance optimization",
    agent: "Jarvis ⚙️",
    status: "error",
    startedAt: ago(90),
    lastMessageAt: ago(80),
    messageCount: 15,
    totalCost: 0.445,
    totalTokens: 34200,
    model: "gemini-2.5-pro",
    messages: makeMessages(15, "gemini-2.5-pro"),
    tags: ["backend", "performance"],
  },
  {
    id: "conv-7",
    title: "Mobile responsive fixes",
    agent: "Parker 🎨",
    status: "active",
    startedAt: ago(30),
    lastMessageAt: ago(1),
    messageCount: 6,
    totalCost: 0.067,
    totalTokens: 8200,
    model: "claude-sonnet-4",
    messages: makeMessages(6, "claude-sonnet-4"),
    tags: ["frontend", "mobile"],
  },
  {
    id: "conv-8",
    title: "CI/CD pipeline setup",
    agent: "Friday 🔧",
    status: "completed",
    startedAt: ago(360),
    lastMessageAt: ago(320),
    messageCount: 20,
    totalCost: 0.312,
    totalTokens: 29800,
    model: "claude-sonnet-4",
    messages: makeMessages(20, "claude-sonnet-4"),
    tags: ["devops", "ci"],
  },
];

export const costHistory: CostEntry[] = (() => {
  const entries: CostEntry[] = [];
  for (let d = 6; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split("T")[0];

    for (const m of MODELS) {
      const reqs = 5 + Math.floor(Math.random() * 30);
      const inputTok = reqs * (500 + Math.floor(Math.random() * 2000));
      const outputTok = reqs * (200 + Math.floor(Math.random() * 1000));
      const costPerInput = m.model.includes("opus") ? 0.015 : m.model.includes("sonnet") ? 0.003 : m.model.includes("haiku") ? 0.00025 : m.model.includes("gpt") ? 0.005 : 0.00125;
      const costPerOutput = costPerInput * 4;
      entries.push({
        date: dateStr,
        model: m.model,
        provider: m.provider,
        inputTokens: inputTok,
        outputTokens: outputTok,
        cost: (inputTok / 1000) * costPerInput + (outputTok / 1000) * costPerOutput,
        requests: reqs,
      });
    }
  }
  return entries;
})();

export const toolUsage: ToolUsageEntry[] = [
  { name: "read", calls: 342, avgDuration: 45, successRate: 99.7, lastUsed: ago(2) },
  { name: "write", calls: 189, avgDuration: 62, successRate: 98.4, lastUsed: ago(5) },
  { name: "exec", calls: 267, avgDuration: 1240, successRate: 94.0, lastUsed: ago(1) },
  { name: "edit", calls: 156, avgDuration: 38, successRate: 99.4, lastUsed: ago(3) },
  { name: "web_search", calls: 84, avgDuration: 890, successRate: 96.4, lastUsed: ago(15) },
  { name: "web_fetch", calls: 63, avgDuration: 1450, successRate: 91.3, lastUsed: ago(20) },
  { name: "browser", calls: 47, avgDuration: 2300, successRate: 87.2, lastUsed: ago(30) },
  { name: "message", calls: 112, avgDuration: 180, successRate: 99.1, lastUsed: ago(8) },
  { name: "image", calls: 28, avgDuration: 560, successRate: 96.4, lastUsed: ago(60) },
  { name: "tts", calls: 15, avgDuration: 1100, successRate: 100, lastUsed: ago(120) },
];

export const modelUsage: ModelUsage[] = MODELS.map((m) => {
  const reqs = 20 + Math.floor(Math.random() * 100);
  const inputTok = reqs * (800 + Math.floor(Math.random() * 3000));
  const outputTok = reqs * (300 + Math.floor(Math.random() * 1500));
  const costPerInput = m.model.includes("opus") ? 0.015 : m.model.includes("sonnet") ? 0.003 : m.model.includes("haiku") ? 0.00025 : m.model.includes("gpt") ? 0.005 : 0.00125;
  return {
    model: m.model,
    provider: m.provider,
    requests: reqs,
    inputTokens: inputTok,
    outputTokens: outputTok,
    totalCost: (inputTok / 1000) * costPerInput + (outputTok / 1000) * (costPerInput * 4),
    avgLatency: 500 + Math.floor(Math.random() * 3000),
  };
});

// Aggregate helpers
export function getTotalCost(): number {
  return conversations.reduce((sum, c) => sum + c.totalCost, 0);
}

export function getTotalTokens(): number {
  return conversations.reduce((sum, c) => sum + c.totalTokens, 0);
}

export function getTotalConversations(): number {
  return conversations.length;
}

export function getActiveConversations(): number {
  return conversations.filter((c) => c.status === "active").length;
}

export function getCostByProvider(): { provider: string; cost: number }[] {
  const map = new Map<string, number>();
  for (const entry of costHistory) {
    map.set(entry.provider, (map.get(entry.provider) || 0) + entry.cost);
  }
  return Array.from(map, ([provider, cost]) => ({ provider, cost }));
}

export function getDailyCosts(): { date: string; cost: number }[] {
  const map = new Map<string, number>();
  for (const entry of costHistory) {
    map.set(entry.date, (map.get(entry.date) || 0) + entry.cost);
  }
  return Array.from(map, ([date, cost]) => ({ date, cost })).sort((a, b) => a.date.localeCompare(b.date));
}

export function getCostByModel(): { model: string; cost: number }[] {
  const map = new Map<string, number>();
  for (const entry of costHistory) {
    map.set(entry.model, (map.get(entry.model) || 0) + entry.cost);
  }
  return Array.from(map, ([model, cost]) => ({ model, cost })).sort((a, b) => b.cost - a.cost);
}
