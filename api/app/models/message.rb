# frozen_string_literal: true

class Message < ApplicationRecord
  belongs_to :conversation, optional: true
  belongs_to :chat, optional: true, inverse_of: :messages

  validates :role, presence: true, inclusion: { in: %w[system user assistant tool] }
  validate :must_belong_to_conversation_or_chat

  scope :by_role, ->(role) { where(role: role) }
  scope :recent, ->(n = 10) { order(created_at: :desc).limit(n) }
  scope :chronological, -> { order(created_at: :asc) }

  def total_tokens
    (input_tokens || 0) + (output_tokens || 0)
  end

  private

  def must_belong_to_conversation_or_chat
    return if conversation_id.present? || chat_id.present?

    errors.add(:base, "Message must belong to a conversation or a chat")
  end
end
