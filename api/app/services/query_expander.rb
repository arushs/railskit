# frozen_string_literal: true

# Expands a user query into multiple search variants using Claude via RubyLLM.
#
# Produces three categories of expanded queries:
#   - lex:  keyword reformulations for BM25/full-text search
#   - vec:  semantically rephrased queries for vector search
#   - hyde: hypothetical document snippets (HyDE) for vector search
#
# Includes a BM25 probe: if the original query already has a strong keyword
# match (ts_rank >= 5.0 with a gap >= 2.0 to the second result), expansion
# is skipped to save latency and LLM cost.
#
# Usage:
#   expander = QueryExpander.new
#   result = expander.expand("how do I reset my password?")
#   result[:lex]  # => ["reset password", "password recovery steps"]
#   result[:vec]  # => ["process for resetting account password"]
#   result[:hyde] # => ["To reset your password, navigate to Settings..."]
#   result[:skipped] # => false
#
class QueryExpander
  BM25_STRONG_MATCH_THRESHOLD = 5.0
  BM25_GAP_THRESHOLD = 2.0

  EXPANSION_PROMPT = <<~PROMPT
    You are a search query expansion engine. Given a user query, generate search variants.

    Return ONLY valid JSON with this exact structure:
    {
      "lex": ["keyword reformulation 1", "keyword reformulation 2"],
      "vec": ["semantic rephrasing 1", "semantic rephrasing 2"],
      "hyde": ["A hypothetical document paragraph that would answer this query."]
    }

    Rules:
    - lex: 2-3 keyword-focused reformulations optimized for BM25/full-text search
    - vec: 2-3 semantically rephrased queries for embedding similarity search
    - hyde: 1 hypothetical document snippet (2-3 sentences) that would be a good answer
    - Do NOT repeat the original query verbatim
    - Keep lex queries short and keyword-dense
    - Keep vec queries natural and descriptive
    - No markdown, no explanation, ONLY the JSON object
  PROMPT

  class Error < StandardError; end

  def initialize(model: "claude-sonnet-4-20250514")
    @model = model
  end

  # Expand a query into search variants.
  # Returns Hash with keys :lex, :vec, :hyde, :skipped, :original
  def expand(query)
    return empty_result(query, skipped: true) if query.blank?

    # BM25 probe — check if original query already has a strong match
    if strong_bm25_match?(query)
      return empty_result(query, skipped: true)
    end

    variants = call_llm(query)
    {
      original: query,
      lex: Array(variants["lex"]).reject(&:blank?),
      vec: Array(variants["vec"]).reject(&:blank?),
      hyde: Array(variants["hyde"]).reject(&:blank?),
      skipped: false
    }
  rescue Error => e
    Rails.logger.warn("[QueryExpander] Expansion failed: #{e.message}, falling back to original query")
    empty_result(query, skipped: true)
  end

  private

  # Check if the original query has a strong BM25 match that doesn't need expansion.
  # Returns true if top result score >= threshold AND gap to #2 >= gap_threshold.
  def strong_bm25_match?(query)
    top_results = ArticleChunk
      .where("searchable @@ plainto_tsquery('english', ?)", query)
      .select(
        :id,
        Arel.sql("ts_rank(searchable, plainto_tsquery('english', #{ArticleChunk.connection.quote(query)})) AS rank_score")
      )
      .order(Arel.sql("rank_score DESC"))
      .limit(2)

    scores = top_results.map { |r| r[:rank_score].to_f }
    return false if scores.empty?

    top_score = scores[0]
    second_score = scores[1] || 0.0

    top_score >= BM25_STRONG_MATCH_THRESHOLD && (top_score - second_score) >= BM25_GAP_THRESHOLD
  end

  def call_llm(query)
    chat = RubyLLM.chat(model: @model)
    response = chat.ask("#{EXPANSION_PROMPT}\n\nUser query: #{query}")

    parse_json_response(response.content)
  rescue => e
    raise Error, "LLM call failed: #{e.message}"
  end

  def parse_json_response(content)
    # Extract JSON from response (handle potential markdown code blocks)
    json_str = content.strip
    json_str = json_str.gsub(/\A```(?:json)?\s*/, "").gsub(/\s*```\z/, "")

    parsed = JSON.parse(json_str)

    unless parsed.is_a?(Hash) && parsed.key?("lex") && parsed.key?("vec") && parsed.key?("hyde")
      raise Error, "Invalid expansion response structure"
    end

    parsed
  rescue JSON::ParserError => e
    raise Error, "Failed to parse LLM JSON response: #{e.message}"
  end

  def empty_result(query, skipped:)
    {
      original: query,
      lex: [],
      vec: [],
      hyde: [],
      skipped: skipped
    }
  end
end
