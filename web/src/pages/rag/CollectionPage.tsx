import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentUploader } from "@/components/rag/DocumentUploader";
import { DocumentList } from "@/components/rag/DocumentList";
import { CollectionManager } from "@/components/rag/CollectionManager";
import { SearchPreview } from "@/components/rag/SearchPreview";
import { RelevanceTuner } from "@/components/rag/RelevanceTuner";
import { ChunkViewer } from "@/components/rag/ChunkViewer";
import { useDocuments } from "@/hooks/useDocuments";
import { useDocumentUpload } from "@/hooks/useDocumentUpload";
import { useSearch } from "@/hooks/useSearch";
import { collectionsApi } from "@/lib/rag-api";
import SEO from "@/components/seo/SEO";
import type { DocumentCollection } from "@/types/rag";

export function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const collectionId = id ? Number(id) : null;

  const [collection, setCollection] = useState<DocumentCollection | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [viewingChunksFor, setViewingChunksFor] = useState<number | null>(null);
  const [topK, setTopK] = useState(5);
  const [threshold, setThreshold] = useState(0.5);

  const { documents, loading: docsLoading, refetch, deleteDocument, reprocessDocument } =
    useDocuments(collectionId);
  const { uploads, isUploading, uploadFiles, clearUploads } =
    useDocumentUpload(collectionId);
  const { results, loading: searchLoading, error: searchError, search } =
    useSearch(collectionId);

  useEffect(() => {
    if (!collectionId) return;
    collectionsApi.get(collectionId).then((res) => {
      if (res.ok) setCollection(res.data.collection);
    });
  }, [collectionId]);

  const handleSearch = (query: string) => {
    search(query, topK, threshold);
  };

  if (!collectionId) {
    return <p className="text-zinc-400">Invalid collection ID</p>;
  }

  return (
    <div className="space-y-6 animate-in">
      <SEO
        title={collection?.name ?? "Collection"}
        description="Manage documents in this collection"
        noindex
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard/documents")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {collection?.name ?? "Loading..."}
          </h1>
          {collection?.description && (
            <p className="mt-0.5 text-sm text-zinc-500">
              {collection.description}
            </p>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="h-4 w-4 mr-1" />
          Settings
        </Button>
      </div>

      {/* Settings panel */}
      {showSettings && collection && (
        <CollectionManager
          collection={collection}
          onSave={async (data) => {
            const res = await collectionsApi.update(collectionId, data);
            if (res.ok) {
              setCollection(res.data.collection);
              setShowSettings(false);
            }
          }}
          onCancel={() => setShowSettings(false)}
        />
      )}

      {/* Tabs */}
      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          {viewingChunksFor && (
            <TabsTrigger value="chunks">Chunks</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="documents" className="space-y-4 mt-4">
          {/* Uploader */}
          <Card className="dark:bg-zinc-900/50 bg-white">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-base">Upload Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <DocumentUploader
                onUpload={async (files) => {
                  await uploadFiles(files);
                  refetch();
                }}
                uploads={uploads}
                isUploading={isUploading}
                onClear={clearUploads}
              />
            </CardContent>
          </Card>

          {/* Document list */}
          <Card className="dark:bg-zinc-900/50 bg-white">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-base">
                Documents ({documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <DocumentList
                documents={documents}
                loading={docsLoading}
                onDelete={deleteDocument}
                onReprocess={reprocessDocument}
                onViewChunks={(docId) => setViewingChunksFor(docId)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4 mt-4">
          <div className="grid gap-4 lg:grid-cols-[1fr,280px]">
            <Card className="dark:bg-zinc-900/50 bg-white">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-base">Search Preview</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-2">
                <SearchPreview
                  results={results}
                  loading={searchLoading}
                  error={searchError}
                  onSearch={handleSearch}
                />
              </CardContent>
            </Card>
            <div>
              <RelevanceTuner
                topK={topK}
                threshold={threshold}
                onTopKChange={setTopK}
                onThresholdChange={setThreshold}
              />
            </div>
          </div>
        </TabsContent>

        {viewingChunksFor && (
          <TabsContent value="chunks" className="mt-4">
            <Card className="dark:bg-zinc-900/50 bg-white">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  Chunk Viewer
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingChunksFor(null)}
                  >
                    Close
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-2">
                <ChunkViewer
                  documentId={viewingChunksFor}
                  documentName={
                    documents.find((d) => d.id === viewingChunksFor)?.name
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
