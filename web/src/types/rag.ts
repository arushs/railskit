// RAG Pipeline types

export interface DocumentCollection {
  id: number;
  name: string;
  description?: string;
  chunking_strategy: ChunkingStrategy;
  chunk_size: number;
  chunk_overlap: number;
  embedding_model: string;
  documents_count: number;
  created_at: string;
  updated_at: string;
}

export type ChunkingStrategy =
  | "paragraph"
  | "page"
  | "semantic"
  | "sliding_window"
  | "markdown";

export type DocumentStatus = "pending" | "processing" | "ready" | "error";

export interface Document {
  id: number;
  name: string;
  file_type: string;
  file_size: number;
  status: DocumentStatus;
  collection_id: number;
  chunks_count: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Chunk {
  id: number;
  content: string;
  position: number;
  token_count: number;
  document_id: number;
}

export interface SearchResult {
  chunk: Chunk;
  score: number;
  document_name: string;
  highlights: string[];
}

export interface SearchParams {
  query: string;
  collection_id: number;
  top_k: number;
  threshold: number;
}

export interface RAGSettings {
  collection_ids: number[];
  auto_inject: boolean;
  top_k: number;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
}
