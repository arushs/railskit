# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Documents API", type: :request do
  let(:user) { create(:user) }
  let(:collection) { create(:collection, user: user) }

  before { sign_in user }

  describe "GET /api/collections/:collection_id/documents" do
    it "lists documents in a collection" do
      create_list(:document, 3, :ready, collection: collection)

      get "/api/collections/#{collection.id}/documents", as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.size).to eq(3)
    end
  end

  describe "GET /api/collections/:collection_id/documents/:id" do
    it "returns document details" do
      doc = create(:document, :ready, collection: collection)

      get "/api/collections/#{collection.id}/documents/#{doc.id}", as: :json
      expect(response).to have_http_status(:ok)

      body = response.parsed_body
      expect(body["id"]).to eq(doc.id)
      expect(body["title"]).to eq(doc.title)
      expect(body["status"]).to eq("ready")
    end
  end

  describe "POST /api/collections/:collection_id/documents" do
    it "creates a document from text content" do
      expect {
        post "/api/collections/#{collection.id}/documents",
             params: { title: "Test Doc", content: "Some text content here" },
             as: :json
      }.to change(Document, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["source_type"]).to eq("text")
    end

    it "creates a document from URL" do
      expect {
        post "/api/collections/#{collection.id}/documents",
             params: { title: "URL Doc", url: "https://example.com/article" },
             as: :json
      }.to change(Document, :count).by(1)

      expect(response.parsed_body["source_type"]).to eq("url")
    end

    it "rejects request without file, url, or content" do
      post "/api/collections/#{collection.id}/documents",
           params: { title: "Empty" },
           as: :json
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "DELETE /api/collections/:collection_id/documents/:id" do
    it "destroys the document" do
      doc = create(:document, collection: collection)

      expect {
        delete "/api/collections/#{collection.id}/documents/#{doc.id}", as: :json
      }.to change(Document, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end

  describe "POST /api/collections/:collection_id/documents/:id/reprocess" do
    it "resets and re-enqueues the document" do
      doc = create(:document, :ready, collection: collection)

      post "/api/collections/#{collection.id}/documents/#{doc.id}/reprocess", as: :json
      expect(response).to have_http_status(:ok)
      expect(doc.reload.status).to eq("pending")
    end
  end
end
