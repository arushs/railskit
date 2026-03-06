# frozen_string_literal: true

class ProcessDocumentJob < ApplicationJob
  queue_as :default
  retry_on StandardError, wait: :polynomially_longer, attempts: 3

  def perform(document_id)
    document = Document.find(document_id)
    collection = document.document_collection

    text = TextExtractor.extract(document)
    raise "Empty text extracted from document ##{document.id}" if text.blank?

    strategy = Chunking.strategy(collection.chunking_strategy)
    chunk_texts = strategy.chunk(text, size: collection.chunk_size, overlap: collection.chunk_overlap)

    chunks = chunk_texts.each_with_index.map do |content, position|
      document.chunks.create!(content: content, position: position)
    end

    embedding_service = EmbeddingService.new
    chunks.each_slice(50) { |batch| embedding_service.embed_and_store_batch(batch) }

    document.mark_ready!
  rescue => e
    Rails.logger.error "[RAG] Failed to process document ##{document_id}: #{e.message}"
    Document.find_by(id: document_id)&.mark_error!(e.message)
    raise
  end
end
