# frozen_string_literal: true

class VoiceSession < ApplicationRecord
  belongs_to :chat
  belongs_to :user
  belongs_to :voice_preset, optional: true
  has_many :audio_segments, dependent: :destroy

  validates :status, presence: true, inclusion: { in: %w[active paused ended error] }
  validates :started_at, presence: true
  validates :audio_format, presence: true

  scope :active, -> { where(status: "active") }
  scope :ended, -> { where(status: "ended") }
  scope :for_user, ->(user) { where(user: user) }

  before_validation :set_started_at, on: :create

  def end_session!
    update!(
      status: "ended",
      ended_at: Time.current,
      duration: (Time.current - started_at).to_i
    )
  end

  def active?
    status == "active"
  end

  def total_duration
    audio_segments.sum(:duration) || 0.0
  end

  private

  def set_started_at
    self.started_at ||= Time.current
  end
end
