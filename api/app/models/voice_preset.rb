# frozen_string_literal: true

class VoicePreset < ApplicationRecord
  has_many :voice_sessions, dependent: :nullify

  validates :name, presence: true, uniqueness: true
  validates :provider, presence: true, inclusion: { in: %w[elevenlabs] }
  validates :voice_id, presence: true

  scope :by_provider, ->(provider) { where(provider: provider) }
  scope :defaults, -> { where(default: true) }

  def settings_with_defaults
    default_settings.merge(settings || {})
  end

  private

  def default_settings
    case provider
    when "elevenlabs"
      { "stability" => 0.5, "similarity_boost" => 0.75, "style" => 0.0 }
    else
      {}
    end
  end
end
