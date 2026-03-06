# frozen_string_literal: true

require "rails_helper"

RSpec.describe EmbeddingService do
  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("FIREWORKS_API_KEY").and_return("test-api-key")
  end

  describe ".embed_text" do
    it "returns a 768-dim embedding for a single text" do
      embedding = fake_embedding
      stub_fireworks_embeddings(count: 1, embeddings: [{ "object" => "embedding", "index" => 0, "embedding" => embedding }])

      result = described_class.embed_text("Hello world")

      expect(result).to eq(embedding)
      expect(result.length).to eq(768)
    end

    it "prefixes text with 'search_document: '" do
      stub_fireworks_embeddings(count: 1)

      described_class.embed_text("Hello world")

      expect(WebMock).to have_requested(:post, EmbeddingService::FIREWORKS_URL)
        .with { |req| JSON.parse(req.body)["input"] == ["search_document: Hello world"] }
    end

    it "raises ArgumentError for blank text" do
      expect { described_class.embed_text("") }.to raise_error(ArgumentError, /blank/)
      expect { described_class.embed_text(nil) }.to raise_error(ArgumentError, /blank/)
    end
  end

  describe ".embed_query" do
    it "returns a 768-dim embedding" do
      stub_fireworks_embeddings(count: 1)

      result = described_class.embed_query("search terms")

      expect(result.length).to eq(768)
    end

    it "prefixes text with 'search_query: '" do
      stub_fireworks_embeddings(count: 1)

      described_class.embed_query("search terms")

      expect(WebMock).to have_requested(:post, EmbeddingService::FIREWORKS_URL)
        .with { |req| JSON.parse(req.body)["input"] == ["search_query: search terms"] }
    end

    it "raises ArgumentError for blank text" do
      expect { described_class.embed_query("") }.to raise_error(ArgumentError, /blank/)
    end
  end

  describe ".embed_batch" do
    it "returns embeddings for multiple texts" do
      texts = ["doc one", "doc two", "doc three"]
      stub_fireworks_embeddings(count: 3)

      result = described_class.embed_batch(texts)

      expect(result.length).to eq(3)
      expect(result.all? { |e| e.length == 768 }).to be true
    end

    it "prefixes each text with 'search_document: '" do
      texts = ["doc one", "doc two"]
      stub_fireworks_embeddings(count: 2)

      described_class.embed_batch(texts)

      expect(WebMock).to have_requested(:post, EmbeddingService::FIREWORKS_URL)
        .with { |req|
          input = JSON.parse(req.body)["input"]
          input == ["search_document: doc one", "search_document: doc two"]
        }
    end

    it "splits into batches of 50 and processes in parallel" do
      texts = Array.new(120) { |i| "text #{i}" }

      # Stub 3 separate API calls (50 + 50 + 20)
      stub_request(:post, EmbeddingService::FIREWORKS_URL)
        .to_return { |request|
          input = JSON.parse(request.body)["input"]
          embeddings = input.each_with_index.map { |_, i| { "object" => "embedding", "index" => i, "embedding" => fake_embedding } }
          {
            status: 200,
            headers: { "Content-Type" => "application/json" },
            body: { object: "list", data: embeddings, model: "nomic-ai/nomic-embed-text-v1.5", usage: {} }.to_json
          }
        }

      result = described_class.embed_batch(texts)

      expect(result.length).to eq(120)
      # Should have made 3 API calls (50 + 50 + 20)
      expect(WebMock).to have_requested(:post, EmbeddingService::FIREWORKS_URL).times(3)
    end

    it "raises ArgumentError for empty input" do
      expect { described_class.embed_batch([]) }.to raise_error(ArgumentError, /empty/)
    end
  end

  describe "error handling" do
    it "raises ApiError on non-success HTTP response" do
      stub_fireworks_embeddings_error(status: 429, body: "Rate limited")

      expect { described_class.embed_text("test") }.to raise_error(EmbeddingService::ApiError, /429/)
    end

    it "raises ConfigurationError when API key is missing" do
      allow(ENV).to receive(:[]).with("FIREWORKS_API_KEY").and_return(nil)
      allow(Rails.application.credentials).to receive(:dig).with(:fireworks, :api_key).and_return(nil)

      expect { described_class.embed_text("test") }.to raise_error(EmbeddingService::ConfigurationError, /not configured/)
    end
  end

  describe "API request format" do
    it "sends correct model and dimensions" do
      stub_fireworks_embeddings(count: 1)

      described_class.embed_text("test")

      expect(WebMock).to have_requested(:post, EmbeddingService::FIREWORKS_URL)
        .with { |req|
          body = JSON.parse(req.body)
          body["model"] == "nomic-ai/nomic-embed-text-v1.5" &&
            body["dimensions"] == 768
        }
    end

    it "sends Authorization header with Bearer token" do
      stub_fireworks_embeddings(count: 1)

      described_class.embed_text("test")

      expect(WebMock).to have_requested(:post, EmbeddingService::FIREWORKS_URL)
        .with(headers: { "Authorization" => "Bearer test-api-key" })
    end
  end
end
