# frozen_string_literal: true

require "rails_helper"

RSpec.describe VectorStore::QdrantAdapter do
  let(:adapter) { described_class.new(url: "http://localhost:6333", collection_name: "test") }
  let(:collection) { create(:document_collection) }
  let(:document) { create(:document, document_collection: collection) }

  it "stores embedding and upserts" do
    chunk = create(:chunk, document: document)
    stub_request(:put, "http://localhost:6333/collections/test/points")
      .to_return(status: 200, body: { status: "ok" }.to_json, headers: { "Content-Type" => "application/json" })
    expect { adapter.store(chunk, Array.new(1536) { rand }) }.to change(Embedding, :count).by(1)
  end

  it "searches Qdrant" do
    chunk = create(:chunk, document: document)
    stub_request(:post, "http://localhost:6333/collections/test/points/search")
      .to_return(status: 200, body: { result: [{ id: chunk.id, score: 0.92 }] }.to_json,
                 headers: { "Content-Type" => "application/json" })
    results = adapter.search(Array.new(1536, 0.1))
    expect(results.first[:score]).to eq(0.92)
  end
end
