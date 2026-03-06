# frozen_string_literal: true

require "rails_helper"

RSpec.describe EmbeddingService do
  let(:mock_provider) { instance_double(EmbeddingProvider::OpenaiAdapter) }
  let(:mock_store) { instance_double(VectorStore::PgvectorAdapter) }
  let(:service) { described_class.new(embedding_provider: mock_provider, vector_store: mock_store) }
  let(:collection) { create(:document_collection) }
  let(:document) { create(:document, document_collection: collection) }

  describe "#embed_and_store" do
    it "generates embedding and stores it" do
      chunk = create(:chunk, document: document)
      vector = Array.new(1536, 0.1)
      expect(mock_provider).to receive(:embed).with(chunk.content).and_return(vector)
      expect(mock_store).to receive(:store).with(chunk, vector)
      service.embed_and_store(chunk)
    end
  end

  describe "#embed_and_store_batch" do
    it "embeds and stores multiple chunks" do
      chunks = create_list(:chunk, 3, document: document)
      vectors = chunks.map { Array.new(1536, 0.1) }
      expect(mock_provider).to receive(:embed_batch).with(chunks.map(&:content)).and_return(vectors)
      chunks.zip(vectors).each { |c, v| expect(mock_store).to receive(:store).with(c, v) }
      service.embed_and_store_batch(chunks)
    end
  end

  describe "#search" do
    it "embeds query and searches vector store" do
      query_vector = Array.new(1536, 0.1)
      expect(mock_provider).to receive(:embed).with("test query").and_return(query_vector)
      expect(mock_store).to receive(:search)
        .with(query_vector, collection: collection, limit: 5, threshold: 0.0)
        .and_return([])
      service.search("test query", collection: collection, limit: 5)
    end
  end
end
