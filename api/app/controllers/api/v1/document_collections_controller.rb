# frozen_string_literal: true

module Api
  module V1
    class DocumentCollectionsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_collection, only: [:show, :update, :destroy]

      def index
        render json: DocumentCollection.all.order(:name).map { |c| collection_json(c) }
      end

      def show
        render json: collection_json(@collection, include_stats: true)
      end

      def create
        collection = DocumentCollection.new(collection_params)
        if collection.save
          render json: collection_json(collection), status: :created
        else
          render json: { errors: collection.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @collection.update(collection_params)
          render json: collection_json(@collection)
        else
          render json: { errors: @collection.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @collection.destroy!
        head :no_content
      end

      private

      def set_collection
        @collection = DocumentCollection.find(params[:id])
      end

      def collection_params
        params.require(:document_collection).permit(:name, :chunking_strategy, :chunk_size, :chunk_overlap, :embedding_model)
      end

      def collection_json(collection, include_stats: false)
        json = { id: collection.id, name: collection.name, chunking_strategy: collection.chunking_strategy,
                 chunk_size: collection.chunk_size, chunk_overlap: collection.chunk_overlap,
                 embedding_model: collection.embedding_model, created_at: collection.created_at, updated_at: collection.updated_at }
        if include_stats
          json[:document_count] = collection.documents.count
          json[:ready_count] = collection.documents.ready.count
          json[:chunk_count] = Chunk.joins(:document).where(documents: { document_collection_id: collection.id }).count
        end
        json
      end
    end
  end
end
