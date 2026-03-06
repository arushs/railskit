# frozen_string_literal: true

class KnowledgeSearchTool < RubyLLM::Tool
  description "Search the knowledge base for relevant articles and documentation. " \
              "Returns the most relevant chunks with source attribution. " \
              "Supports hybrid search (vector + full-text) with optional query expansion."
  param :query, type: :string, desc: "Search query — be specific for best results", required: true
  param :limit, type: :integer, desc: "Max results to return (default: 5, max: 20)"
  param :collection, type: :string, desc: "Filter by collection name (optional)"
  param :mode, type: :string, desc: "Search mode: hybrid (default), vector, or lexical"
  param :expand, type: :string, desc: "Query expansion: hyde, lexical, vector, multi, or none (default: none)"

  def execute(query:, limit: 5, collection: nil, mode: "hybrid", expand: "none")
    limit = [[limit.to_i, 1].max, 20].min
    mode = validate_mode(mode)
    expand_strategy = validate_expand(expand)

    search_opts = {
      limit: limit,
      mode: mode,
      rerank: limit > 3 # auto-enable reranking for larger result sets
    }

    # Scope to collection if specified
    if collection.present?
      col = Collection.find_by(name: collection)
      return { query: query, results: [], error: "Collection '#{collection}' not found" } unless col
      search_opts[:collection] = col
    end

    # Apply expansion strategy
    search_opts[:expand] = expand_strategy if expand_strategy

    results = Rag::HybridSearchService.search(query, **search_opts)

    {
      query: query,
      mode: mode.to_s,
      expanded: expand_strategy ? expand_strategy.to_s : "none",
      result_count: results.length,
      results: results.map { |r| format_result(r) }
    }
  rescue => e
    Rails.logger.error("[KnowledgeSearchTool] Search failed: #{e.class}: #{e.message}")
    { query: query, results: [], error: "Search failed: #{e.message}" }
  end

  private

  def format_result(result)
    {
      title: result.document_title,
      collection: result.collection_name,
      content: result.chunk.content,
      relevance: (result.score * 100).round(1),
      position: result.chunk.position,
      document_id: result.chunk.document_id,
      metadata: result.chunk.metadata
    }
  end

  def validate_mode(mode)
    sym = mode.to_s.to_sym
    return sym if Rag::HybridSearchService::MODES.include?(sym)
    :hybrid
  end

  def validate_expand(expand)
    return nil if expand.blank? || expand == "none"
    sym = expand.to_s.to_sym
    return sym if Rag::HybridSearchService::EXPAND_STRATEGIES.include?(sym)
    nil
  end
end
