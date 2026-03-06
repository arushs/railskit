# frozen_string_literal: true

class SearchDocumentsTool < RubyLLM::Tool
  description "Search the knowledge base for relevant documents."
  param :query, type: :string, desc: "What to search for", required: true
  param :collection, type: :string, desc: "Document collection name (optional)"
  param :limit, type: :integer, desc: "Max results (default: 5)"

  def execute(query:, collection: nil, limit: 5)
    collection_record = nil
    if collection.present?
      collection_record = DocumentCollection.find_by(name: collection)
      return { error: "Collection '#{collection}' not found" } unless collection_record
    end

    service = EmbeddingService.new
    results = service.search(query, collection: collection_record, limit: limit)
    {
      query: query,
      results: results.map do |r|
        { content: r[:content], source: r[:document].name,
          collection: r[:chunk].document_collection.name,
          score: r[:score].round(4), chunk_position: r[:chunk].position }
      end
    }
  end
end
