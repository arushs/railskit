# frozen_string_literal: true

module Rag
  # EmbeddingService generates vector embeddings for text.
  #
  # Supports multiple providers via adapter pattern:
  #   - fireworks (default) — Fireworks AI with Nomic embed models
  #   - openai — OpenAI text-embedding-3-small/large
  #   - ollama — Local Ollama embeddings
  #
  # Usage:
  #   vector = Rag::EmbeddingService.embed("Hello world")
  #   vectors = Rag::EmbeddingService.embed_batch(["Hello", "World"])
  #
  # Configuration (railskit.yml):
  #   rag:
  #     embedding_provider: "fireworks"
  #     embedding_model: "nomic-ai/nomic-embed-text-v1.5"
  #
  class EmbeddingService
    PROVIDERS = {
      "fireworks" => :fireworks_embed,
      "openai"    => :openai_embed,
      "ollama"    => :ollama_embed
    }.freeze

    DEFAULT_MODEL = {
      "fireworks" => "nomic-ai/nomic-embed-text-v1.5",
      "openai"    => "text-embedding-3-small",
      "ollama"    => "nomic-embed-text"
    }.freeze

    DIMENSIONS = {
      # Fireworks / Nomic
      "nomic-ai/nomic-embed-text-v1.5" => 768,
      "nomic-ai/nomic-embed-text-v1"   => 768,
      # Fireworks can also run these but dimensions vary
      "thenlper/gte-large"             => 1024,
      "thenlper/gte-base"              => 768,
      "BAAI/bge-base-en-v1.5"         => 768,
      "BAAI/bge-small-en-v1.5"        => 384,
      "mixedbread-ai/mxbai-embed-large-v1" => 1024,
      # OpenAI
      "text-embedding-3-small"         => 1536,
      "text-embedding-3-large"         => 3072,
      "text-embedding-ada-002"         => 1536,
      # Ollama local
      "nomic-embed-text"               => 768
    }.freeze

    # Fireworks base URL (OpenAI-compatible)
    FIREWORKS_BASE_URL = "https://api.fireworks.ai/inference/v1"

    class Error < StandardError; end

    class << self
      # Embed a single text string → Array of floats
      def embed(text)
        embed_batch([text]).first
      end

      # Embed multiple texts → Array of Arrays of floats
      # @param texts [Array<String>] texts to embed
      # @param batch_size [Integer] max texts per API call
      # @return [Array<Array<Float>>]
      def embed_batch(texts, batch_size: 100)
        return [] if texts.empty?

        provider = embedding_provider
        method_name = PROVIDERS[provider]
        raise Error, "Unsupported embedding provider: #{provider}. Supported: #{PROVIDERS.keys.join(', ')}" unless method_name

        texts.each_slice(batch_size).flat_map do |batch|
          send(method_name, batch)
        end
      end

      # Returns the dimension count for the configured model
      def dimensions
        DIMENSIONS[embedding_model] || 768
      end

      # Returns current provider name
      def provider
        embedding_provider
      end

      # Returns current model name
      def model
        embedding_model
      end

      private

      # Fireworks AI embeddings (OpenAI-compatible endpoint)
      # Supports Nomic, BGE, GTE, MXBai, and other models
      def fireworks_embed(texts)
        api_key = ENV.fetch("FIREWORKS_API_KEY") {
          raise Error, "FIREWORKS_API_KEY not set. Get one at https://fireworks.ai/account/api-keys"
        }

        base_url = ENV.fetch("FIREWORKS_BASE_URL", FIREWORKS_BASE_URL)
        openai_compatible_embed(texts, api_key: api_key, base_url: base_url, auth_prefix: "Bearer")
      end

      # OpenAI embeddings
      def openai_embed(texts)
        api_key = ENV.fetch("OPENAI_API_KEY") {
          raise Error, "OPENAI_API_KEY not set"
        }

        base_url = ENV.fetch("OPENAI_BASE_URL", "https://api.openai.com/v1")
        openai_compatible_embed(texts, api_key: api_key, base_url: base_url, auth_prefix: "Bearer")
      end

      # Shared logic for OpenAI-compatible embedding APIs (Fireworks, OpenAI, etc.)
      def openai_compatible_embed(texts, api_key:, base_url:, auth_prefix: "Bearer")
        require "net/http"
        require "json"

        uri = URI("#{base_url}/embeddings")
        body = {
          model: embedding_model,
          input: texts
        }

        # Add dimensions param if model supports it and we want non-default
        configured_dims = dimensions
        if configured_dims && DIMENSIONS[embedding_model] && configured_dims != DIMENSIONS[embedding_model]
          body[:dimensions] = configured_dims
        end

        response = http_post(uri, body, "#{auth_prefix} #{api_key}")

        data = JSON.parse(response.body)
        unless response.code == "200"
          error_msg = data.dig("error", "message") || data.to_s
          raise Error, "Embeddings API error (#{response.code}): #{error_msg}"
        end

        data["data"]
          .sort_by { |d| d["index"] }
          .map { |d| d["embedding"] }
      end

      # Ollama local embeddings
      def ollama_embed(texts)
        require "net/http"
        require "json"

        base_url = ENV.fetch("OLLAMA_BASE_URL", "http://localhost:11434")
        uri = URI("#{base_url}/api/embed")
        body = {
          model: embedding_model,
          input: texts
        }

        response = http_post(uri, body)

        data = JSON.parse(response.body)
        unless response.code == "200"
          raise Error, "Ollama Embeddings error (#{response.code}): #{data}"
        end

        data["embeddings"]
      end

      # Shared HTTP POST helper
      def http_post(uri, body, auth_header = nil)
        require "net/http"
        require "json"

        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = uri.scheme == "https"
        http.read_timeout = 60
        http.open_timeout = 10

        request = Net::HTTP::Post.new(uri)
        request["Content-Type"] = "application/json"
        request["Authorization"] = auth_header if auth_header
        request.body = body.to_json

        http.request(request)
      end

      def embedding_provider
        config = RailsKit.config
        config.rag&.embedding_provider || "fireworks"
      rescue
        "fireworks"
      end

      def embedding_model
        config = RailsKit.config
        config.rag&.embedding_model || DEFAULT_MODEL[embedding_provider]
      rescue
        DEFAULT_MODEL[embedding_provider || "fireworks"]
      end
    end
  end
end
