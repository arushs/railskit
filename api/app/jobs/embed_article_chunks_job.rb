# frozen_string_literal: true

# Generates embeddings for all chunks of an article.
# Triggered automatically on Article create/update when body changes.
class EmbedArticleChunksJob < ApplicationJob
  queue_as :default

  def perform(article_id)
    article = Article.find_by(id: article_id)
    return unless article

    # Re-chunk the article (destroys old chunks, creates new ones)
    article.rechunk!

    chunks = article.article_chunks.reload.order(:chunk_index)
    return if chunks.empty?

    texts = chunks.map(&:chunk_text)
    embeddings = EmbeddingService.embed_batch(texts)

    # Bulk-update embeddings
    ArticleChunk.transaction do
      chunks.zip(embeddings).each do |chunk, embedding|
        chunk.update_columns(embedding: embedding)
      end
    end
  end
end
