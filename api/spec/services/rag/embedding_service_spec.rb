# frozen_string_literal: true

require "rails_helper"

RSpec.describe Rag::EmbeddingService do
  let(:mock_response) do
    {
      "data" => [
        { "index" => 0, "embedding" => [0.1] * 1536 }
      ]
    }
  end

  before do
    allow(ENV).to receive(:fetch).with("OPENAI_API_KEY").and_return("test-key")
    allow(ENV).to receive(:fetch).with("OPENAI_BASE_URL", anything).and_return("https://api.openai.com/v1")
  end

  describe ".embed" do
    it "returns a vector array" do
      stub_request(:post, "https://api.openai.com/v1/embeddings")
        .to_return(status: 200, body: mock_response.to_json, headers: { "Content-Type" => "application/json" })

      result = described_class.embed("Hello world")
      expect(result).to be_an(Array)
      expect(result.size).to eq(1536)
    end
  end

  describe ".embed_batch" do
    it "returns empty array for empty input" do
      expect(described_class.embed_batch([])).to eq([])
    end

    it "embeds multiple texts" do
      batch_response = {
        "data" => [
          { "index" => 0, "embedding" => [0.1] * 1536 },
          { "index" => 1, "embedding" => [0.2] * 1536 }
        ]
      }

      stub_request(:post, "https://api.openai.com/v1/embeddings")
        .to_return(status: 200, body: batch_response.to_json, headers: { "Content-Type" => "application/json" })

      results = described_class.embed_batch(["Hello", "World"])
      expect(results.size).to eq(2)
      expect(results.first.size).to eq(1536)
    end
  end

  describe ".dimensions" do
    it "returns dimension count for configured model" do
      expect(described_class.dimensions).to be_a(Integer)
      expect(described_class.dimensions).to be > 0
    end
  end
end
