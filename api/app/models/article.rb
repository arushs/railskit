class Article < ApplicationRecord
  has_many :article_chunks, dependent: :destroy

  validates :title, presence: true
  validates :body, presence: true

  scope :published, -> { where.not(published_at: nil).where(published_at: ..Time.current) }

  def rechunk!
    transaction do
      article_chunks.destroy_all
      ArticleChunker.new(self).chunk!
    end
  end
end
