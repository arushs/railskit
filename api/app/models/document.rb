# frozen_string_literal: true

class Document < ApplicationRecord
  belongs_to :document_collection
  belongs_to :user, optional: true
  has_many :chunks, dependent: :destroy
  has_one_attached :file

  validates :name, presence: true
  validates :status, presence: true, inclusion: { in: %w[processing ready error] }

  scope :processing, -> { where(status: "processing") }
  scope :ready, -> { where(status: "ready") }
  scope :errored, -> { where(status: "error") }

  def mark_ready!
    update!(status: "ready", error_message: nil)
  end

  def mark_error!(message)
    update!(status: "error", error_message: message)
  end

  def reprocess!
    chunks.destroy_all
    update!(status: "processing", error_message: nil)
    ProcessDocumentJob.perform_later(id)
  end
end
