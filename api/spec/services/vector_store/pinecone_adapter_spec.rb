# frozen_string_literal: true

require "rails_helper"

RSpec.describe VectorStore::PineconeAdapter do
  let(:adapter) { described_class.new(api_key: "key", index_host: "test.pinecone.io") }
  let(:collection) { create(:document_collection) }
  let(:document) { create(:document, document_collection: collection) }

  it "stores embedding and upserts" do
    chunk = create(:chunk, document: document)
    stub_request(:post, "https://test.pinecone.io/vectors/upsert")
      .to_return(status: 200, body: "{}",  headers: { "Content-Type" => "application/json" })
    expect { adapter.store(chunk, Array.new(1536) { rand }) }.to change(Embedding, :count).by(1)
  end

  it "searches Pinecone" do
    chunk = create(:chunk, document: document)
    stub_request(:post, "https://test.pinecone.io/query")
      .to_return(status: 200, body: { matches: [{ id: chunk.id.to_s, score: 0.95 }] }.to_json,
                 headers: { "Content-Type" => "application/json" })
    results = adapter.search(Array.new(1536, 0.1))
    expect(results.first[:score]).to eq(0.95)
  end
end
