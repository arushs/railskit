# frozen_string_literal: true

class Message < ApplicationRecord
  belongs_to :chat, inverse_of: :messages

  validates :role, presence: true, inclusion: { in: %w[system user assistant tool] }

  scope :by_role, ->(role) { where(role: role) }
  scope :recent, ->(n = 10) { order(created_at: :desc).limit(n) }
  scope :chronological, -> { order(created_at: :asc) }

  def total_tokens
    (input_tokens || 0) + (output_tokens || 0)
  end

  private
end
