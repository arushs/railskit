# frozen_string_literal: true

module Api
  class SearchController < ApplicationController
    before_action :authenticate_user!

    # POST /api/search
    # Global search across all user's collections
    def create
      query = params.require(:query)
      limit = (params[:limit] || 5).to_i.clamp(1, 20)
      collection_ids = current_user.collection_ids

      if collection_ids.empty?
        return render json: { query: query, results: [], message: "No collections found." }
      end

      results = Rag::SearchService.search(query,
        collection_ids: collection_ids,
        limit: limit
      )

      render json: {
        query: query,
        results: results.map { |r|
          chunk = r.chunk.is_a?(ActiveRecord::Relation) ? r.chunk.first : r.chunk
          {
            content: r.chunk.is_a?(ActiveRecord::Relation) ? r.chunk.map(&:content).join("\n") : r.chunk.content,
            source: r.document_title,
            collection: r.collection_name,
            relevance: "#{(r.score * 100).round(1)}%",
            document_id: chunk&.document_id,
            collection_id: chunk&.document&.collection_id
          }
        }
      }
    end
  end
end
