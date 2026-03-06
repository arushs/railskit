# frozen_string_literal: true

require "rails_helper"

RSpec.describe EmbeddingProvider::OllamaAdapter do
  let(:adapter) { described_class.new(host: "http://localhost:11434") }

  it "returns a vector" do
    stub_request(:post, "http://localhost:11434/api/embeddings")
      .to_return(status: 200, body: { embedding: Array.new(768, 0.1) }.to_json,
                 headers: { "Content-Type" => "application/json" })
    expect(adapter.embed("test").size).to eq(768)
  end

  it "returns dimensions" do
    expect(adapter.dimensions).to eq(768)
  end
end
