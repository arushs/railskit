# frozen_string_literal: true

module Voice
  # STTService transcribes audio to text via provider adapters.
  #
  # Usage:
  #   text = Voice::STTService.transcribe(audio_data, format: "webm")
  #   text = Voice::STTService.transcribe(audio_data, provider: "deepgram", language: "en")
  #
  class STTService
    class TranscriptionError < StandardError; end

    PROVIDERS = {
      "openai" => :openai_transcribe,
      "deepgram" => :deepgram_transcribe
    }.freeze

    class << self
      def transcribe(audio_data, format: "webm", provider: nil, language: "en", model: nil)
        provider ||= default_provider
        method_name = PROVIDERS[provider]
        raise TranscriptionError, "Unsupported STT provider: #{provider}" unless method_name

        send(method_name, audio_data, format: format, language: language, model: model)
      end

      private

      # ── OpenAI Whisper ──

      def openai_transcribe(audio_data, format:, language:, model:)
        require "net/http"

        api_key = ENV.fetch("OPENAI_API_KEY")
        base_url = ENV.fetch("OPENAI_BASE_URL", "https://api.openai.com/v1")
        model ||= default_model("openai")

        uri = URI("#{base_url}/audio/transcriptions")

        # Build multipart form
        boundary = "----RailsKitSTT#{SecureRandom.hex(16)}"

        body = build_multipart(boundary, {
          "file" => { data: audio_data, filename: "audio.#{format}", content_type: mime_for(format) },
          "model" => model,
          "language" => language,
          "response_format" => "json"
        })

        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = uri.scheme == "https"
        http.read_timeout = 60

        request = Net::HTTP::Post.new(uri)
        request["Authorization"] = "Bearer #{api_key}"
        request["Content-Type"] = "multipart/form-data; boundary=#{boundary}"
        request.body = body

        response = http.request(request)
        unless response.code == "200"
          raise TranscriptionError, "OpenAI STT error: #{response.code} #{response.body}"
        end

        JSON.parse(response.body)["text"]
      end

      # ── Deepgram ──

      def deepgram_transcribe(audio_data, format:, language:, model:)
        require "net/http"

        api_key = ENV.fetch("DEEPGRAM_API_KEY")
        model ||= "nova-2"

        uri = URI("https://api.deepgram.com/v1/listen?model=#{model}&language=#{language}&smart_format=true")

        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        http.read_timeout = 60

        request = Net::HTTP::Post.new(uri)
        request["Authorization"] = "Token #{api_key}"
        request["Content-Type"] = mime_for(format)
        request.body = audio_data

        response = http.request(request)
        unless response.code == "200"
          raise TranscriptionError, "Deepgram STT error: #{response.code} #{response.body}"
        end

        data = JSON.parse(response.body)
        data.dig("results", "channels", 0, "alternatives", 0, "transcript").to_s
      end

      # ── Helpers ──

      def build_multipart(boundary, fields)
        parts = fields.map do |key, value|
          if value.is_a?(Hash) && value[:data]
            "--#{boundary}\r\n" \
            "Content-Disposition: form-data; name=\"#{key}\"; filename=\"#{value[:filename]}\"\r\n" \
            "Content-Type: #{value[:content_type]}\r\n\r\n" \
            "#{value[:data]}\r\n"
          else
            "--#{boundary}\r\n" \
            "Content-Disposition: form-data; name=\"#{key}\"\r\n\r\n" \
            "#{value}\r\n"
          end
        end
        parts.join + "--#{boundary}--\r\n"
      end

      def mime_for(format)
        case format.to_s.downcase
        when "webm" then "audio/webm"
        when "mp3" then "audio/mpeg"
        when "wav" then "audio/wav"
        when "ogg" then "audio/ogg"
        when "m4a" then "audio/mp4"
        when "flac" then "audio/flac"
        else "audio/#{format}"
        end
      end

      def default_provider
        config = Rails.application.config.railskit
        config.dig(:voice, :stt_provider) || "openai"
      rescue
        "openai"
      end

      def default_model(provider)
        config = Rails.application.config.railskit
        config.dig(:voice, :stt_model) || case provider
                                           when "openai" then "whisper-1"
                                           when "deepgram" then "nova-2"
                                           end
      rescue
        "whisper-1"
      end
    end
  end
end
