import { useState, useCallback, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UploadProgress } from "@/types/rag";

const ACCEPTED_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/html",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ACCEPTED_EXTENSIONS = [".pdf", ".txt", ".md", ".docx", ".html"];

interface DocumentUploaderProps {
  onUpload: (files: File[]) => Promise<unknown>;
  uploads: UploadProgress[];
  isUploading: boolean;
  onClear?: () => void;
}

export function DocumentUploader({
  onUpload,
  uploads,
  isUploading,
  onClear,
}: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const isValidFile = (file: File) => {
    if (ACCEPTED_TYPES.includes(file.type)) return true;
    return ACCEPTED_EXTENSIONS.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );
  };

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter(isValidFile);
      if (files.length > 0) {
        onUpload(files);
      }
    },
    [onUpload]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer",
          isDragging
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/30",
          isUploading && "pointer-events-none opacity-60"
        )}
      >
        <Upload
          className={cn(
            "h-10 w-10 mb-3",
            isDragging ? "text-indigo-400" : "text-zinc-500"
          )}
        />
        <p className="text-sm font-medium text-zinc-300">
          {isDragging ? "Drop files here" : "Drag & drop files, or click to browse"}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          PDF, TXT, MD, DOCX, HTML — up to 50MB each
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS.join(",")}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
          aria-label="Upload documents"
        />
      </div>

      {/* Upload progress list */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-300">
              Uploads ({uploads.filter((u) => u.status === "complete").length}/
              {uploads.length})
            </span>
            {!isUploading && onClear && (
              <Button variant="ghost" size="sm" onClick={onClear}>
                Clear
              </Button>
            )}
          </div>
          {uploads.map((upload, i) => (
            <UploadItem key={`${upload.file.name}-${i}`} upload={upload} />
          ))}
        </div>
      )}
    </div>
  );
}

function UploadItem({ upload }: { upload: UploadProgress }) {
  const StatusIcon = {
    pending: Loader2,
    uploading: Loader2,
    complete: CheckCircle,
    error: AlertCircle,
  }[upload.status];

  const statusColor = {
    pending: "text-zinc-500",
    uploading: "text-indigo-400",
    complete: "text-emerald-400",
    error: "text-red-400",
  }[upload.status];

  return (
    <div className="flex items-center gap-3 rounded-lg bg-zinc-900/50 border border-zinc-800 p-3">
      <FileText className="h-4 w-4 shrink-0 text-zinc-400" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-300 truncate">{upload.file.name}</p>
        {upload.status === "uploading" && (
          <div className="mt-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${upload.progress}%` }}
            />
          </div>
        )}
        {upload.error && (
          <p className="mt-0.5 text-xs text-red-400">{upload.error}</p>
        )}
      </div>
      <StatusIcon
        className={cn(
          "h-4 w-4 shrink-0",
          statusColor,
          (upload.status === "pending" || upload.status === "uploading") &&
            "animate-spin"
        )}
      />
    </div>
  );
}
