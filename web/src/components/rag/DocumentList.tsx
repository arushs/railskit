import { FileText, Trash2, RefreshCw, Eye, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Document, DocumentStatus } from "@/types/rag";

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; variant: "default" | "success" | "warning" | "destructive" }
> = {
  pending: { label: "Pending", variant: "default" },
  processing: { label: "Processing", variant: "warning" },
  ready: { label: "Ready", variant: "success" },
  error: { label: "Error", variant: "destructive" },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocumentListProps {
  documents: Document[];
  loading?: boolean;
  onDelete?: (id: number) => void;
  onReprocess?: (id: number) => void;
  onViewChunks?: (id: number) => void;
}

export function DocumentList({
  documents,
  loading,
  onDelete,
  onReprocess,
  onViewChunks,
}: DocumentListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-10 w-10 text-zinc-600 mb-3" />
        <p className="text-sm text-zinc-400">No documents yet</p>
        <p className="text-xs text-zinc-500 mt-1">
          Upload files to start building your knowledge base
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800">
      {documents.map((doc) => {
        const status = STATUS_CONFIG[doc.status];
        return (
          <div
            key={doc.id}
            className="flex items-center gap-4 py-3 px-1 group"
          >
            <FileText className="h-5 w-5 shrink-0 text-zinc-500" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-zinc-200 truncate">
                  {doc.name}
                </p>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {doc.file_type.toUpperCase()} · {formatFileSize(doc.file_size)}
                {doc.chunks_count > 0 && ` · ${doc.chunks_count} chunks`}
                {doc.error_message && (
                  <span className="text-red-400 ml-2">{doc.error_message}</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onViewChunks && doc.status === "ready" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewChunks(doc.id)}
                  title="View chunks"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {onReprocess && (doc.status === "error" || doc.status === "ready") && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onReprocess(doc.id)}
                  title="Reprocess"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(doc.id)}
                  title="Delete"
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
