# frozen_string_literal: true

class Conversation < ApplicationRecord
  belongs_to :user
  has_many :messages, -> { order(created_at: :asc) }, dependent: :destroy

  validates :model, presence: true

  # Defaults
  attribute :model, :string, default: -> { RailsKit.config.dig(:ai, :default_model) || "gpt-4o" }
  attribute :provider, :string, default: -> { RailsKit.config.dig(:ai, :default_provider) || "openai" }
  attribute :metadata, :jsonb, default: -> { {} }

  scope :recent, -> { order(updated_at: :desc) }

  def message_history
    messages.map do |msg|
      {
        role: msg.role,
        content: msg.content,
        tool_calls: msg.tool_calls,
        tool_call_id: msg.tool_call_id,
        name: msg.name
      }.compact
    end
  end

  def total_tokens
    messages.sum(:token_count)
  end

  def total_cost_cents
    messages.sum(:cost_cents)
  end
end
