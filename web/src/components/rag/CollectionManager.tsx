import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  FileText,
  Layers,
  Clock,
  ChevronRight,
  Plus,
  Trash2,
  RefreshCw,
  Settings2,
  AlertCircle,
} from "lucide-react";
import type { DocumentCollection, Document } from "@/types/rag";

interface CollectionManagerProps {
  collections: DocumentCollection[];
  documents: Document[];
  onSelectCollection?: (collection: DocumentCollection) => void;
  onCreateCollection?: () => void;
  onDeleteCollection?: (id: string) => void;
  onReindexCollection?: (id: string) => void;
  className?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function timeAgo(iso: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(iso).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const statusStyles: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  active: {
    label: "Active",
    color: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  indexing: {
    label: "Indexing",
    color: "text-amber-400",
    dot: "bg-amber-400 animate-pulse",
  },
  error: {
    label: "Error",
    color: "text-red-400",
    dot: "bg-red-400",
  },
};

const docStatusStyles: Record<
  string,
  { label: string; color: string }
> = {
  pending: { label: "Pending", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  processing: { label: "Processing", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  indexed: { label: "Indexed", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  error: { label: "Error", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const chunkStrategyLabels: Record<string, string> = {
  fixed: "Fixed-size",
  semantic: "Semantic",
  recursive: "Recursive",
};

export default function CollectionManager({
  collections,
  documents,
  onSelectCollection,
  onCreateCollection,
  onDeleteCollection,
  onReindexCollection,
  className,
}: CollectionManagerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getCollectionDocs = (collectionId: string) =>
    documents.filter((d) => d.collectionId === collectionId);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Collections
          </h3>
          <p className="text-xs text-zinc-400">
            {collections.length} collection{collections.length !== 1 ? "s" : ""}{" "}
            ·{" "}
            {collections.reduce((s, c) => s + c.documentCount, 0)} documents
            ·{" "}
            {formatSize(collections.reduce((s, c) => s + c.totalSize, 0))} total
          </p>
        </div>
        {onCreateCollection && (
          <Button size="sm" onClick={onCreateCollection}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Collection
          </Button>
        )}
      </div>

      {/* Collection cards */}
      <div className="space-y-3">
        {collections.map((col) => {
          const isExpanded = expandedId === col.id;
          const colDocs = getCollectionDocs(col.id);
          const { label, color, dot } = statusStyles[col.status] ?? statusStyles.active;

          return (
            <Card
              key={col.id}
              className="dark:bg-zinc-900/50 bg-white overflow-hidden"
            >
              <CardContent className="p-0">
                {/* Collection header */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : col.id)
                  }
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <div className="shrink-0 rounded-lg bg-indigo-500/10 p-2.5">
                    <Database className="h-5 w-5 text-indigo-400" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-zinc-900 dark:text-white truncate">
                        {col.name}
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <div className={cn("h-1.5 w-1.5 rounded-full", dot)} />
                        <span className={cn("text-[10px] font-medium", color)}>
                          {label}
                        </span>
                      </div>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {col.description}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-[10px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {col.documentCount} docs
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {col.totalChunks.toLocaleString()} chunks
                      </span>
                      <span>{formatSize(col.totalSize)}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo(col.updatedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="text-[10px] dark:bg-zinc-800 dark:text-zinc-400"
                    >
                      {chunkStrategyLabels[col.chunkStrategy] ?? col.chunkStrategy}
                    </Badge>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 text-zinc-400 transition-transform",
                        isExpanded && "rotate-90"
                      )}
                    />
                  </div>
                </button>

                {/* Expanded: document list + actions */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800">
                    {/* Actions bar */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50/50 dark:bg-zinc-800/20">
                      <Badge
                        variant="outline"
                        className="text-[10px] dark:border-zinc-700 dark:text-zinc-400"
                      >
                        {col.embeddingModel}
                      </Badge>
                      <div className="ml-auto flex items-center gap-1">
                        {onSelectCollection && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onSelectCollection(col)}
                          >
                            <Settings2 className="mr-1 h-3 w-3" />
                            Configure
                          </Button>
                        )}
                        {onReindexCollection && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onReindexCollection(col.id)}
                          >
                            <RefreshCw className="mr-1 h-3 w-3" />
                            Reindex
                          </Button>
                        )}
                        {onDeleteCollection && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-red-400 hover:text-red-300"
                            onClick={() => onDeleteCollection(col.id)}
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="px-4 py-2 space-y-1">
                      {colDocs.length > 0 ? (
                        colDocs.map((doc) => {
                          const ds = docStatusStyles[doc.status] ?? docStatusStyles.pending;
                          return (
                            <div
                              key={doc.id}
                              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                    {doc.filename}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={cn("text-[10px]", ds.color)}
                                  >
                                    {ds.label}
                                  </Badge>
                                </div>
                                {doc.status === "processing" && (
                                  <div className="mt-1 h-1 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-amber-400 transition-all"
                                      style={{ width: `${doc.progress}%` }}
                                    />
                                  </div>
                                )}
                                {doc.status === "error" && doc.errorMessage && (
                                  <p className="mt-1 flex items-center gap-1 text-[10px] text-red-400">
                                    <AlertCircle className="h-2.5 w-2.5" />
                                    {doc.errorMessage}
                                  </p>
                                )}
                              </div>
                              <div className="shrink-0 text-right text-[10px] text-zinc-400">
                                <p>{formatSize(doc.size)}</p>
                                <p>
                                  {doc.chunkCount > 0
                                    ? `${doc.chunkCount} chunks`
                                    : "—"}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="py-4 text-center text-xs text-zinc-400">
                          No documents yet — upload files to get started
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
