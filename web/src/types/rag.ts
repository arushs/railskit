// ── RAG Pipeline Types ──

export type UploadStatus = "idle" | "uploading" | "processing" | "chunking" | "embedding" | "ready" | "error";

export interface RagDocument {
  id: string;
  name: string;
  type: "pdf" | "txt" | "md" | "csv" | "html" | "docx";
  size_bytes: number;
  chunk_count: number;
  status: UploadStatus;
  collection_id: string;
  created_at: string;
  updated_at: string;
  error?: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  document_count: number;
  total_chunks: number;
  embedding_model: string;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  id: string;
  content: string;
  document_name: string;
  collection_name: string;
  similarity: number;
  chunk_index: number;
  metadata?: Record<string, unknown>;
}

export interface SearchQuery {
  query: string;
  collection_ids?: string[];
  top_k: number;
  similarity_threshold: number;
}
