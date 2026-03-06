class Article < ApplicationRecord
  has_many :article_chunks, dependent: :destroy

  validates :title, presence: true
  validates :body, presence: true

  after_create_commit :enqueue_embedding
  after_update_commit :enqueue_embedding, if: :saved_change_to_body?

  scope :published, -> { where.not(published_at: nil).where(published_at: ..Time.current) }

  def rechunk!
    transaction do
      article_chunks.destroy_all
      ArticleChunker.new(self).chunk!
    end
  end

  private

  def enqueue_embedding
    EmbedArticleChunksJob.perform_later(id)
  end
end
