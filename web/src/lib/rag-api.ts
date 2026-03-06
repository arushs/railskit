import { api } from "./api";
import type {
  Document,
  DocumentCollection,
  Chunk,
  SearchResult,
} from "@/types/rag";

// ── Collections API ──

export const collectionsApi = {
  list: () =>
    api.get<{ collections: DocumentCollection[] }>("/api/v1/document_collections"),

  get: (id: number) =>
    api.get<{ collection: DocumentCollection }>(`/api/v1/document_collections/${id}`),

  create: (data: Partial<DocumentCollection>) =>
    api.post<{ collection: DocumentCollection }>("/api/v1/document_collections", {
      document_collection: data,
    }),

  update: (id: number, data: Partial<DocumentCollection>) =>
    api.patch<{ collection: DocumentCollection }>(
      `/api/v1/document_collections/${id}`,
      { document_collection: data }
    ),

  delete: (id: number) =>
    api.delete<void>(`/api/v1/document_collections/${id}`),
};

// ── Documents API ──

export const documentsApi = {
  list: (collectionId: number) =>
    api.get<{ documents: Document[] }>(
      `/api/v1/document_collections/${collectionId}/documents`
    ),

  get: (id: number) =>
    api.get<{ document: Document }>(`/api/v1/documents/${id}`),

  delete: (id: number) =>
    api.delete<void>(`/api/v1/documents/${id}`),

  reprocess: (id: number) =>
    api.post<{ document: Document }>(`/api/v1/documents/${id}/reprocess`),

  chunks: (id: number) =>
    api.get<{ chunks: Chunk[] }>(`/api/v1/documents/${id}/chunks`),

  upload: (
    collectionId: number,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ data: { document: Document }; ok: boolean }> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("document[file]", file);
      formData.append("document[name]", file.name);

      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `${import.meta.env.VITE_API_URL || ""}/api/v1/document_collections/${collectionId}/documents`
      );
      xhr.withCredentials = true;

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ data, ok: xhr.status >= 200 && xhr.status < 300 });
        } catch {
          reject(new Error("Failed to parse upload response"));
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Upload failed")));
      xhr.send(formData);
    });
  },
};

// ── Search API ──

export const searchApi = {
  search: (params: {
    collection_id: number;
    query: string;
    top_k?: number;
    threshold?: number;
  }) =>
    api.post<{ results: SearchResult[] }>("/api/v1/search", params),
};
