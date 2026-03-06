# frozen_string_literal: true

module RailsKit
  # Add voice capabilities to any agent.
  #
  #   class MySupportAgent
  #     include RubyLLM::Agent
  #     include RailsKit::VoiceEnabled
  #
  #     voice_preset :friendly_female
  #     voice_response_mode :concise
  #   end
  module VoiceEnabled
    extend ActiveSupport::Concern

    included do
      class_attribute :_voice_preset_name, default: nil
      class_attribute :_voice_response_mode, default: :concise
    end

    class_methods do
      def voice_preset(name)
        self._voice_preset_name = name.to_s
      end

      def voice_response_mode(mode)
        self._voice_response_mode = mode
      end
    end

    def voice_preset_record
      return nil unless self.class._voice_preset_name
      VoicePreset.find_by(name: self.class._voice_preset_name)
    end

    def voice_enabled?
      self.class._voice_preset_name.present?
    end

    def voice_instructions
      base = respond_to?(:instructions) ? instructions : ""
      if self.class._voice_response_mode == :concise
        "#{base}\n\n#{concise_voice_prompt}"
      else
        base
      end
    end

    private

    def concise_voice_prompt
      <<~PROMPT.strip
        VOICE MODE ACTIVE: You are speaking in a real-time voice conversation.
        - Keep responses to 1-3 sentences maximum
        - Use natural, conversational language
        - Avoid bullet points, numbered lists, or formatted text
        - Don't use markdown, code blocks, or special formatting
        - Speak as if you're having a natural phone conversation
        - Use contractions and casual phrasing
        - If you need to convey complex information, break it into multiple turns
      PROMPT
    end
  end
end
