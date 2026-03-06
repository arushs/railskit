# frozen_string_literal: true

module Voice
  # TTSService converts text to speech audio via provider adapters.
  #
  # Usage:
  #   audio_data = Voice::TTSService.synthesize("Hello!", voice: "alloy")
  #   audio_data = Voice::TTSService.synthesize("Hi", provider: "elevenlabs", voice: "Rachel")
  #
  class TTSService
    class SynthesisError < StandardError; end

    PROVIDERS = {
      "openai" => :openai_synthesize,
      "elevenlabs" => :elevenlabs_synthesize
    }.freeze

    # OpenAI voices
    OPENAI_VOICES = %w[alloy echo fable onyx nova shimmer].freeze

    class << self
      # Returns raw audio bytes (mp3 by default)
      def synthesize(text, provider: nil, voice: nil, model: nil, format: "mp3", speed: 1.0)
        provider ||= default_provider
        voice ||= default_voice
        method_name = PROVIDERS[provider]
        raise SynthesisError, "Unsupported TTS provider: #{provider}" unless method_name

        send(method_name, text, voice: voice, model: model, format: format, speed: speed)
      end

      # Stream audio chunks for real-time playback
      def stream(text, provider: nil, voice: nil, model: nil, format: "mp3", &block)
        provider ||= default_provider
        voice ||= default_voice

        case provider
        when "openai" then openai_stream(text, voice: voice, model: model, format: format, &block)
        when "elevenlabs" then elevenlabs_stream(text, voice: voice, model: model, &block)
        else raise SynthesisError, "Streaming not supported for provider: #{provider}"
        end
      end

      private

      # ── OpenAI TTS ──

      def openai_synthesize(text, voice:, model:, format:, speed:)
        require "net/http"

        api_key = ENV.fetch("OPENAI_API_KEY")
        base_url = ENV.fetch("OPENAI_BASE_URL", "https://api.openai.com/v1")
        model ||= default_model("openai")

        uri = URI("#{base_url}/audio/speech")
        body = {
          model: model,
          input: text,
          voice: voice,
          response_format: format,
          speed: speed
        }

        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = uri.scheme == "https"
        http.read_timeout = 60

        request = Net::HTTP::Post.new(uri)
        request["Authorization"] = "Bearer #{api_key}"
        request["Content-Type"] = "application/json"
        request.body = body.to_json

        response = http.request(request)
        unless response.code == "200"
          raise SynthesisError, "OpenAI TTS error: #{response.code} #{response.body}"
        end

        response.body
      end

      def openai_stream(text, voice:, model:, format:, &block)
        require "net/http"

        api_key = ENV.fetch("OPENAI_API_KEY")
        base_url = ENV.fetch("OPENAI_BASE_URL", "https://api.openai.com/v1")
        model ||= default_model("openai")

        uri = URI("#{base_url}/audio/speech")
        body = {
          model: model,
          input: text,
          voice: voice,
          response_format: format || "mp3"
        }

        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = uri.scheme == "https"
        http.read_timeout = 60

        request = Net::HTTP::Post.new(uri)
        request["Authorization"] = "Bearer #{api_key}"
        request["Content-Type"] = "application/json"
        request.body = body.to_json

        http.request(request) do |response|
          unless response.code == "200"
            raise SynthesisError, "OpenAI TTS stream error: #{response.code}"
          end

          response.read_body do |chunk|
            block.call(chunk)
          end
        end
      end

      # ── ElevenLabs ──

      def elevenlabs_synthesize(text, voice:, model:, format:, speed:)
        require "net/http"

        api_key = ENV.fetch("ELEVENLABS_API_KEY")
        model ||= "eleven_turbo_v2_5"

        # Voice can be an ID or name — ElevenLabs API expects ID
        uri = URI("https://api.elevenlabs.io/v1/text-to-speech/#{voice}")

        body = {
          text: text,
          model_id: model,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        }

        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        http.read_timeout = 60

        request = Net::HTTP::Post.new(uri)
        request["xi-api-key"] = api_key
        request["Content-Type"] = "application/json"
        request["Accept"] = "audio/mpeg"
        request.body = body.to_json

        response = http.request(request)
        unless response.code == "200"
          raise SynthesisError, "ElevenLabs TTS error: #{response.code} #{response.body}"
        end

        response.body
      end

      def elevenlabs_stream(text, voice:, model:, &block)
        require "net/http"

        api_key = ENV.fetch("ELEVENLABS_API_KEY")
        model ||= "eleven_turbo_v2_5"

        uri = URI("https://api.elevenlabs.io/v1/text-to-speech/#{voice}/stream")

        body = {
          text: text,
          model_id: model,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        }

        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        http.read_timeout = 60

        request = Net::HTTP::Post.new(uri)
        request["xi-api-key"] = api_key
        request["Content-Type"] = "application/json"
        request["Accept"] = "audio/mpeg"
        request.body = body.to_json

        http.request(request) do |response|
          unless response.code == "200"
            raise SynthesisError, "ElevenLabs stream error: #{response.code}"
          end

          response.read_body do |chunk|
            block.call(chunk)
          end
        end
      end

      # ── Config Helpers ──

      def default_provider
        config = Rails.application.config.railskit
        config.dig(:voice, :tts_provider) || "openai"
      rescue
        "openai"
      end

      def default_voice
        config = Rails.application.config.railskit
        config.dig(:voice, :tts_voice) || "alloy"
      rescue
        "alloy"
      end

      def default_model(provider)
        config = Rails.application.config.railskit
        config.dig(:voice, :tts_model) || case provider
                                           when "openai" then "tts-1"
                                           when "elevenlabs" then "eleven_turbo_v2_5"
                                           end
      rescue
        "tts-1"
      end
    end
  end
end
