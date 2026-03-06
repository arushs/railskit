# frozen_string_literal: true

class Chunk < ApplicationRecord
  belongs_to :document

  has_neighbors :embedding

  validates :content, presence: true
  validates :position, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :by_position, -> { order(:position) }

  delegate :collection, to: :document
  delegate :title, to: :document, prefix: true

  # Returns surrounding chunks for context expansion
  def neighbors(radius: 1)
    document.chunks
      .where(position: (position - radius)..(position + radius))
      .order(:position)
  end
end
