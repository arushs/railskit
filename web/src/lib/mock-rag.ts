import type { Collection, RagDocument, SearchResult } from "@/types/rag";

export const mockCollections: Collection[] = [
  {
    id: "col-1",
    name: "Product Documentation",
    description: "Technical docs, API references, and guides",
    document_count: 24,
    total_chunks: 1842,
    embedding_model: "text-embedding-3-small",
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "col-2",
    name: "Support Tickets",
    description: "Historical customer support conversations",
    document_count: 156,
    total_chunks: 8920,
    embedding_model: "text-embedding-3-small",
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "col-3",
    name: "Knowledge Base",
    description: "Internal wiki articles and SOPs",
    document_count: 42,
    total_chunks: 3150,
    embedding_model: "text-embedding-3-large",
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const mockDocuments: RagDocument[] = [
  {
    id: "doc-1",
    name: "api-reference.md",
    type: "md",
    size_bytes: 45200,
    chunk_count: 32,
    status: "ready",
    collection_id: "col-1",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "doc-2",
    name: "getting-started.pdf",
    type: "pdf",
    size_bytes: 1250000,
    chunk_count: 85,
    status: "ready",
    collection_id: "col-1",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "doc-3",
    name: "deployment-guide.md",
    type: "md",
    size_bytes: 28400,
    chunk_count: 18,
    status: "ready",
    collection_id: "col-1",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "doc-4",
    name: "quarterly-report.csv",
    type: "csv",
    size_bytes: 89000,
    chunk_count: 0,
    status: "processing",
    collection_id: "col-2",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "doc-5",
    name: "onboarding-flow.docx",
    type: "docx",
    size_bytes: 520000,
    chunk_count: 0,
    status: "error",
    collection_id: "col-3",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
    error: "Failed to parse document: unsupported format version",
  },
];

export const mockSearchResults: SearchResult[] = [
  {
    id: "res-1",
    content:
      "To authenticate API requests, include your API key in the Authorization header as a Bearer token. All requests must be made over HTTPS.",
    document_name: "api-reference.md",
    collection_name: "Product Documentation",
    similarity: 0.94,
    chunk_index: 3,
  },
  {
    id: "res-2",
    content:
      "Rate limiting is set to 100 requests per minute per API key. If you exceed this limit, you'll receive a 429 status code. Implement exponential backoff in your retry logic.",
    document_name: "api-reference.md",
    collection_name: "Product Documentation",
    similarity: 0.87,
    chunk_index: 12,
  },
  {
    id: "res-3",
    content:
      "The deployment process involves three steps: building the Docker image, pushing to the container registry, and triggering a rolling update on the cluster.",
    document_name: "deployment-guide.md",
    collection_name: "Product Documentation",
    similarity: 0.82,
    chunk_index: 5,
  },
  {
    id: "res-4",
    content:
      "For webhook configuration, navigate to Settings > Integrations > Webhooks. You can configure up to 10 webhook endpoints per project.",
    document_name: "getting-started.pdf",
    collection_name: "Product Documentation",
    similarity: 0.76,
    chunk_index: 41,
  },
];
