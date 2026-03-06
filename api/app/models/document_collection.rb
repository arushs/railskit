# frozen_string_literal: true

class DocumentCollection < ApplicationRecord
  has_many :documents, dependent: :destroy

  validates :name, presence: true, uniqueness: true
  validates :chunking_strategy, presence: true,
            inclusion: { in: %w[paragraph page semantic sliding_window markdown] }
  validates :chunk_size, presence: true, numericality: { greater_than: 0 }
  validates :chunk_overlap, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :embedding_model, presence: true

  validate :overlap_less_than_size

  private

  def overlap_less_than_size
    return unless chunk_size && chunk_overlap
    errors.add(:chunk_overlap, "must be less than chunk_size") if chunk_overlap >= chunk_size
  end
end
