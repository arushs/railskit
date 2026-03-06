import type { WorkflowRun, WorkflowStatus } from "@/types/workflow";
import { AgentChainTimeline } from "./AgentChainTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  Coins,
  Hash,
  Loader2,
  Play,
  XCircle,
  Ban,
} from "lucide-react";

interface WorkflowRunViewerProps {
  workflow: WorkflowRun;
}

const statusBadge: Record<WorkflowStatus, { variant: "success" | "warning" | "destructive" | "secondary"; label: string; icon: typeof Clock }> = {
  pending: { variant: "secondary", label: "Pending", icon: Clock },
  running: { variant: "warning", label: "Running", icon: Loader2 },
  completed: { variant: "success", label: "Completed", icon: CheckCircle2 },
  failed: { variant: "destructive", label: "Failed", icon: XCircle },
  cancelled: { variant: "secondary", label: "Cancelled", icon: Ban },
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.round((ms % 60000) / 1000);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export function WorkflowRunViewer({ workflow }: WorkflowRunViewerProps) {
  const badge = statusBadge[workflow.status];
  const BadgeIcon = badge.icon;

  const completedSteps = workflow.steps.filter((s) => s.status === "completed").length;
  const totalSteps = workflow.steps.length;
  const uniqueAgents = new Set(workflow.steps.map((s) => s.agentId)).size;

  return (
    <Card className="overflow-hidden">
      {/* Status bar */}
      <div
        className={`h-1 ${
          workflow.status === "completed"
            ? "bg-emerald-500"
            : workflow.status === "running"
              ? "bg-blue-500 animate-pulse"
              : workflow.status === "failed"
                ? "bg-red-500"
                : "bg-zinc-700"
        }`}
      />

      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-lg">{workflow.name}</CardTitle>
            {workflow.description && (
              <p className="mt-1 text-sm text-zinc-400">{workflow.description}</p>
            )}
            <p className="mt-1.5 text-xs text-zinc-500 flex items-center gap-1.5">
              <Play className="h-3 w-3" />
              {workflow.triggeredBy}
            </p>
          </div>

          <Badge variant={badge.variant} className="shrink-0 flex items-center gap-1">
            <BadgeIcon className={`h-3 w-3 ${workflow.status === "running" ? "animate-spin" : ""}`} />
            {badge.label}
          </Badge>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<Hash className="h-3.5 w-3.5 text-zinc-500" />}
            label="Steps"
            value={`${completedSteps}/${totalSteps}`}
          />
          <StatCard
            icon={<Clock className="h-3.5 w-3.5 text-zinc-500" />}
            label="Duration"
            value={workflow.totalDurationMs ? formatDuration(workflow.totalDurationMs) : "—"}
          />
          <StatCard
            icon={<Coins className="h-3.5 w-3.5 text-zinc-500" />}
            label="Cost"
            value={workflow.totalCost != null ? `$${workflow.totalCost.toFixed(2)}` : "—"}
          />
          <StatCard
            icon={<span className="text-xs">🤖</span>}
            label="Agents"
            value={String(uniqueAgents)}
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <AgentChainTimeline steps={workflow.steps} handoffs={workflow.handoffs} />
      </CardContent>
    </Card>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-0.5">
        {icon}
        {label}
      </div>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
