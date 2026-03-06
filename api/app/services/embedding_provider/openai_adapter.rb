# frozen_string_literal: true

require "net/http"
require "json"

module EmbeddingProvider
  class OpenaiAdapter < Base
    DEFAULT_MODEL = "text-embedding-3-small"
    API_URL = "https://api.openai.com/v1/embeddings"
    DIMENSIONS = {
      "text-embedding-3-small" => 1536,
      "text-embedding-3-large" => 3072,
      "text-embedding-ada-002" => 1536
    }.freeze

    def initialize(model: DEFAULT_MODEL, api_key: nil)
      @model = model
      @api_key = api_key || ENV.fetch("OPENAI_API_KEY")
    end

    def embed(text)
      response = request(input: [text])
      response.dig("data", 0, "embedding")
    end

    def embed_batch(texts)
      batches = texts.each_slice(100).flat_map do |batch|
        response = request(input: batch)
        response["data"].sort_by { |d| d["index"] }.map { |d| d["embedding"] }
      end
      batches
    end

    def dimensions
      DIMENSIONS[@model] || 1536
    end

    def model_name
      @model
    end

    private

    def request(input:)
      uri = URI(API_URL)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      req = Net::HTTP::Post.new(uri)
      req["Authorization"] = "Bearer #{@api_key}"
      req["Content-Type"] = "application/json"
      req.body = { model: @model, input: input }.to_json
      res = http.request(req)
      body = JSON.parse(res.body)
      unless res.is_a?(Net::HTTPSuccess)
        raise "OpenAI Embedding API error: #{body['error']&.dig('message') || res.code}"
      end
      body
    end
  end
end
