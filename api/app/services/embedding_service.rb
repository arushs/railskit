# frozen_string_literal: true

require "net/http"
require "json"

# Service for generating text embeddings via Fireworks AI API
# using the nomic-embed-text-v1.5 model (768 dimensions).
#
# Nomic conventions:
#   - Document text is prefixed with "search_document: "
#   - Query text is prefixed with "search_query: "
#
# Usage:
#   EmbeddingService.embed_text("Hello world")              # => Array<Float> (768-dim)
#   EmbeddingService.embed_query("search terms")            # => Array<Float> (768-dim)
#   EmbeddingService.embed_batch(["doc one", "doc two"])     # => Array<Array<Float>>
#
class EmbeddingService
  FIREWORKS_URL = "https://api.fireworks.ai/inference/v1/embeddings"
  MODEL = "nomic-ai/nomic-embed-text-v1.5"
  DIMENSIONS = 768
  BATCH_SIZE = 50

  class Error < StandardError; end
  class ConfigurationError < Error; end
  class ApiError < Error; end

  class << self
    # Embed a single text string (document). Automatically prefixes with "search_document: ".
    # Returns a 768-dim array of floats.
    def embed_text(text)
      raise ArgumentError, "text cannot be blank" if text.blank?

      prefixed = "search_document: #{text}"
      response = call_api([prefixed])
      response.first
    end

    # Embed a query string. Prefixes with "search_query: " per Nomic conventions.
    # Returns a 768-dim array of floats.
    def embed_query(text)
      raise ArgumentError, "text cannot be blank" if text.blank?

      prefixed = "search_query: #{text}"
      response = call_api([prefixed])
      response.first
    end

    # Embed multiple texts in batches of 50, processing batches in parallel.
    # Each text is prefixed with "search_document: ".
    # Returns an array of 768-dim float arrays, in the same order as input.
    def embed_batch(texts)
      raise ArgumentError, "texts cannot be empty" if texts.blank?

      prefixed = texts.map { |t| "search_document: #{t}" }
      batches = prefixed.each_slice(BATCH_SIZE).to_a

      if batches.size == 1
        return call_api(batches.first)
      end

      # Process batches in parallel using threads
      results = Array.new(batches.size)
      threads = batches.each_with_index.map do |batch, idx|
        Thread.new do
          results[idx] = call_api(batch)
        end
      end

      threads.each(&:join)
      results.flatten(1)
    end

    private

    def api_key
      key = ENV["FIREWORKS_API_KEY"].presence ||
            Rails.application.credentials.dig(:fireworks, :api_key)
      raise ConfigurationError, "FIREWORKS_API_KEY is not configured" if key.blank?

      key
    end

    def call_api(inputs)
      uri = URI(FIREWORKS_URL)
      request = Net::HTTP::Post.new(uri)
      request["Authorization"] = "Bearer #{api_key}"
      request["Content-Type"] = "application/json"
      request.body = {
        model: MODEL,
        input: inputs,
        dimensions: DIMENSIONS
      }.to_json

      response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true, open_timeout: 10, read_timeout: 30) do |http|
        http.request(request)
      end

      unless response.is_a?(Net::HTTPSuccess)
        raise ApiError, "Fireworks API error (#{response.code}): #{response.body}"
      end

      parsed = JSON.parse(response.body)
      parsed["data"]
        .sort_by { |d| d["index"] }
        .map { |d| d["embedding"] }
    end
  end
end
