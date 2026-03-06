# frozen_string_literal: true

module Api
  module V1
    class SearchController < ApplicationController
      before_action :authenticate_user!

      def search
        return render json: { error: "Query is required" }, status: :bad_request unless params[:query].present?

        collection = nil
        if params[:collection_id].present?
          collection = DocumentCollection.find(params[:collection_id])
        elsif params[:collection].present?
          collection = DocumentCollection.find_by!(name: params[:collection])
        end

        limit = (params[:limit] || 5).to_i
        threshold = (params[:threshold] || 0.0).to_f

        service = EmbeddingService.new
        results = service.search(params[:query], collection: collection, limit: limit, threshold: threshold)

        render json: {
          query: params[:query], collection: collection&.name,
          results: results.map { |r|
            { content: r[:content], source: r[:document].name, collection: r[:chunk].document_collection.name,
              score: r[:score].round(4), chunk_id: r[:chunk].id, chunk_position: r[:chunk].position }
          }
        }
      end
    end
  end
end
