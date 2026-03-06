# frozen_string_literal: true

require "rails_helper"

RSpec.describe Rag::SearchService do
  let(:user) { create(:user) }
  let(:collection) { create(:collection, user: user) }
  let(:document) { create(:document, :ready, collection: collection) }
  let(:mock_embedding) { [0.1] * 1536 }

  before do
    allow(Rag::EmbeddingService).to receive(:embed).and_return(mock_embedding)
  end

  describe ".search" do
    it "returns Result objects" do
      create(:chunk, document: document, embedding: mock_embedding)

      results = described_class.search("test query", collection: collection)
      expect(results).to be_an(Array)
      # Results are Rag::SearchService::Result data objects
      results.each do |r|
        expect(r).to respond_to(:chunk, :score, :document_title, :collection_name)
      end
    end

    it "respects limit parameter" do
      3.times { |i| create(:chunk, document: document, position: i, embedding: mock_embedding) }

      results = described_class.search("test", collection: collection, limit: 2)
      expect(results.size).to be <= 2
    end

    it "filters by collection" do
      other_collection = create(:collection, user: user)
      other_doc = create(:document, :ready, collection: other_collection)
      create(:chunk, document: other_doc, embedding: mock_embedding)
      create(:chunk, document: document, embedding: mock_embedding)

      results = described_class.search("test", collection: collection, limit: 10)
      results.each do |r|
        chunk = r.chunk.is_a?(ActiveRecord::Relation) ? r.chunk.first : r.chunk
        expect(chunk.document.collection_id).to eq(collection.id)
      end
    end
  end

  describe ".format_for_context" do
    it "returns empty string for no results" do
      expect(described_class.format_for_context([])).to eq("")
    end

    it "formats results with source attribution" do
      chunk = create(:chunk, document: document, content: "Test content")
      result = Rag::SearchService::Result.new(
        chunk: chunk,
        score: 0.95,
        document_title: "Test Doc",
        collection_name: "Docs"
      )

      formatted = described_class.format_for_context([result])
      expect(formatted).to include("Test Doc")
      expect(formatted).to include("95.0%")
      expect(formatted).to include("Test content")
    end
  end
end
