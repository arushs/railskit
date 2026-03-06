# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::DocumentCollections", type: :request do
  let(:user) { create(:user) }
  before { sign_in user }

  describe "GET /api/v1/document_collections" do
    it "returns all collections" do
      create_list(:document_collection, 3)
      get "/api/v1/document_collections"
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).size).to eq(3)
    end
  end

  describe "GET /api/v1/document_collections/:id" do
    it "returns a collection with stats" do
      collection = create(:document_collection)
      create_list(:document, 2, document_collection: collection, status: "ready")
      get "/api/v1/document_collections/#{collection.id}"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["name"]).to eq(collection.name)
      expect(json["document_count"]).to eq(2)
    end
  end

  describe "POST /api/v1/document_collections" do
    it "creates a collection" do
      post "/api/v1/document_collections", params: { document_collection: { name: "Test Docs", chunking_strategy: "markdown" } }
      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["name"]).to eq("Test Docs")
    end

    it "returns errors for invalid params" do
      post "/api/v1/document_collections", params: { document_collection: { name: "" } }
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "PATCH /api/v1/document_collections/:id" do
    it "updates a collection" do
      collection = create(:document_collection)
      patch "/api/v1/document_collections/#{collection.id}", params: { document_collection: { chunk_size: 1024 } }
      expect(response).to have_http_status(:ok)
      expect(collection.reload.chunk_size).to eq(1024)
    end
  end

  describe "DELETE /api/v1/document_collections/:id" do
    it "deletes a collection" do
      collection = create(:document_collection)
      delete "/api/v1/document_collections/#{collection.id}"
      expect(response).to have_http_status(:no_content)
    end
  end
end
