# frozen_string_literal: true

class Collection < ApplicationRecord
  belongs_to :user, optional: true
  has_many :documents, dependent: :destroy
  has_many :chunks, through: :documents

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true

  before_validation :generate_slug, on: :create

  scope :for_user, ->(user) { where(user: user) }

  def search(query, limit: 5)
    embedding = Rag::EmbeddingService.embed(query)
    chunks
      .nearest_neighbors(:embedding, embedding, distance: "cosine")
      .limit(limit)
  end

  def reindex!
    documents.ready.find_each(&:reprocess!)
  end

  private

  def generate_slug
    self.slug ||= name&.parameterize
  end
end
