// ── RAG Pipeline Types ──

export interface DocumentCollection {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  totalChunks: number;
  /** Total size in bytes */
  totalSize: number;
  embeddingModel: string;
  chunkStrategy: "fixed" | "semantic" | "recursive";
  status: "active" | "indexing" | "error";
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  collectionId: string;
  filename: string;
  mimeType: string;
  /** Size in bytes */
  size: number;
  chunkCount: number;
  status: "pending" | "processing" | "indexed" | "error";
  /** 0-100 */
  progress: number;
  errorMessage?: string;
  metadata: Record<string, string>;
  createdAt: string;
}

export interface SearchResult {
  id: string;
  documentId: string;
  documentName: string;
  collectionName: string;
  content: string;
  /** 0-1 similarity score */
  score: number;
  /** Chunk index within the document */
  chunkIndex: number;
  metadata: Record<string, string>;
}

export interface SearchQuery {
  query: string;
  collectionIds?: string[];
  topK?: number;
  minScore?: number;
}

export type UploadStatus = "idle" | "uploading" | "processing" | "complete" | "error";
