# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Search API", type: :request do
  let(:user) { create(:user) }

  before { sign_in user }

  describe "POST /api/search" do
    context "with no collections" do
      it "returns empty results with message" do
        post "/api/search", params: { query: "anything" }, as: :json
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["results"]).to eq([])
        expect(response.parsed_body["message"]).to include("No collections")
      end
    end

    context "with collections" do
      let(:collection) { create(:collection, user: user) }
      let(:document) { create(:document, :ready, collection: collection) }

      before do
        allow(Rag::EmbeddingService).to receive(:embed).and_return([0.1] * 1536)
        create(:chunk, document: document, embedding: [0.1] * 1536, content: "Billing FAQ content")
      end

      it "searches across all user collections" do
        post "/api/search", params: { query: "billing" }, as: :json

        expect(response).to have_http_status(:ok)
        body = response.parsed_body
        expect(body["query"]).to eq("billing")
        expect(body["results"]).to be_an(Array)
      end

      it "respects limit parameter" do
        post "/api/search", params: { query: "test", limit: 1 }, as: :json
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["results"].size).to be <= 1
      end
    end
  end
end
