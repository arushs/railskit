# frozen_string_literal: true

require "rails_helper"
require "webmock/rspec"

RSpec.describe Rag::EmbeddingService do
  let(:sample_embedding) { Array.new(768) { rand(-1.0..1.0) } }

  def stub_config(provider:, model: nil)
    config_node = RailsKit::ConfigNode.new({
      rag: {
        embedding_provider: provider,
        embedding_model: model || described_class::DEFAULT_MODEL[provider]
      }
    })
    allow(RailsKit).to receive(:config).and_return(config_node)
  end

  before do
    stub_config(provider: "fireworks", model: "nomic-ai/nomic-embed-text-v1.5")
  end

  describe ".embed" do
    context "with Fireworks provider" do
      before do
        ENV["FIREWORKS_API_KEY"] = "test-fireworks-key"
      end

      after do
        ENV.delete("FIREWORKS_API_KEY")
      end

      it "sends request to Fireworks API and returns embedding" do
        stub_request(:post, "https://api.fireworks.ai/inference/v1/embeddings")
          .with(
            body: hash_including("model" => "nomic-ai/nomic-embed-text-v1.5", "input" => ["hello"]),
            headers: { "Authorization" => "Bearer test-fireworks-key", "Content-Type" => "application/json" }
          )
          .to_return(
            status: 200,
            body: { data: [{ index: 0, embedding: sample_embedding }] }.to_json,
            headers: { "Content-Type" => "application/json" }
          )

        result = described_class.embed("hello")

        expect(result).to eq(sample_embedding)
        expect(result.length).to eq(768)
      end

      it "raises Error with helpful message on API failure" do
        stub_request(:post, "https://api.fireworks.ai/inference/v1/embeddings")
          .to_return(
            status: 401,
            body: { error: { message: "Invalid API key" } }.to_json,
            headers: { "Content-Type" => "application/json" }
          )

        expect { described_class.embed("hello") }.to raise_error(
          Rag::EmbeddingService::Error, /Invalid API key/
        )
      end

      it "raises Error when FIREWORKS_API_KEY is missing" do
        ENV.delete("FIREWORKS_API_KEY")

        expect { described_class.embed("hello") }.to raise_error(
          Rag::EmbeddingService::Error, /FIREWORKS_API_KEY not set/
        )
      end
    end

    context "with OpenAI provider" do
      before do
        ENV["OPENAI_API_KEY"] = "test-openai-key"
        stub_config(provider: "openai", model: "text-embedding-3-small")
      end

      after do
        ENV.delete("OPENAI_API_KEY")
      end

      it "sends request to OpenAI API" do
        openai_embedding = Array.new(1536) { rand(-1.0..1.0) }

        stub_request(:post, "https://api.openai.com/v1/embeddings")
          .with(
            body: hash_including("model" => "text-embedding-3-small"),
            headers: { "Authorization" => "Bearer test-openai-key" }
          )
          .to_return(
            status: 200,
            body: { data: [{ index: 0, embedding: openai_embedding }] }.to_json,
            headers: { "Content-Type" => "application/json" }
          )

        result = described_class.embed("hello")
        expect(result).to eq(openai_embedding)
        expect(result.length).to eq(1536)
      end
    end

    context "with Ollama provider" do
      before do
        stub_config(provider: "ollama", model: "nomic-embed-text")
      end

      it "sends request to Ollama API" do
        stub_request(:post, "http://localhost:11434/api/embed")
          .with(body: hash_including("model" => "nomic-embed-text"))
          .to_return(
            status: 200,
            body: { embeddings: [sample_embedding] }.to_json,
            headers: { "Content-Type" => "application/json" }
          )

        result = described_class.embed("hello")
        expect(result).to eq(sample_embedding)
      end
    end
  end

  describe ".embed_batch" do
    before do
      ENV["FIREWORKS_API_KEY"] = "test-key"
    end

    after do
      ENV.delete("FIREWORKS_API_KEY")
    end

    it "returns empty array for empty input" do
      expect(described_class.embed_batch([])).to eq([])
    end

    it "embeds multiple texts in one call" do
      embeddings = [sample_embedding, sample_embedding.reverse]

      stub_request(:post, "https://api.fireworks.ai/inference/v1/embeddings")
        .with(body: hash_including("input" => ["one", "two"]))
        .to_return(
          status: 200,
          body: {
            data: [
              { index: 0, embedding: embeddings[0] },
              { index: 1, embedding: embeddings[1] }
            ]
          }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      results = described_class.embed_batch(["one", "two"])
      expect(results.length).to eq(2)
      expect(results[0]).to eq(embeddings[0])
      expect(results[1]).to eq(embeddings[1])
    end

    it "handles out-of-order API response by sorting on index" do
      embeddings = [sample_embedding, sample_embedding.reverse]

      stub_request(:post, "https://api.fireworks.ai/inference/v1/embeddings")
        .to_return(
          status: 200,
          body: {
            data: [
              { index: 1, embedding: embeddings[1] },
              { index: 0, embedding: embeddings[0] }
            ]
          }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      results = described_class.embed_batch(["first", "second"])
      expect(results[0]).to eq(embeddings[0])
      expect(results[1]).to eq(embeddings[1])
    end

    it "batches large inputs" do
      texts = Array.new(150) { |i| "text #{i}" }

      stub_request(:post, "https://api.fireworks.ai/inference/v1/embeddings")
        .to_return(
          status: 200,
          body: -> (request) {
            input = JSON.parse(request.body)["input"]
            {
              data: input.each_with_index.map { |_, i| { index: i, embedding: sample_embedding } }
            }.to_json
          },
          headers: { "Content-Type" => "application/json" }
        )

      results = described_class.embed_batch(texts)
      expect(results.length).to eq(150)
    end
  end

  describe ".dimensions" do
    it "returns 768 for nomic-embed-text-v1.5" do
      expect(described_class.dimensions).to eq(768)
    end

    it "returns 1536 for text-embedding-3-small" do
      stub_config(provider: "openai", model: "text-embedding-3-small")
      expect(described_class.dimensions).to eq(1536)
    end

    it "defaults to 768 for unknown models" do
      stub_config(provider: "fireworks", model: "some-unknown-model")
      expect(described_class.dimensions).to eq(768)
    end
  end

  describe ".provider and .model" do
    it "returns the configured provider" do
      expect(described_class.provider).to eq("fireworks")
    end

    it "returns the configured model" do
      expect(described_class.model).to eq("nomic-ai/nomic-embed-text-v1.5")
    end
  end

  describe "unsupported provider" do
    before do
      stub_config(provider: "cohere")
    end

    it "raises Error with supported providers list" do
      expect { described_class.embed("test") }.to raise_error(
        Rag::EmbeddingService::Error, /Unsupported embedding provider: cohere.*fireworks.*openai.*ollama/
      )
    end
  end
end
