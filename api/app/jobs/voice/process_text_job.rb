# frozen_string_literal: true

module Voice
  class ProcessTextJob < ApplicationJob
    queue_as :voice

    def perform(voice_session_id:, text:)
      session = VoiceSession.find_by(id: voice_session_id)
      return unless session&.active?

      pipeline = Voice::Pipeline.new(session)

      pipeline.process_text(text) do |event|
        AudioChannel.broadcast_to(session, event)
      end
    end
  end
end
