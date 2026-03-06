# frozen_string_literal: true

module Api
  class CollectionsController < ApplicationController
    before_action :authenticate_user!
    before_action :set_collection, only: %i[show update destroy search]

    # GET /api/collections
    def index
      collections = current_user.collections.includes(:documents).order(updated_at: :desc)

      render json: collections.map { |c|
        {
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          documents_count: c.documents_count,
          created_at: c.created_at.iso8601,
          updated_at: c.updated_at.iso8601
        }
      }
    end

    # GET /api/collections/:id
    def show
      render json: {
        id: @collection.id,
        name: @collection.name,
        slug: @collection.slug,
        description: @collection.description,
        documents_count: @collection.documents_count,
        documents: @collection.documents.order(created_at: :desc).map { |d|
          document_json(d)
        },
        created_at: @collection.created_at.iso8601,
        updated_at: @collection.updated_at.iso8601
      }
    end

    # POST /api/collections
    def create
      collection = current_user.collections.build(collection_params)

      if collection.save
        render json: { id: collection.id, name: collection.name, slug: collection.slug }, status: :created
      else
        render json: { errors: collection.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # PATCH /api/collections/:id
    def update
      if @collection.update(collection_params)
        render json: { id: @collection.id, name: @collection.name, slug: @collection.slug }
      else
        render json: { errors: @collection.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # DELETE /api/collections/:id
    def destroy
      @collection.destroy
      head :no_content
    end

    # POST /api/collections/:id/search
    def search
      query = params.require(:query)
      limit = (params[:limit] || 5).to_i.clamp(1, 20)

      results = Rag::SearchService.search(query, collection: @collection, limit: limit)

      render json: {
        query: query,
        results: results.map { |r|
          chunk_content = r.chunk.is_a?(ActiveRecord::Relation) ? r.chunk.map(&:content).join("\n") : r.chunk.content
          {
            content: chunk_content,
            source: r.document_title,
            relevance: "#{(r.score * 100).round(1)}%",
            document_id: r.chunk.is_a?(ActiveRecord::Relation) ? r.chunk.first&.document_id : r.chunk.document_id
          }
        }
      }
    end

    private

    def set_collection
      @collection = current_user.collections.find(params[:id])
    end

    def collection_params
      params.permit(:name, :description)
    end

    def document_json(doc)
      {
        id: doc.id,
        title: doc.title,
        source_type: doc.source_type,
        content_type: doc.content_type,
        file_size: doc.file_size,
        status: doc.status,
        chunk_count: doc.chunk_count,
        created_at: doc.created_at.iso8601
      }
    end
  end
end
