import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderOpen, Loader2 } from "lucide-react";
import { CollectionManager } from "@/components/rag/CollectionManager";
import { useCollections } from "@/hooks/useCollections";
import SEO from "@/components/seo/SEO";
import type { ChunkingStrategy } from "@/types/rag";

const STRATEGY_LABELS: Record<ChunkingStrategy, string> = {
  paragraph: "Paragraph",
  page: "Page",
  semantic: "Semantic",
  sliding_window: "Sliding Window",
  markdown: "Markdown",
};

export function DocumentsPage() {
  const { collections, loading, createCollection, deleteCollection } =
    useCollections();
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in">
      <SEO
        title="Documents"
        description="Manage your RAG document collections"
        noindex
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Documents
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Manage knowledge base collections and documents
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4 mr-1" />
          New Collection
        </Button>
      </div>

      {/* Create collection form */}
      {showCreate && (
        <CollectionManager
          onSave={async (data) => {
            await createCollection(data);
            setShowCreate(false);
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Collections grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      ) : collections.length === 0 ? (
        <Card className="dark:bg-zinc-900/50 bg-white">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-10 w-10 text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-400">No collections yet</p>
            <p className="text-xs text-zinc-500 mt-1">
              Create a collection to start uploading documents
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => (
            <Card
              key={col.id}
              className="dark:bg-zinc-900/50 bg-white cursor-pointer hover:border-zinc-600 transition-colors group"
              onClick={() => navigate(`/dashboard/collections/${col.id}`)}
            >
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="truncate">{col.name}</span>
                  <Badge variant="secondary">
                    {col.documents_count} docs
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                {col.description && (
                  <p className="text-xs text-zinc-400 mb-2 line-clamp-2">
                    {col.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Badge variant="outline" className="text-[10px]">
                    {STRATEGY_LABELS[col.chunking_strategy]}
                  </Badge>
                  <span>{col.chunk_size} tokens</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this collection?")) {
                      deleteCollection(col.id);
                    }
                  }}
                  className="mt-3 text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Delete
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
