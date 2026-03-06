# frozen_string_literal: true

module Voice
  class ProcessAudioJob < ApplicationJob
    queue_as :voice

    def perform(voice_session_id:, audio_data:, format:)
      session = VoiceSession.find_by(id: voice_session_id)
      return unless session&.active?

      pipeline = Voice::Pipeline.new(session)
      decoded_audio = Base64.decode64(audio_data)

      pipeline.process_audio(decoded_audio, format: format) do |event|
        AudioChannel.broadcast_to(session, event)
      end
    end
  end
end
