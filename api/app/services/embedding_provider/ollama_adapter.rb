# frozen_string_literal: true

require "net/http"
require "json"

module EmbeddingProvider
  class OllamaAdapter < Base
    DEFAULT_MODEL = "nomic-embed-text"
    DEFAULT_HOST = "http://localhost:11434"

    def initialize(model: DEFAULT_MODEL, host: nil)
      @model = model
      @host = host || ENV.fetch("OLLAMA_HOST", DEFAULT_HOST)
    end

    def embed(text)
      response = request(text)
      response["embedding"]
    end

    def embed_batch(texts)
      texts.map { |t| embed(t) }
    end

    def dimensions
      case @model
      when "nomic-embed-text" then 768
      when "mxbai-embed-large" then 1024
      when "all-minilm" then 384
      else 768
      end
    end

    def model_name
      @model
    end

    private

    def request(text)
      uri = URI("#{@host}/api/embeddings")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == "https"
      req = Net::HTTP::Post.new(uri)
      req["Content-Type"] = "application/json"
      req.body = { model: @model, prompt: text }.to_json
      res = http.request(req)
      body = JSON.parse(res.body)
      unless res.is_a?(Net::HTTPSuccess)
        raise "Ollama embedding error: #{body['error'] || res.code}"
      end
      body
    end
  end
end
