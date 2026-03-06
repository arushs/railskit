import { useState, useRef, useCallback } from "react";
import type { RagDocument, UploadStatus, Collection } from "@/types/rag";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface DocumentUploaderProps {
  collections: Collection[];
  selectedCollectionId: string;
  onUpload?: (files: File[]) => void;
  existingDocuments?: RagDocument[];
  className?: string;
}

interface PendingFile {
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
}

const acceptedTypes = [".pdf", ".txt", ".md", ".csv", ".html", ".docx"];

const fileIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  csv: FileSpreadsheet,
  default: File,
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const statusBadge: Record<UploadStatus, { label: string; variant: string; icon: typeof Loader2 | null }> = {
  idle: { label: "Pending", variant: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400", icon: null },
  uploading: { label: "Uploading", variant: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", icon: Loader2 },
  processing: { label: "Processing", variant: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", icon: Loader2 },
  chunking: { label: "Chunking", variant: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300", icon: Loader2 },
  embedding: { label: "Embedding", variant: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300", icon: Loader2 },
  ready: { label: "Ready", variant: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: CheckCircle2 },
  error: { label: "Error", variant: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300", icon: AlertCircle },
};

export function DocumentUploader({
  collections,
  selectedCollectionId,
  onUpload,
  existingDocuments = [],
  className,
}: DocumentUploaderProps) {
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const simulateUpload = useCallback((_file: File, index: number) => {
    const stages: UploadStatus[] = ["uploading", "processing", "chunking", "embedding", "ready"];
    let step = 0;

    const advance = () => {
      if (step >= stages.length) return;
      setPending((prev) =>
        prev.map((p, i) =>
          i === index
            ? { ...p, status: stages[step], progress: ((step + 1) / stages.length) * 100 }
            : p
        )
      );
      step++;
      if (step < stages.length) {
        setTimeout(advance, 800 + Math.random() * 1200);
      }
    };

    setTimeout(advance, 300);
  }, []);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const newPending: PendingFile[] = fileArray.map((f) => ({
        file: f,
        status: "idle" as UploadStatus,
        progress: 0,
      }));

      setPending((prev) => {
        const startIdx = prev.length;
        newPending.forEach((_, i) => simulateUpload(fileArray[i], startIdx + i));
        return [...prev, ...newPending];
      });

      onUpload?.(fileArray);
    },
    [onUpload, simulateUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removePending = (index: number) => {
    setPending((prev) => prev.filter((_, i) => i !== index));
  };

  const collection = collections.find((c) => c.id === selectedCollectionId);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200",
          isDragging
            ? "border-indigo-400 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/20"
            : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
        <Upload
          className={cn(
            "mx-auto h-8 w-8 mb-3",
            isDragging
              ? "text-indigo-500 dark:text-indigo-400"
              : "text-zinc-400 dark:text-zinc-500"
          )}
        />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Drop files here or click to browse
        </p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          PDF, TXT, MD, CSV, HTML, DOCX — up to 10MB each
        </p>
        {collection && (
          <p className="mt-2 text-xs text-indigo-500 dark:text-indigo-400">
            → {collection.name}
          </p>
        )}
      </div>

      {/* Pending uploads */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Uploads
          </h4>
          {pending.map((item, i) => {
            const ext = item.file.name.split(".").pop() || "";
            const Icon = fileIcons[ext] || fileIcons.default;
            const badge = statusBadge[item.status];
            const BadgeIcon = badge.icon;

            return (
              <div
                key={`${item.file.name}-${i}`}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 bg-white dark:bg-zinc-900/50"
              >
                <Icon className="h-5 w-5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {item.file.name}
                    </span>
                    <Badge className={cn("text-[10px] shrink-0 gap-1", badge.variant)}>
                      {BadgeIcon && <BadgeIcon className="h-3 w-3 animate-spin" />}
                      {badge.label}
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-500 ease-out"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-400 shrink-0">
                      {formatBytes(item.file.size)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePending(i);
                  }}
                  className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors shrink-0"
                  aria-label={`Remove ${item.file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Existing documents */}
      {existingDocuments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Documents in collection
          </h4>
          {existingDocuments
            .filter((d) => d.collection_id === selectedCollectionId)
            .map((doc) => {
              const Icon = fileIcons[doc.type] || fileIcons.default;
              const badge = statusBadge[doc.status];
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 bg-white dark:bg-zinc-900/50"
                >
                  <Icon className="h-5 w-5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {doc.name}
                      </span>
                      <Badge className={cn("text-[10px] shrink-0 gap-1", badge.variant)}>
                        {BadgeIcon && (
                          <BadgeIcon
                            className={cn("h-3 w-3", doc.status !== "ready" && doc.status !== "error" && "animate-spin")}
                          />
                        )}
                        {badge.label}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                      {formatBytes(doc.size_bytes)}
                      {doc.chunk_count > 0 && ` · ${doc.chunk_count} chunks`}
                    </p>
                    {doc.error && (
                      <p className="mt-1 text-xs text-red-500">{doc.error}</p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
