# frozen_string_literal: true

module Voice
  class SttBase
    attr_reader :on_transcript, :on_error, :options

    def initialize(on_transcript:, on_error: nil, **options)
      @on_transcript = on_transcript
      @on_error = on_error || ->(e) { Rails.logger.error("[STT] #{e}") }
      @options = options
    end

    def start
      raise NotImplementedError
    end

    def send_audio(audio_data)
      raise NotImplementedError
    end

    def stop
      raise NotImplementedError
    end

    def connected?
      raise NotImplementedError
    end
  end
end
