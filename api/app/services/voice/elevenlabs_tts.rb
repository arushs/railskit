# frozen_string_literal: true

require "net/http"
require "json"
require "uri"

module Voice
  # Streaming Text-to-Speech client for ElevenLabs.
  class ElevenlabsTts < TtsBase
    BASE_URL = "https://api.elevenlabs.io/v1"

    def initialize(**options)
      super
      @api_key = options[:api_key] || Rails.application.credentials.dig(:elevenlabs, :api_key) || ENV["ELEVENLABS_API_KEY"]
      @cancelled = false
    end

    def synthesize(text, voice_preset:, &block)
      raise "ElevenLabs API key not configured" unless @api_key
      raise ArgumentError, "Block required for streaming synthesis" unless block

      @cancelled = false
      voice_id = voice_preset.voice_id
      settings = voice_preset.settings_with_defaults
      output_format = options.fetch(:output_format, "mp3_44100_128")

      uri = URI("#{BASE_URL}/text-to-speech/#{voice_id}/stream?output_format=#{output_format}")

      request = Net::HTTP::Post.new(uri)
      request["xi-api-key"] = @api_key
      request["Content-Type"] = "application/json"
      request["Accept"] = "audio/mpeg"

      request.body = JSON.generate({
        text: text,
        model_id: settings["model_id"] || "eleven_turbo_v2_5",
        voice_settings: {
          stability: settings["stability"] || 0.5,
          similarity_boost: settings["similarity_boost"] || 0.75,
          style: settings["style"] || 0.0,
          use_speaker_boost: settings["use_speaker_boost"] != false
        }
      })

      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.read_timeout = 30

      http.request(request) do |response|
        unless response.is_a?(Net::HTTPSuccess)
          raise "ElevenLabs API error (#{response.code}): #{response.body}"
        end

        response.read_body do |chunk|
          break if @cancelled
          yield chunk unless chunk.empty?
        end
      end
    rescue IOError, Errno::ECONNRESET => e
      Rails.logger.info("[ElevenlabsTts] Stream ended: #{e.message}") unless @cancelled
    end

    def synthesize_full(text, voice_preset:)
      buffer = +""
      synthesize(text, voice_preset: voice_preset) { |chunk| buffer << chunk }
      buffer
    end

    def cancel!
      @cancelled = true
    end

    def cancelled?
      @cancelled
    end
  end
end
