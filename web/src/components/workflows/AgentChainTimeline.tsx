import { useState } from "react";
import type { WorkflowStep, Handoff, StepStatus } from "@/types/workflow";
import { HandoffIndicator } from "./HandoffIndicator";
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  SkipForward,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  Wrench,
} from "lucide-react";

interface AgentChainTimelineProps {
  steps: WorkflowStep[];
  handoffs: Handoff[];
}

const statusConfig: Record<StepStatus, { icon: typeof Circle; color: string; label: string }> = {
  pending: { icon: Circle, color: "text-zinc-500", label: "Pending" },
  running: { icon: Loader2, color: "text-blue-400", label: "Running" },
  completed: { icon: CheckCircle2, color: "text-emerald-400", label: "Completed" },
  failed: { icon: XCircle, color: "text-red-400", label: "Failed" },
  skipped: { icon: SkipForward, color: "text-zinc-600", label: "Skipped" },
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function formatCost(cost: number): string {
  return cost < 0.01 ? "<$0.01" : `$${cost.toFixed(2)}`;
}

export function AgentChainTimeline({ steps, handoffs }: AgentChainTimelineProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const getHandoffAfterStep = (stepIndex: number): Handoff | undefined => {
    const step = steps[stepIndex];
    const nextStep = steps[stepIndex + 1];
    if (!step || !nextStep) return undefined;
    return handoffs.find(
      (h) => h.fromAgentId === step.agentId && h.toAgentId === nextStep.agentId,
    );
  };

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const config = statusConfig[step.status];
        const StatusIcon = config.icon;
        const isExpanded = expandedStep === step.id;
        const handoff = getHandoffAfterStep(i);
        const isLast = i === steps.length - 1;

        return (
          <div key={step.id}>
            {/* Step */}
            <div className="relative flex gap-4">
              {/* Timeline track */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    step.status === "running"
                      ? "border-blue-500/50 bg-blue-500/10"
                      : step.status === "completed"
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : step.status === "failed"
                          ? "border-red-500/30 bg-red-500/10"
                          : "border-zinc-700 bg-zinc-800"
                  }`}
                >
                  <StatusIcon
                    className={`h-4 w-4 ${config.color} ${step.status === "running" ? "animate-spin" : ""}`}
                  />
                </div>
                {!isLast && (
                  <div
                    className={`w-px flex-1 min-h-[24px] ${
                      step.status === "completed" ? "bg-emerald-500/30" : "bg-zinc-700"
                    }`}
                  />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 pb-6">
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                  className="flex w-full items-start gap-3 text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{step.agentEmoji}</span>
                      <span className="text-sm font-medium text-white">{step.agentName}</span>
                      <span className="text-xs text-zinc-500">•</span>
                      <span className="text-sm text-zinc-400">{step.label}</span>
                    </div>

                    {/* Meta row */}
                    <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                      {step.durationMs != null && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(step.durationMs)}
                        </span>
                      )}
                      {step.model && (
                        <span className="flex items-center gap-1">
                          <Cpu className="h-3 w-3" />
                          {step.model}
                        </span>
                      )}
                      {step.toolCalls && step.toolCalls.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Wrench className="h-3 w-3" />
                          {step.toolCalls.length} tool{step.toolCalls.length !== 1 ? "s" : ""}
                        </span>
                      )}
                      {step.cost != null && (
                        <span>{formatCost(step.cost)}</span>
                      )}
                    </div>

                    {/* Error */}
                    {step.error && (
                      <p className="mt-1.5 text-xs text-red-400 bg-red-500/10 rounded px-2 py-1 inline-block">
                        {step.error}
                      </p>
                    )}
                  </div>

                  {/* Expand toggle */}
                  {(step.input || step.output || (step.toolCalls && step.toolCalls.length > 0)) && (
                    <div className="mt-0.5 text-zinc-600 group-hover:text-zinc-400 transition-colors">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  )}
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-3 space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-sm">
                    {step.input && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500 mb-1">Input</p>
                        <p className="text-zinc-300 whitespace-pre-wrap">{step.input}</p>
                      </div>
                    )}
                    {step.output && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500 mb-1">Output</p>
                        <p className="text-zinc-300 whitespace-pre-wrap">{step.output}</p>
                      </div>
                    )}
                    {step.toolCalls && step.toolCalls.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500 mb-2">Tool Calls</p>
                        <div className="space-y-1.5">
                          {step.toolCalls.map((tc) => (
                            <div
                              key={tc.id}
                              className="flex items-center gap-2 rounded bg-zinc-800/50 px-3 py-1.5"
                            >
                              {tc.status === "completed" ? (
                                <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                              ) : tc.status === "running" ? (
                                <Loader2 className="h-3 w-3 text-blue-400 animate-spin shrink-0" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-400 shrink-0" />
                              )}
                              <code className="text-xs text-indigo-300">{tc.name}</code>
                              {tc.durationMs != null && (
                                <span className="text-xs text-zinc-600">{formatDuration(tc.durationMs)}</span>
                              )}
                              {tc.result && (
                                <span className="ml-auto text-xs text-zinc-500 truncate max-w-[200px]">
                                  {tc.result}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {step.tokenUsage && (
                      <div className="flex items-center gap-4 text-xs text-zinc-600 pt-1 border-t border-zinc-800">
                        <span>{step.tokenUsage.prompt.toLocaleString()} prompt tokens</span>
                        <span>{step.tokenUsage.completion.toLocaleString()} completion tokens</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Handoff between steps */}
            {handoff && (
              <div className="ml-12 mb-2">
                <HandoffIndicator handoff={handoff} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
