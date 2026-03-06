# frozen_string_literal: true

class Document < ApplicationRecord
  belongs_to :collection
  has_many :chunks, dependent: :destroy

  validates :title, presence: true
  validates :source_type, presence: true, inclusion: { in: %w[text url pdf html] }
  validates :status, presence: true, inclusion: { in: %w[pending processing ready error] }

  scope :ready, -> { where(status: "ready") }
  scope :pending, -> { where(status: "pending") }
end
