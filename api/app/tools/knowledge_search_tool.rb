# frozen_string_literal: true

class KnowledgeSearchTool < RubyLLM::Tool
  description "Search the knowledge base for help articles matching a query."
  param :query, type: :string, desc: "Search query", required: true
  param :limit, type: :integer, desc: "Max results (default: 3)"

  def execute(query:, limit: 3)
    results = HybridSearchService.new.search(query, limit: limit)

    formatted = results.map do |r|
      {
        title: r[:article_title],
        url: r[:url] || "/articles/#{r[:article_id]}",
        excerpt: truncate_text(r[:chunk_text], 200),
        score: r[:blended_score] || r[:rrf_score]
      }
    end

    { query: query, results: formatted }
  rescue => e
    Rails.logger.error("[KnowledgeSearchTool] Search failed: #{e.message}")
    { query: query, results: [], error: "Search temporarily unavailable" }
  end

  private

  def truncate_text(text, max_length)
    return "" if text.blank?
    return text if text.length <= max_length

    text[0, max_length].sub(/\s+\S*\z/, "") + "..."
  end
end
