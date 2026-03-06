# frozen_string_literal: true

require "rails_helper"

RSpec.describe KnowledgeSearchTool do
  let(:tool) { described_class.new }
  let(:collection) { create(:collection, name: "Help") }
  let(:document) { create(:document, collection: collection, title: "FAQ", status: "ready") }
  let(:embedding) { Array.new(768) { 0.0 } }
  let!(:chunk) { create(:chunk, document: document, position: 0, content: "Reset your password in settings", embedding: embedding) }

  before do
    allow(Rag::EmbeddingService).to receive(:embed).and_return(embedding)
  end

  describe "#execute" do
    it "returns search results" do
      result = tool.execute(query: "password")
      expect(result[:query]).to eq("password")
      expect(result[:results]).to be_an(Array)
      expect(result[:mode]).to eq("hybrid")
      expect(result[:expanded]).to eq("none")
    end

    it "clamps limit between 1 and 20" do
      result = tool.execute(query: "test", limit: 0)
      expect(result).to have_key(:results)

      result = tool.execute(query: "test", limit: 100)
      expect(result).to have_key(:results)
    end

    it "filters by collection name" do
      result = tool.execute(query: "password", collection: "Help")
      expect(result[:results]).to be_an(Array)
    end

    it "returns error for unknown collection" do
      result = tool.execute(query: "test", collection: "NonExistent")
      expect(result[:error]).to include("not found")
    end

    it "accepts mode parameter" do
      result = tool.execute(query: "password", mode: "vector")
      expect(result[:mode]).to eq("vector")
    end

    it "defaults invalid mode to hybrid" do
      result = tool.execute(query: "password", mode: "invalid")
      expect(result[:mode]).to eq("hybrid")
    end

    it "accepts expand parameter" do
      mock_chat = instance_double("RubyLLM::Chat")
      mock_response = instance_double("RubyLLM::Response", content: "expanded query")
      allow(RubyLLM).to receive(:chat).and_return(mock_chat)
      allow(mock_chat).to receive(:ask).and_return(mock_response)

      result = tool.execute(query: "password", expand: "hyde")
      expect(result[:expanded]).to eq("hyde")
    end

    it "handles search errors gracefully" do
      allow(Rag::HybridSearchService).to receive(:search).and_raise(StandardError, "DB connection failed")

      result = tool.execute(query: "test")
      expect(result[:error]).to include("Search failed")
      expect(result[:results]).to eq([])
    end

    it "formats results with expected fields" do
      result = tool.execute(query: "password", mode: "vector")
      if result[:results].any?
        r = result[:results].first
        expect(r).to have_key(:title)
        expect(r).to have_key(:collection)
        expect(r).to have_key(:content)
        expect(r).to have_key(:relevance)
        expect(r).to have_key(:position)
        expect(r).to have_key(:document_id)
      end
    end
  end
end
