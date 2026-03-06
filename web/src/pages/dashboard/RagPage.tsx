import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Search, Upload, FileText, Layers, HardDrive } from "lucide-react";
import { DocumentUploader, SearchPreview, CollectionManager } from "@/components/rag";
import {
  mockCollections,
  mockDocuments,
  mockSearchResults,
} from "@/lib/mock-rag";
import type { SearchResult, DocumentCollection } from "@/types/rag";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function RagPage() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCollection, setSelectedCollection] =
    useState<DocumentCollection | null>(mockCollections[0]);

  const handleSearch = useCallback(
    (_query: string, _collectionIds?: string[]) => {
      setIsSearching(true);
      // Simulate search latency
      setTimeout(() => {
        setSearchResults(mockSearchResults);
        setIsSearching(false);
      }, 800 + Math.random() * 400);
    },
    []
  );

  const totalDocs = mockCollections.reduce((s, c) => s + c.documentCount, 0);
  const totalChunks = mockCollections.reduce((s, c) => s + c.totalChunks, 0);
  const totalSize = mockCollections.reduce((s, c) => s + c.totalSize, 0);

  const stats = [
    { label: "Collections", value: String(mockCollections.length), icon: Database },
    { label: "Documents", value: String(totalDocs), icon: FileText },
    { label: "Chunks", value: totalChunks.toLocaleString(), icon: Layers },
    { label: "Storage", value: formatSize(totalSize), icon: HardDrive },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            RAG Pipeline
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Upload documents, manage collections, and search with vector
            embeddings. Your agent's knowledge base.
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-xs dark:border-zinc-700 dark:text-zinc-400"
        >
          <Database className="mr-1 h-3 w-3" />
          Embeddings + Vector Store
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="dark:bg-zinc-900/50 bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-indigo-500/10 p-2">
                <Icon className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {label}
                </p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">
                  {value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="collections" className="space-y-4">
        <TabsList className="dark:bg-zinc-800/50">
          <TabsTrigger value="collections" className="gap-1.5">
            <Database className="h-3.5 w-3.5" />
            Collections
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-1.5">
            <Search className="h-3.5 w-3.5" />
            Search
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="collections">
          <CollectionManager
            collections={mockCollections}
            documents={mockDocuments}
            onSelectCollection={setSelectedCollection}
            onCreateCollection={() => {}}
            onDeleteCollection={() => {}}
            onReindexCollection={() => {}}
          />
        </TabsContent>

        <TabsContent value="search">
          <SearchPreview
            collections={mockCollections}
            results={searchResults}
            onSearch={handleSearch}
            isSearching={isSearching}
          />
        </TabsContent>

        <TabsContent value="upload">
          <div className="max-w-2xl">
            <DocumentUploader
              collectionId={selectedCollection?.id ?? mockCollections[0].id}
              collectionName={
                selectedCollection?.name ?? mockCollections[0].name
              }
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
