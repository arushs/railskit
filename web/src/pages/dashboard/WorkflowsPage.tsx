import { useState } from "react";
import { WorkflowRunViewer } from "@/components/workflows";
import { mockWorkflowRuns } from "@/lib/mock-workflows";
import type { WorkflowStatus } from "@/types/workflow";

const statusFilters: { value: WorkflowStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "running", label: "Running" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

export default function WorkflowsPage() {
  const [filter, setFilter] = useState<WorkflowStatus | "all">("all");

  const filtered =
    filter === "all"
      ? mockWorkflowRuns
      : mockWorkflowRuns.filter((w) => w.status === filter);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Workflow Runs</h1>
        <p className="text-zinc-400 mt-1">
          Multi-agent workflow execution history and live monitoring.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {statusFilters.map((sf) => (
          <button
            key={sf.value}
            onClick={() => setFilter(sf.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === sf.value
                ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            {sf.label}
            {sf.value !== "all" && (
              <span className="ml-1.5 text-zinc-600">
                {mockWorkflowRuns.filter((w) => w.status === sf.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Workflow list */}
      <div className="space-y-6">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
            <p className="text-zinc-500">No workflows match this filter.</p>
          </div>
        ) : (
          filtered.map((wf) => <WorkflowRunViewer key={wf.id} workflow={wf} />)
        )}
      </div>
    </div>
  );
}
