# frozen_string_literal: true

module Api
  class DocumentsController < ApplicationController
    before_action :authenticate_user!
    before_action :set_collection
    before_action :set_document, only: %i[show destroy reprocess]

    # GET /api/collections/:collection_id/documents
    def index
      documents = @collection.documents.order(created_at: :desc)

      render json: documents.map { |d| document_json(d) }
    end

    # GET /api/collections/:collection_id/documents/:id
    def show
      render json: document_json(@document).merge(
        raw_content: @document.raw_content&.truncate(5000),
        error_message: @document.error_message,
        chunks_preview: @document.chunks.by_position.limit(3).map { |c|
          { position: c.position, content: c.content.truncate(200), token_count: c.token_count }
        }
      )
    end

    # POST /api/collections/:collection_id/documents
    # Accepts file upload, URL, or raw text
    def create
      document = @collection.documents.build(document_params)

      if params[:file].present?
        document.source_type = "file"
        document.file.attach(params[:file])
        document.title ||= params[:file].original_filename
        document.content_type = params[:file].content_type
        document.file_size = params[:file].size
      elsif params[:url].present?
        document.source_type = "url"
        document.source_url = params[:url]
        document.title ||= params[:url]
      elsif params[:content].present?
        document.source_type = "text"
        document.raw_content = params[:content]
        document.content_type = "text/plain"
        document.title ||= params[:content].truncate(60)
      else
        return render json: { error: "Provide file, url, or content" }, status: :unprocessable_entity
      end

      if document.save
        render json: document_json(document), status: :created
      else
        render json: { errors: document.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # DELETE /api/collections/:collection_id/documents/:id
    def destroy
      @document.destroy
      head :no_content
    end

    # POST /api/collections/:collection_id/documents/:id/reprocess
    def reprocess
      @document.reprocess!
      render json: document_json(@document.reload)
    end

    private

    def set_collection
      @collection = current_user.collections.find(params[:collection_id])
    end

    def set_document
      @document = @collection.documents.find(params[:id])
    end

    def document_params
      params.permit(:title, :source_type, metadata: {})
    end

    def document_json(doc)
      {
        id: doc.id,
        title: doc.title,
        source_type: doc.source_type,
        source_url: doc.source_url,
        content_type: doc.content_type,
        file_size: doc.file_size,
        status: doc.status,
        chunk_count: doc.chunk_count,
        created_at: doc.created_at.iso8601,
        updated_at: doc.updated_at.iso8601
      }
    end
  end
end
