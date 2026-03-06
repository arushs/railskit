# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Collections API", type: :request do
  let(:user) { create(:user) }

  before { sign_in user }

  describe "GET /api/collections" do
    it "lists user's collections" do
      create_list(:collection, 3, user: user)

      get "/api/collections", as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.size).to eq(3)
    end

    it "includes document count" do
      coll = create(:collection, user: user)
      create(:document, :ready, collection: coll)

      get "/api/collections", as: :json
      expect(response.parsed_body.first["documents_count"]).to be >= 0
    end
  end

  describe "POST /api/collections" do
    it "creates a collection" do
      expect {
        post "/api/collections",
             params: { name: "Knowledge Base", description: "Company docs" },
             as: :json
      }.to change(Collection, :count).by(1)

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["name"]).to eq("Knowledge Base")
      expect(body["slug"]).to eq("knowledge-base")
    end

    it "rejects blank name" do
      post "/api/collections", params: { name: "" }, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "GET /api/collections/:id" do
    it "returns collection with documents" do
      coll = create(:collection, user: user)
      create(:document, :ready, collection: coll)

      get "/api/collections/#{coll.id}", as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["documents"]).to be_an(Array)
    end
  end

  describe "PATCH /api/collections/:id" do
    it "updates the collection" do
      coll = create(:collection, user: user, name: "Old Name")

      patch "/api/collections/#{coll.id}",
            params: { name: "New Name" },
            as: :json

      expect(response).to have_http_status(:ok)
      expect(coll.reload.name).to eq("New Name")
    end
  end

  describe "DELETE /api/collections/:id" do
    it "destroys the collection" do
      coll = create(:collection, user: user)

      expect {
        delete "/api/collections/#{coll.id}", as: :json
      }.to change(Collection, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end

  describe "POST /api/collections/:id/search" do
    let(:collection) { create(:collection, user: user) }
    let(:document) { create(:document, :ready, collection: collection) }

    before do
      allow(Rag::EmbeddingService).to receive(:embed).and_return([0.1] * 1536)
      create(:chunk, document: document, embedding: [0.1] * 1536)
    end

    it "returns search results" do
      post "/api/collections/#{collection.id}/search",
           params: { query: "test query" },
           as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["query"]).to eq("test query")
      expect(body["results"]).to be_an(Array)
    end
  end
end
