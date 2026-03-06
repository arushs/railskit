# frozen_string_literal: true

class SearchDocumentsTool < RubyLLM::Tool
  description "Search the document knowledge base for relevant information. " \
              "Use this to find answers from uploaded documents, articles, and files."

  param :query, type: :string, desc: "The search query — be specific and descriptive", required: true
  param :collection, type: :string, desc: "Collection slug to search within (optional — searches all if omitted)"
  param :limit, type: :integer, desc: "Maximum number of results to return (default: 5)"

  def execute(query:, collection: nil, limit: 5)
    search_opts = { limit: limit }

    if collection.present?
      coll = Collection.find_by(slug: collection)
      return { error: "Collection '#{collection}' not found" } unless coll
      search_opts[:collection] = coll
    end

    results = Rag::SearchService.search(query, **search_opts)

    if results.empty?
      return { query: query, results: [], message: "No relevant documents found." }
    end

    {
      query: query,
      results: results.map do |r|
        chunk_content = r.chunk.is_a?(ActiveRecord::Relation) ? r.chunk.map(&:content).join("\n") : r.chunk.content
        {
          content: chunk_content,
          source: r.document_title,
          collection: r.collection_name,
          relevance: "#{(r.score * 100).round(1)}%"
        }
      end
    }
  end
end
