# frozen_string_literal: true

require "net/http"
require "json"

# Reranks search results using a two-stage process:
#
# 1. **Chunk selection**: For each candidate from RRF, picks the best chunk
#    by keyword overlap with the query.
# 2. **API reranking**: Sends best chunks to Fireworks reranker API
#    (qwen3-reranker-8b model) to get relevance scores.
# 3. **Position-aware blending**: Blends RRF and reranker scores with
#    position-dependent weights:
#    - Ranks 1-3:   75% RRF / 25% reranker
#    - Ranks 4-10:  60% RRF / 40% reranker
#    - Ranks 11+:   40% RRF / 60% reranker
#
# Usage:
#   reranker = Reranker.new
#   reranked = reranker.rerank(query: "password reset", rrf_results: results)
#
class Reranker
  FIREWORKS_RERANK_URL = "https://api.fireworks.ai/inference/v1/rerank"
  MODEL = "accounts/fireworks/models/qwen3-reranker-8b"

  # Position-aware blending weights: [rrf_weight, reranker_weight]
  BLEND_WEIGHTS = {
    top:    [0.75, 0.25], # ranks 1-3
    middle: [0.60, 0.40], # ranks 4-10
    tail:   [0.40, 0.60]  # ranks 11+
  }.freeze

  class Error < StandardError; end
  class ApiError < Error; end

  # Rerank RRF results using chunked reranking with the Fireworks API.
  #
  # @param query [String] the search query
  # @param rrf_results [Array<Hash>] results from HybridSearchService with :chunk_id, :chunk_text, :rrf_score
  # @return [Array<Hash>] reranked results with added :reranker_score and :blended_score
  def rerank(query:, rrf_results:)
    return [] if rrf_results.empty? || query.blank?

    # Select best chunk text for each result based on keyword overlap
    documents = rrf_results.map { |r| best_chunk_text(r, query) }

    # Call Fireworks reranker API
    reranker_scores = call_reranker_api(query, documents)

    # Normalize RRF scores to 0-1 range
    max_rrf = rrf_results.map { |r| r[:rrf_score] }.max
    min_rrf = rrf_results.map { |r| r[:rrf_score] }.min
    rrf_range = max_rrf - min_rrf

    # Blend scores with position-aware weights
    rrf_results.each_with_index.map do |result, index|
      rank = index + 1
      weights = blend_weights_for_rank(rank)

      # Normalize RRF score to 0-1
      normalized_rrf = rrf_range.positive? ? (result[:rrf_score] - min_rrf) / rrf_range : 1.0

      reranker_score = reranker_scores[index] || 0.0
      blended = (weights[0] * normalized_rrf) + (weights[1] * reranker_score)

      result.merge(
        reranker_score: reranker_score,
        blended_score: blended
      )
    end.sort_by { |r| -r[:blended_score] }
  rescue ApiError => e
    Rails.logger.warn("[Reranker] API call failed: #{e.message}, returning original RRF order")
    rrf_results
  end

  private

  # Extract the best chunk of text from a result for reranking.
  # Uses keyword overlap with the query to pick the most relevant portion.
  def best_chunk_text(result, query)
    text = result[:chunk_text].to_s
    return text if text.length <= 512

    query_terms = query.downcase.split(/\W+/).reject { |t| t.length < 3 }.uniq
    return text.first(512) if query_terms.empty?

    # Split into ~256 char windows with 128 char overlap
    windows = []
    pos = 0
    while pos < text.length
      window = text[pos, 256]
      windows << { text: window, pos: pos }
      pos += 128
    end

    # Score each window by keyword overlap
    best = windows.max_by do |w|
      w_lower = w[:text].downcase
      query_terms.count { |term| w_lower.include?(term) }
    end

    best ? best[:text] : text.first(512)
  end

  def blend_weights_for_rank(rank)
    case rank
    when 1..3 then BLEND_WEIGHTS[:top]
    when 4..10 then BLEND_WEIGHTS[:middle]
    else BLEND_WEIGHTS[:tail]
    end
  end

  def call_reranker_api(query, documents)
    uri = URI(FIREWORKS_RERANK_URL)
    request = Net::HTTP::Post.new(uri)
    request["Authorization"] = "Bearer #{api_key}"
    request["Content-Type"] = "application/json"
    request.body = {
      model: MODEL,
      query: query,
      documents: documents,
      top_n: documents.length
    }.to_json

    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true, open_timeout: 10, read_timeout: 30) do |http|
      http.request(request)
    end

    unless response.is_a?(Net::HTTPSuccess)
      raise ApiError, "Fireworks Reranker API error (#{response.code}): #{response.body}"
    end

    parsed = JSON.parse(response.body)

    # Build a score array indexed by original document position
    scores = Array.new(documents.length, 0.0)
    parsed["results"].each do |result|
      scores[result["index"]] = result["relevance_score"].to_f
    end

    # Normalize reranker scores to 0-1
    max_score = scores.max
    if max_score && max_score.positive?
      scores.map { |s| s / max_score }
    else
      scores
    end
  end

  def api_key
    key = ENV["FIREWORKS_API_KEY"].presence ||
          Rails.application.credentials.dig(:fireworks, :api_key)
    raise ApiError, "FIREWORKS_API_KEY is not configured" if key.blank?

    key
  end
end
