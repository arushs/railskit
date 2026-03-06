# frozen_string_literal: true

require "rails_helper"

RSpec.describe SearchDocumentsTool do
  let(:tool) { described_class.new }
  let(:user) { create(:user) }
  let(:collection) { create(:collection, user: user, name: "Docs", slug: "docs") }
  let(:document) { create(:document, :ready, collection: collection, title: "FAQ") }

  before do
    allow(Rag::EmbeddingService).to receive(:embed).and_return([0.1] * 1536)
  end

  describe "#execute" do
    context "with results" do
      before do
        create(:chunk, document: document, content: "Password reset instructions", embedding: [0.1] * 1536)
      end

      it "returns search results" do
        result = tool.execute(query: "reset password")
        expect(result[:query]).to eq("reset password")
        expect(result[:results]).to be_an(Array)
      end

      it "filters by collection slug" do
        result = tool.execute(query: "reset password", collection: "docs")
        expect(result[:results]).to be_an(Array)
      end
    end

    context "with no results" do
      it "returns empty results message" do
        result = tool.execute(query: "nonexistent topic")
        expect(result[:results]).to eq([])
        expect(result[:message]).to include("No relevant documents")
      end
    end

    context "with invalid collection" do
      it "returns error" do
        result = tool.execute(query: "test", collection: "nonexistent")
        expect(result[:error]).to include("not found")
      end
    end
  end
end
