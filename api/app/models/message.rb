# frozen_string_literal: true

class Message < ApplicationRecord
  belongs_to :conversation, touch: true

  validates :role, presence: true, inclusion: { in: %w[system user assistant tool] }

  attribute :tool_calls, :jsonb, default: -> { nil }
  attribute :cost_cents, :decimal, default: 0

  scope :chronological, -> { order(created_at: :asc) }

  # Build an OpenAI-compatible message hash
  def to_llm_format
    msg = { role: role, content: content }
    msg[:tool_calls] = tool_calls if tool_calls.present?
    msg[:tool_call_id] = tool_call_id if tool_call_id.present?
    msg[:name] = name if name.present?
    msg
  end
end
