# frozen_string_literal: true

module Rag
  # EmbeddingService generates vector embeddings for text.
  #
  # Supports multiple providers via adapter pattern:
  #   - openai (default) — OpenAI text-embedding-3-small
  #   - ollama — Local Ollama embeddings
  #
  # Usage:
  #   vector = Rag::EmbeddingService.embed("Hello world")
  #   vectors = Rag::EmbeddingService.embed_batch(["Hello", "World"])
  #
  class EmbeddingService
    PROVIDERS = {
      "openai" => :openai_embed,
      "ollama" => :ollama_embed
    }.freeze

    DEFAULT_MODEL = {
      "openai" => "text-embedding-3-small",
      "ollama" => "nomic-embed-text"
    }.freeze

    DIMENSIONS = {
      "text-embedding-3-small" => 1536,
      "text-embedding-3-large" => 3072,
      "text-embedding-ada-002" => 1536,
      "nomic-embed-text" => 768
    }.freeze

    class << self
      # Embed a single text string → Array of floats
      def embed(text)
        embed_batch([text]).first
      end

      # Embed multiple texts → Array of Arrays of floats
      def embed_batch(texts, batch_size: 100)
        return [] if texts.empty?

        provider = embedding_provider
        method_name = PROVIDERS[provider]
        raise "Unsupported embedding provider: #{provider}" unless method_name

        # Process in batches to avoid API limits
        texts.each_slice(batch_size).flat_map do |batch|
          send(method_name, batch)
        end
      end

      # Returns the dimension count for the configured model
      def dimensions
        DIMENSIONS[embedding_model] || 1536
      end

      private

      def openai_embed(texts)
        require "net/http"
        require "json"

        api_key = ENV.fetch("OPENAI_API_KEY")
        base_url = ENV.fetch("OPENAI_BASE_URL", "https://api.openai.com/v1")

        uri = URI("#{base_url}/embeddings")
        body = {
          model: embedding_model,
          input: texts
        }

        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = uri.scheme == "https"
        http.read_timeout = 60

        request = Net::HTTP::Post.new(uri)
        request["Authorization"] = "Bearer #{api_key}"
        request["Content-Type"] = "application/json"
        request.body = body.to_json

        response = http.request(request)
        unless response.code == "200"
          raise "OpenAI Embeddings API error: #{response.code} #{response.body}"
        end

        data = JSON.parse(response.body)
        data["data"]
          .sort_by { |d| d["index"] }
          .map { |d| d["embedding"] }
      end

      def ollama_embed(texts)
        require "net/http"
        require "json"

        base_url = ENV.fetch("OLLAMA_BASE_URL", "http://localhost:11434")

        # Ollama embeddings endpoint handles batch natively
        uri = URI("#{base_url}/api/embed")
        body = {
          model: embedding_model,
          input: texts
        }

        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = uri.scheme == "https"
        http.read_timeout = 120

        request = Net::HTTP::Post.new(uri)
        request["Content-Type"] = "application/json"
        request.body = body.to_json

        response = http.request(request)
        unless response.code == "200"
          raise "Ollama Embeddings API error: #{response.code} #{response.body}"
        end

        data = JSON.parse(response.body)
        data["embeddings"]
      end

      def embedding_provider
        config = Rails.application.config.railskit
        config.dig(:rag, :embedding_provider) || config.dig(:ai, :provider) || "openai"
      rescue
        "openai"
      end

      def embedding_model
        config = Rails.application.config.railskit
        config.dig(:rag, :embedding_model) || DEFAULT_MODEL[embedding_provider]
      rescue
        DEFAULT_MODEL["openai"]
      end
    end
  end
end
