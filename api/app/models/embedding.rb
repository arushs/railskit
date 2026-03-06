# frozen_string_literal: true

class Embedding < ApplicationRecord
  belongs_to :chunk

  validates :vector, presence: true
  validates :model_used, presence: true
  validates :chunk_id, uniqueness: true

  delegate :document, to: :chunk
  delegate :document_collection, to: :chunk
end
