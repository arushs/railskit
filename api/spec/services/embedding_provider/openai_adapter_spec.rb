# frozen_string_literal: true

require "rails_helper"

RSpec.describe EmbeddingProvider::OpenaiAdapter do
  let(:adapter) { described_class.new(api_key: "test-key") }

  it "returns a vector" do
    stub_request(:post, "https://api.openai.com/v1/embeddings")
      .to_return(status: 200, body: { data: [{ embedding: Array.new(1536, 0.1), index: 0 }] }.to_json,
                 headers: { "Content-Type" => "application/json" })
    expect(adapter.embed("test").size).to eq(1536)
  end

  it "batch embeds" do
    stub_request(:post, "https://api.openai.com/v1/embeddings")
      .to_return(status: 200, body: { data: [
        { embedding: Array.new(1536, 0.1), index: 0 },
        { embedding: Array.new(1536, 0.2), index: 1 }
      ]}.to_json, headers: { "Content-Type" => "application/json" })
    expect(adapter.embed_batch(["a", "b"]).size).to eq(2)
  end

  it "returns dimensions" do
    expect(adapter.dimensions).to eq(1536)
  end
end
