# frozen_string_literal: true

require "rails_helper"

RSpec.describe ProcessDocumentJob, type: :job do
  let(:collection) { create(:document_collection, chunking_strategy: "paragraph", chunk_size: 512, chunk_overlap: 50) }
  let(:document) { create(:document, :with_file, document_collection: collection, name: "test.txt", content_type: "text/plain") }

  describe "#perform" do
    let(:mock_service) { instance_double(EmbeddingService) }

    before do
      allow(EmbeddingService).to receive(:new).and_return(mock_service)
      allow(mock_service).to receive(:embed_and_store_batch)
    end

    it "extracts text, chunks, and marks document ready" do
      described_class.perform_now(document.id)
      expect(document.reload.status).to eq("ready")
      expect(document.chunks.count).to be > 0
    end

    it "calls embedding service" do
      expect(mock_service).to receive(:embed_and_store_batch).at_least(:once)
      described_class.perform_now(document.id)
    end

    it "marks document as error on failure" do
      allow(TextExtractor).to receive(:extract).and_raise("Extraction failed")
      described_class.perform_now(document.id) rescue nil
      expect(document.reload.status).to eq("error")
    end
  end
end
