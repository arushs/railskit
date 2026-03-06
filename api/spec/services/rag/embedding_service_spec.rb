# frozen_string_literal: true

require "rails_helper"

RSpec.describe Rag::EmbeddingService do
  describe ".embed" do
    it "returns a vector array" do
      stub_openai_embeddings([1.0, 0.5, -0.3])

      result = described_class.embed("Hello world")
      expect(result).to be_an(Array)
      expect(result).to eq([1.0, 0.5, -0.3])
    end
  end

  describe ".embed_batch" do
    it "returns vectors for multiple texts" do
      vectors = [[1.0, 0.5], [0.3, -0.1]]
      stub_openai_embeddings_batch(vectors)

      results = described_class.embed_batch(["Hello", "World"])
      expect(results.size).to eq(2)
      expect(results).to eq(vectors)
    end

    it "returns empty array for empty input" do
      expect(described_class.embed_batch([])).to eq([])
    end
  end

  describe ".dimensions" do
    it "returns 1536 for text-embedding-3-small" do
      allow(Rails.application.config).to receive(:railskit).and_return(
        OpenStruct.new(rag: { embedding_model: "text-embedding-3-small" })
      )
      expect(described_class.dimensions).to eq(1536)
    end
  end

  private

  def stub_openai_embeddings(vector)
    stub_request(:post, "https://api.openai.com/v1/embeddings")
      .to_return(
        status: 200,
        body: { data: [{ embedding: vector, index: 0 }] }.to_json,
        headers: { "Content-Type" => "application/json" }
      )
  end

  def stub_openai_embeddings_batch(vectors)
    response_data = vectors.each_with_index.map { |v, i| { embedding: v, index: i } }
    stub_request(:post, "https://api.openai.com/v1/embeddings")
      .to_return(
        status: 200,
        body: { data: response_data }.to_json,
        headers: { "Content-Type" => "application/json" }
      )
  end
end
