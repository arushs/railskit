import { useState } from "react";
import type { Collection } from "@/types/rag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  FolderOpen,
  Plus,
  Trash2,
  FileText,
  Layers,
  Calendar,
  Check,
  X,
} from "lucide-react";

interface CollectionManagerProps {
  collections: Collection[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onCreate?: (name: string, description: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function CollectionManager({
  collections,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  className,
}: CollectionManagerProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreate?.(newName.trim(), newDesc.trim());
    setNewName("");
    setNewDesc("");
    setShowCreate(false);
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      onDelete?.(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <Card className={cn("dark:bg-zinc-900/50 bg-white", className)}>
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base text-zinc-900 dark:text-white">
            <FolderOpen className="h-4 w-4 text-indigo-500" />
            Collections
          </CardTitle>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className={cn(
              "rounded-lg p-1.5 transition-colors",
              showCreate
                ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800"
            )}
            aria-label="Create collection"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Create form */}
        {showCreate && (
          <div className="rounded-lg border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-950/20 p-3 space-y-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Collection name"
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              autoFocus
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-md px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="rounded-md bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                Create
              </button>
            </div>
          </div>
        )}

        {/* Collection list */}
        {collections.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              No collections yet
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-2 text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400"
            >
              Create your first collection
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {collections.map((col) => {
              const isSelected = selectedId === col.id;
              const isDeleting = confirmDelete === col.id;

              return (
                <div
                  key={col.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect?.(col.id)}
                  onKeyDown={(e) => e.key === "Enter" && onSelect?.(col.id)}
                  className={cn(
                    "rounded-lg border p-3 transition-all duration-150 cursor-pointer",
                    isSelected
                      ? "border-indigo-300 bg-indigo-50/50 dark:border-indigo-700/50 dark:bg-indigo-950/20 ring-1 ring-indigo-200 dark:ring-indigo-800/50"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {col.name}
                      </h4>
                      {col.description && (
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                          {col.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(col.id);
                      }}
                      className={cn(
                        "rounded p-1 transition-colors shrink-0",
                        isDeleting
                          ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                          : "text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      )}
                      aria-label={isDeleting ? "Confirm delete" : `Delete ${col.name}`}
                    >
                      {isDeleting ? (
                        <X className="h-3.5 w-3.5" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-400 dark:text-zinc-500">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {col.document_count} docs
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      {formatCount(col.total_chunks)} chunks
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(col.updated_at)}
                    </span>
                  </div>

                  <div className="mt-1.5">
                    <Badge className="text-[10px] bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {col.embedding_model}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
