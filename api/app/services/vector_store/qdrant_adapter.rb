# frozen_string_literal: true

require "net/http"
require "json"

module VectorStore
  class QdrantAdapter < Base
    def initialize(url: nil, api_key: nil, collection_name: "railskit_embeddings")
      @url = url || ENV.fetch("QDRANT_URL", "http://localhost:6333")
      @api_key = api_key || ENV["QDRANT_API_KEY"]
      @collection_name = collection_name
    end

    def store(chunk, vector)
      embedding = Embedding.create!(
        chunk: chunk, vector: vector.to_s,
        model_used: chunk.document_collection.embedding_model
      )
      request(:put, "/collections/#{@collection_name}/points", {
        points: [{ id: chunk.id, vector: vector,
          payload: { document_id: chunk.document_id, collection_id: chunk.document_collection.id,
                     position: chunk.position, content: chunk.content.truncate(1000) } }]
      })
      embedding
    end

    def search(query_vector, collection: nil, limit: 5, threshold: 0.0)
      body = { vector: query_vector, limit: limit, with_payload: true, score_threshold: threshold }
      if collection
        body[:filter] = { must: [{ key: "collection_id", match: { value: collection.id } }] }
      end
      response = request(:post, "/collections/#{@collection_name}/points/search", body)
      (response["result"] || []).filter_map do |result|
        chunk = Chunk.find_by(id: result["id"])
        next unless chunk
        { chunk: chunk, content: chunk.content, document: chunk.document,
          score: result["score"].to_f, distance: 1.0 - result["score"].to_f }
      end
    end

    def delete(chunk_id)
      request(:post, "/collections/#{@collection_name}/points/delete", { points: [chunk_id] })
      Embedding.where(chunk_id: chunk_id).destroy_all
    end

    def delete_by_document(document_id)
      chunk_ids = Chunk.where(document_id: document_id).pluck(:id)
      return if chunk_ids.empty?
      request(:post, "/collections/#{@collection_name}/points/delete", { points: chunk_ids })
      Embedding.where(chunk_id: chunk_ids).destroy_all
    end

    def ensure_collection!(dimensions:)
      request(:put, "/collections/#{@collection_name}", { vectors: { size: dimensions, distance: "Cosine" } })
    end

    private

    def request(method, path, body = nil)
      uri = URI("#{@url}#{path}")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == "https"
      req = case method
            when :put then Net::HTTP::Put.new(uri)
            when :post then Net::HTTP::Post.new(uri)
            else Net::HTTP::Get.new(uri)
            end
      req["Content-Type"] = "application/json"
      req["api-key"] = @api_key if @api_key
      req.body = body.to_json if body
      res = http.request(req)
      return {} if res.body.blank?
      parsed = JSON.parse(res.body)
      raise "Qdrant API error: #{parsed.dig('status', 'error') || res.code}" unless res.is_a?(Net::HTTPSuccess)
      parsed
    end
  end
end
