# frozen_string_literal: true

class AudioSegment < ApplicationRecord
  belongs_to :voice_session

  validates :content, presence: true
  validates :speaker, presence: true, inclusion: { in: %w[user agent] }

  scope :by_speaker, ->(speaker) { where(speaker: speaker) }
  scope :ordered, -> { order(:sequence_number) }

  before_create :set_sequence_number

  private

  def set_sequence_number
    self.sequence_number ||= (voice_session.audio_segments.maximum(:sequence_number) || 0) + 1
  end
end
