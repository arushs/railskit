# frozen_string_literal: true

module Api
  module V1
    class DocumentsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_collection
      before_action :set_document, only: [:show, :destroy, :reprocess]

      def index
        documents = @collection.documents.order(created_at: :desc)
        documents = documents.where(status: params[:status]) if params[:status].present?
        render json: documents.map { |d| document_json(d) }
      end

      def show
        render json: document_json(@document, include_chunks: params[:include_chunks] == "true")
      end

      def create
        return render json: { error: "File is required" }, status: :unprocessable_entity unless params[:file].present?

        document = @collection.documents.new(
          name: params[:file].original_filename, content_type: params[:file].content_type,
          size: params[:file].size, status: "processing", user: current_user
        )
        document.file.attach(params[:file])
        if document.save
          ProcessDocumentJob.perform_later(document.id)
          render json: document_json(document), status: :created
        else
          render json: { errors: document.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @document.destroy!
        head :no_content
      end

      def reprocess
        @document.reprocess!
        render json: document_json(@document)
      end

      private

      def set_collection
        @collection = DocumentCollection.find(params[:document_collection_id])
      end

      def set_document
        @document = @collection.documents.find(params[:id])
      end

      def document_json(document, include_chunks: false)
        json = { id: document.id, name: document.name, content_type: document.content_type,
                 size: document.size, status: document.status, error_message: document.error_message,
                 collection_id: document.document_collection_id, created_at: document.created_at, updated_at: document.updated_at }
        if include_chunks
          json[:chunks] = document.chunks.order(:position).map { |c|
            { id: c.id, position: c.position, token_count: c.token_count, content: c.content.truncate(500) }
          }
        end
        json
      end
    end
  end
end
