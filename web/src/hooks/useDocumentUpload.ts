import { useState, useCallback } from "react";
import { documentsApi } from "@/lib/rag-api";
import type { UploadProgress } from "@/types/rag";

export function useDocumentUpload(collectionId: number | null) {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!collectionId) return;

      const newUploads: UploadProgress[] = files.map((file) => ({
        file,
        progress: 0,
        status: "pending" as const,
      }));

      setUploads(newUploads);
      setIsUploading(true);

      const results = await Promise.allSettled(
        files.map(async (file, index) => {
          setUploads((prev) =>
            prev.map((u, i) =>
              i === index ? { ...u, status: "uploading" as const } : u
            )
          );

          try {
            const res = await documentsApi.upload(
              collectionId,
              file,
              (progress) => {
                setUploads((prev) =>
                  prev.map((u, i) => (i === index ? { ...u, progress } : u))
                );
              }
            );

            if (res.ok) {
              setUploads((prev) =>
                prev.map((u, i) =>
                  i === index
                    ? { ...u, progress: 100, status: "complete" as const }
                    : u
                )
              );
              return res.data.document;
            } else {
              throw new Error("Upload failed");
            }
          } catch (e) {
            setUploads((prev) =>
              prev.map((u, i) =>
                i === index
                  ? {
                      ...u,
                      status: "error" as const,
                      error: e instanceof Error ? e.message : "Upload failed",
                    }
                  : u
              )
            );
            throw e;
          }
        })
      );

      setIsUploading(false);
      return results;
    },
    [collectionId]
  );

  const clearUploads = useCallback(() => {
    setUploads([]);
  }, []);

  return { uploads, isUploading, uploadFiles, clearUploads };
}
