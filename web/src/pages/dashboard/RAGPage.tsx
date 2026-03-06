import { useState } from "react";
import { DocumentUploader } from "@/components/rag/DocumentUploader";
import { SearchPreview } from "@/components/rag/SearchPreview";
import { CollectionManager } from "@/components/rag/CollectionManager";
import { mockCollections, mockDocuments, mockSearchResults } from "@/lib/mock-rag";

export default function RAGPage() {
  const [selectedCollection, setSelectedCollection] = useState(
    mockCollections[0].id
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Knowledge Base
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Upload documents, build collections, and search with semantic understanding
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sidebar: Collections */}
        <div className="lg:col-span-1">
          <CollectionManager
            collections={mockCollections}
            selectedId={selectedCollection}
            onSelect={setSelectedCollection}
          />
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <DocumentUploader
            collections={mockCollections}
            selectedCollectionId={selectedCollection}
            existingDocuments={mockDocuments}
          />

          <SearchPreview
            collections={mockCollections}
            results={mockSearchResults}
          />
        </div>
      </div>
    </div>
  );
}
