# frozen_string_literal: true

require "net/http"
require "json"

module VectorStore
  class PineconeAdapter < Base
    def initialize(api_key: nil, index_host: nil, namespace: nil)
      @api_key = api_key || ENV.fetch("PINECONE_API_KEY")
      @index_host = index_host || ENV.fetch("PINECONE_INDEX_HOST")
      @namespace = namespace || ""
    end

    def store(chunk, vector)
      embedding = Embedding.create!(
        chunk: chunk, vector: vector.to_s,
        model_used: chunk.document_collection.embedding_model
      )
      upsert([{ id: chunk.id.to_s, values: vector,
        metadata: { document_id: chunk.document_id, collection_id: chunk.document_collection.id,
                    position: chunk.position, content: chunk.content.truncate(1000) } }])
      embedding
    end

    def search(query_vector, collection: nil, limit: 5, threshold: 0.0)
      filter = {}
      filter[:collection_id] = { "$eq" => collection.id } if collection
      body = { vector: query_vector, topK: limit, includeMetadata: true, namespace: @namespace }
      body[:filter] = filter if filter.any?
      response = request(:post, "/query", body)
      (response["matches"] || []).filter_map do |match|
        score = match["score"].to_f
        next if score < threshold
        chunk = Chunk.find_by(id: match["id"])
        next unless chunk
        { chunk: chunk, content: chunk.content, document: chunk.document, score: score, distance: 1.0 - score }
      end
    end

    def delete(chunk_id)
      request(:post, "/vectors/delete", { ids: [chunk_id.to_s], namespace: @namespace })
      Embedding.where(chunk_id: chunk_id).destroy_all
    end

    def delete_by_document(document_id)
      chunk_ids = Chunk.where(document_id: document_id).pluck(:id).map(&:to_s)
      return if chunk_ids.empty?
      chunk_ids.each_slice(100) { |batch| request(:post, "/vectors/delete", { ids: batch, namespace: @namespace }) }
      Embedding.where(chunk_id: chunk_ids).destroy_all
    end

    private

    def upsert(vectors)
      request(:post, "/vectors/upsert", { vectors: vectors, namespace: @namespace })
    end

    def request(method, path, body = nil)
      uri = URI("https://#{@index_host}#{path}")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      req = method == :post ? Net::HTTP::Post.new(uri) : Net::HTTP::Get.new(uri)
      req["Api-Key"] = @api_key
      req["Content-Type"] = "application/json"
      req.body = body.to_json if body
      res = http.request(req)
      return {} if res.body.blank?
      parsed = JSON.parse(res.body)
      raise "Pinecone API error: #{parsed['message'] || res.code}" unless res.is_a?(Net::HTTPSuccess)
      parsed
    end
  end
end
