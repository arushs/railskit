// ── Multi-Agent Workflow Types ──

export type WorkflowStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
export type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface WorkflowStep {
  id: string;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  label: string;
  status: StepStatus;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  input?: string;
  output?: string;
  error?: string;
  toolCalls?: WorkflowToolCall[];
  tokenUsage?: { prompt: number; completion: number };
  cost?: number;
  model?: string;
}

export interface WorkflowToolCall {
  id: string;
  name: string;
  status: "running" | "completed" | "failed";
  durationMs?: number;
  result?: string;
}

export interface Handoff {
  id: string;
  fromAgentId: string;
  fromAgentName: string;
  fromAgentEmoji: string;
  toAgentId: string;
  toAgentName: string;
  toAgentEmoji: string;
  reason: string;
  context?: string;
  timestamp: string;
}

export interface WorkflowRun {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  handoffs: Handoff[];
  triggeredBy: string;
  startedAt: string;
  completedAt?: string;
  totalDurationMs?: number;
  totalCost?: number;
  totalTokens?: number;
}
