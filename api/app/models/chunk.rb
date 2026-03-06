# frozen_string_literal: true

class Chunk < ApplicationRecord
  belongs_to :document
  has_one :embedding, dependent: :destroy

  validates :content, presence: true
  validates :position, presence: true, numericality: { greater_than_or_equal_to: 0 }

  delegate :document_collection, to: :document

  def estimated_token_count
    (content.length / 4.0).ceil
  end

  before_save :set_token_count

  private

  def set_token_count
    self.token_count = estimated_token_count if token_count.nil? || token_count.zero?
  end
end
