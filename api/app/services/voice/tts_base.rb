# frozen_string_literal: true

module Voice
  class TtsBase
    attr_reader :options

    def initialize(**options)
      @options = options
    end

    def synthesize(text, voice_preset:, &block)
      raise NotImplementedError
    end

    def synthesize_full(text, voice_preset:)
      raise NotImplementedError
    end

    def cancel!
      raise NotImplementedError
    end
  end
end
