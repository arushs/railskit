# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Search", type: :request do
  let(:user) { create(:user) }
  let(:collection) { create(:document_collection) }
  let(:document) { create(:document, document_collection: collection, status: "ready") }
  let(:mock_service) { instance_double(EmbeddingService) }

  before do
    sign_in user
    allow(EmbeddingService).to receive(:new).and_return(mock_service)
  end

  describe "POST /api/v1/search" do
    it "returns search results" do
      chunk = create(:chunk, document: document, content: "Test content about Rails")
      allow(mock_service).to receive(:search).and_return([
        { chunk: chunk, content: chunk.content, document: document, score: 0.92 }
      ])

      post "/api/v1/search", params: { query: "Rails" }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["results"].size).to eq(1)
      expect(json["results"].first["score"]).to eq(0.92)
    end

    it "requires a query" do
      post "/api/v1/search"
      expect(response).to have_http_status(:bad_request)
    end
  end
end
