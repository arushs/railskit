# frozen_string_literal: true

class VoiceSession < ApplicationRecord
  belongs_to :user
  belongs_to :chat, optional: true

  validates :status, presence: true, inclusion: { in: %w[idle listening processing speaking error] }

  scope :active, -> { where.not(status: %w[error]) }

  attribute :status, :string, default: "idle"

  before_create :assign_defaults

  def active?
    status != "error"
  end

  def transition_to!(new_status)
    update!(status: new_status, last_activity_at: Time.current)
  end

  def increment_turn!
    increment!(:turn_count)
    touch(:last_activity_at)
  end

  # Ensure a linked chat exists for transcript persistence
  def ensure_chat!
    return chat if chat.present?

    new_chat = user.chats.create!(
      agent_class: agent_class || "HelpDeskAgent",
      metadata: { voice_session_id: id }
    )
    update!(chat: new_chat)
    new_chat
  end

  private

  def assign_defaults
    config = Rails.application.config.railskit
    self.stt_provider ||= config.dig(:voice, :stt_provider) || "openai"
    self.tts_provider ||= config.dig(:voice, :tts_provider) || "openai"
    self.tts_voice ||= config.dig(:voice, :tts_voice) || "alloy"
    self.agent_class ||= "HelpDeskAgent"
  rescue
    self.stt_provider ||= "openai"
    self.tts_provider ||= "openai"
    self.tts_voice ||= "alloy"
  end
end
