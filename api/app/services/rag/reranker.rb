# frozen_string_literal: true

module Rag
  # Reranker rescores search results using cross-encoder reranking with
  # position-aware score blending.
  #
  # Features:
  #   - Chunked processing: handles large result sets efficiently
  #   - Position bias: optionally boosts chunks near document start
  #   - Score blending: combines retrieval score with rerank score
  #   - Provider support: Fireworks Qwen3 reranker, or Cohere
  #
  # Usage:
  #   results = Rag::HybridSearchService.search("billing", limit: 20)
  #   reranked = Rag::Reranker.rerank("billing", results, limit: 5)
  #
  class Reranker
    PROVIDERS = {
      "fireworks" => :fireworks_rerank,
      "cohere"    => :cohere_rerank,
      "none"      => :passthrough_rerank
    }.freeze

    DEFAULT_MODEL = {
      "fireworks" => "fireworks/qwen3-reranker-8b",
      "cohere"    => "rerank-v3.5"
    }.freeze

    # Position decay function: score_multiplier = 1 / (1 + decay * position)
    DEFAULT_POSITION_DECAY = 0.02

    # Score blending: final = alpha * rerank_score + (1 - alpha) * retrieval_score
    DEFAULT_BLEND_ALPHA = 0.7

    # Process results in chunks of this size for API calls
    DEFAULT_CHUNK_SIZE = 25

    Result = Data.define(:chunk, :score, :rerank_score, :retrieval_score, :position_boost,
                         :document_title, :collection_name)

    class Error < StandardError; end

    class << self
      # Rerank search results
      # @param query [String] the search query
      # @param results [Array<HybridSearchService::Result>] initial results
      # @param limit [Integer] max results to return
      # @param chunk_size [Integer] batch size for reranking API calls
      # @param alpha [Float] blend weight for rerank score (0-1)
      # @param position_decay [Float] position bias decay factor (0 = no bias)
      # @param provider [String] reranking provider override
      # @return [Array<Result>]
      def rerank(query, results, limit: 5, chunk_size: DEFAULT_CHUNK_SIZE,
                 alpha: DEFAULT_BLEND_ALPHA, position_decay: DEFAULT_POSITION_DECAY,
                 provider: nil)
        return [] if results.empty? || query.blank?

        provider ||= rerank_provider
        method_name = PROVIDERS[provider]

        # If no reranker configured, do position-aware passthrough
        method_name ||= :passthrough_rerank

        # Process in chunks for large result sets
        rerank_scores = results.each_slice(chunk_size).flat_map.with_index do |batch, batch_idx|
          offset = batch_idx * chunk_size
          texts = batch.map { |r| r.chunk.content }

          if method_name == :passthrough_rerank
            passthrough_rerank(query, texts)
          else
            send(method_name, query, texts)
          end
        end

        # Blend scores with position awareness
        scored = results.each_with_index.map do |result, idx|
          rerank_score = normalize_score(rerank_scores[idx] || 0.0)
          retrieval_score = normalize_score(result.score)
          position = result.chunk.position

          # Position boost: earlier chunks get slight preference
          pos_boost = 1.0 / (1.0 + position_decay * position)

          # Blended score
          blended = (alpha * rerank_score + (1.0 - alpha) * retrieval_score) * pos_boost

          Result.new(
            chunk: result.chunk,
            score: blended.round(6),
            rerank_score: rerank_score.round(6),
            retrieval_score: retrieval_score.round(6),
            position_boost: pos_boost.round(6),
            document_title: result.document_title,
            collection_name: result.collection_name
          )
        end

        scored.sort_by { |s| -s.score }.first(limit)
      end

      private

      # Fireworks reranker via /v1/rerank endpoint
      def fireworks_rerank(query, texts)
        require "net/http"
        require "json"

        api_key = ENV.fetch("FIREWORKS_API_KEY") {
          raise Error, "FIREWORKS_API_KEY not set"
        }

        uri = URI("#{ENV.fetch('FIREWORKS_BASE_URL', 'https://api.fireworks.ai/inference/v1')}/rerank")
        body = {
          model: rerank_model,
          query: query,
          documents: texts,
          top_n: texts.length,
          return_documents: false
        }

        response = http_post(uri, body, "Bearer #{api_key}")
        data = JSON.parse(response.body)

        unless response.code == "200"
          error_msg = data.dig("error", "message") || data.to_s
          raise Error, "Fireworks Rerank API error (#{response.code}): #{error_msg}"
        end

        # API returns results sorted by score — map back to original order
        scores = Array.new(texts.length, 0.0)
        data["results"].each do |r|
          scores[r["index"]] = r["relevance_score"]
        end
        scores
      end

      # Cohere reranker
      def cohere_rerank(query, texts)
        require "net/http"
        require "json"

        api_key = ENV.fetch("COHERE_API_KEY") {
          raise Error, "COHERE_API_KEY not set"
        }

        uri = URI("https://api.cohere.ai/v1/rerank")
        body = {
          model: rerank_model,
          query: query,
          documents: texts,
          top_n: texts.length,
          return_documents: false
        }

        response = http_post(uri, body, "Bearer #{api_key}")
        data = JSON.parse(response.body)

        unless response.code == "200"
          raise Error, "Cohere Rerank API error (#{response.code}): #{data}"
        end

        scores = Array.new(texts.length, 0.0)
        data["results"].each do |r|
          scores[r["index"]] = r["relevance_score"]
        end
        scores
      end

      # No external reranker — assign scores based on original rank order
      def passthrough_rerank(_query, texts)
        # Linear decay from 1.0 to ~0.5 based on position in results
        texts.each_with_index.map do |_, idx|
          1.0 - (idx.to_f / [texts.length * 2, 1].max)
        end
      end

      def normalize_score(score)
        score.clamp(0.0, 1.0)
      end

      def http_post(uri, body, auth_header)
        require "net/http"
        require "json"

        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = uri.scheme == "https"
        http.read_timeout = 30
        http.open_timeout = 10

        request = Net::HTTP::Post.new(uri)
        request["Content-Type"] = "application/json"
        request["Authorization"] = auth_header
        request.body = body.to_json

        http.request(request)
      end

      def rerank_provider
        config = RailsKit.config
        if config.respond_to?(:rag) && config.rag.respond_to?(:rerank_provider)
          config.rag.rerank_provider || "none"
        else
          "none"
        end
      rescue
        "none"
      end

      def rerank_model
        config = RailsKit.config
        provider = rerank_provider
        if config.respond_to?(:rag) && config.rag.respond_to?(:rerank_model)
          config.rag.rerank_model || DEFAULT_MODEL[provider]
        else
          DEFAULT_MODEL[provider]
        end
      rescue
        DEFAULT_MODEL[rerank_provider]
      end
    end
  end
end
