import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { UploadStatus } from "@/types/rag";

interface FileEntry {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
}

interface DocumentUploaderProps {
  collectionId: string;
  collectionName: string;
  onUploadComplete?: (files: File[]) => void;
  className?: string;
  /** Accepted MIME types */
  accept?: string;
  maxSizeMb?: number;
}

const fileIcons: Record<string, typeof FileText> = {
  "application/pdf": FileText,
  "text/markdown": FileText,
  "text/csv": File,
  "text/plain": FileText,
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentUploader({
  collectionId: _collectionId,
  collectionName,
  onUploadComplete,
  className,
  accept = ".pdf,.md,.txt,.csv,.json,.html",
  maxSizeMb = 50,
}: DocumentUploaderProps) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const entries: FileEntry[] = Array.from(newFiles).map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: "idle" as UploadStatus,
        progress: 0,
        error:
          file.size > maxSizeMb * 1024 * 1024
            ? `File exceeds ${maxSizeMb}MB limit`
            : undefined,
      }));
      setFiles((prev) => [...prev, ...entries]);
    },
    [maxSizeMb]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleUpload = useCallback(() => {
    const validFiles = files.filter((f) => !f.error && f.status === "idle");
    if (!validFiles.length) return;

    // Simulate upload for each file
    validFiles.forEach((entry) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === entry.id ? { ...f, status: "uploading", progress: 0 } : f
        )
      );

      // Simulate progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 25 + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id
                ? { ...f, status: "processing", progress: 100 }
                : f
            )
          );
          // Simulate processing
          setTimeout(() => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === entry.id ? { ...f, status: "complete" } : f
              )
            );
          }, 1500 + Math.random() * 2000);
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id ? { ...f, progress: Math.min(progress, 99) } : f
            )
          );
        }
      }, 300);
    });

    onUploadComplete?.(validFiles.map((f) => f.file));
  }, [files, onUploadComplete]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const pendingCount = files.filter(
    (f) => f.status === "idle" && !f.error
  ).length;
  const activeCount = files.filter(
    (f) => f.status === "uploading" || f.status === "processing"
  ).length;

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
          "relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200",
          "flex flex-col items-center justify-center px-6 py-10 text-center",
          isDragging
            ? "border-indigo-400 bg-indigo-500/5 dark:bg-indigo-500/10"
            : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600",
          "dark:bg-zinc-900/30 bg-zinc-50/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <div
          className={cn(
            "rounded-full p-3 mb-3 transition-colors",
            isDragging
              ? "bg-indigo-500/10 text-indigo-400"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
          )}
        >
          <Upload className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Drop files here or click to browse
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          PDF, Markdown, CSV, TXT, JSON, HTML — up to {maxSizeMb}MB each
        </p>
        <Badge
          variant="secondary"
          className="mt-3 text-[10px] dark:bg-zinc-800 dark:text-zinc-400"
        >
          Uploading to: {collectionName}
        </Badge>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <Card className="dark:bg-zinc-900/50 bg-white">
          <CardContent className="p-4 space-y-2">
            {files.map((entry) => {
              const FileIcon =
                fileIcons[entry.file.type] ?? File;
              const isActive =
                entry.status === "uploading" || entry.status === "processing";

              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <FileIcon className="h-4 w-4 shrink-0 text-zinc-400" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {entry.file.name}
                      </p>
                      <span className="shrink-0 text-[10px] text-zinc-400">
                        {formatSize(entry.file.size)}
                      </span>
                    </div>
                    {/* Progress bar */}
                    {isActive && (
                      <div className="mt-1.5 h-1 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            entry.status === "processing"
                              ? "bg-amber-400 animate-pulse"
                              : "bg-indigo-500"
                          )}
                          style={{
                            width: `${entry.progress}%`,
                          }}
                        />
                      </div>
                    )}
                    {entry.error && (
                      <p className="mt-1 text-[10px] text-red-400">
                        {entry.error}
                      </p>
                    )}
                  </div>

                  {/* Status icon */}
                  <div className="shrink-0">
                    {entry.status === "complete" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    )}
                    {entry.error && (
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    )}
                    {isActive && (
                      <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
                    )}
                    {entry.status === "idle" && !entry.error && (
                      <button
                        onClick={() => removeFile(entry.id)}
                        className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <X className="h-3.5 w-3.5 text-zinc-400" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Upload button */}
            {pendingCount > 0 && (
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  onClick={handleUpload}
                  disabled={activeCount > 0}
                  className="w-full"
                  size="sm"
                >
                  {activeCount > 0 ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Processing {activeCount} file
                      {activeCount > 1 ? "s" : ""}…
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-3.5 w-3.5" />
                      Upload {pendingCount} file{pendingCount > 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
