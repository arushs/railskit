# frozen_string_literal: true

class Document < ApplicationRecord
  belongs_to :collection, counter_cache: true
  has_many :chunks, dependent: :destroy

  has_one_attached :file

  validates :title, presence: true
  validates :status, presence: true, inclusion: { in: %w[pending processing ready error] }

  scope :pending, -> { where(status: "pending") }
  scope :processing, -> { where(status: "processing") }
  scope :ready, -> { where(status: "ready") }
  scope :errored, -> { where(status: "error") }

  after_create_commit :enqueue_processing

  def process!
    update!(status: "processing")
    extract_content!
    chunk_and_embed!
    update!(status: "ready")
  rescue StandardError => e
    update!(status: "error", error_message: "#{e.class}: #{e.message}")
    Rails.logger.error("[Document#process!] #{id}: #{e.message}\n#{e.backtrace&.first(5)&.join("\n")}")
  end

  def reprocess!
    chunks.destroy_all
    update!(status: "pending", error_message: nil, chunk_count: 0)
    enqueue_processing
  end

  def search(query, limit: 5)
    embedding = Rag::EmbeddingService.embed(query)
    chunks
      .nearest_neighbors(:embedding, embedding, distance: "cosine")
      .limit(limit)
  end

  private

  def extract_content!
    return if raw_content.present?

    if file.attached?
      self.raw_content = Rag::ContentExtractor.extract(file)
      self.content_type = file.content_type
      self.file_size = file.byte_size
      save!
    elsif source_url.present?
      result = Rag::ContentExtractor.extract_url(source_url)
      update!(raw_content: result[:content], content_type: result[:content_type])
    end
  end

  def chunk_and_embed!
    return unless raw_content.present?

    text_chunks = Rag::ChunkingService.chunk(raw_content, metadata: {
      document_id: id,
      title: title,
      source_type: source_type,
      content_type: content_type
    })

    # Batch embed all chunks
    texts = text_chunks.map { |c| c[:content] }
    embeddings = Rag::EmbeddingService.embed_batch(texts)

    # Create chunk records
    chunks_to_create = text_chunks.each_with_index.map do |chunk, i|
      {
        content: chunk[:content],
        position: i,
        start_offset: chunk[:start_offset],
        end_offset: chunk[:end_offset],
        token_count: chunk[:token_count],
        embedding: embeddings[i],
        metadata: chunk[:metadata] || {}
      }
    end

    chunks.insert_all!(chunks_to_create) if chunks_to_create.any?
    update!(chunk_count: chunks_to_create.size)
  end

  def enqueue_processing
    Rag::ProcessDocumentJob.perform_later(id)
  end
end
