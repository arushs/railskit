# frozen_string_literal: true

require "websocket-client-simple"
require "json"

module Voice
  # Streaming Speech-to-Text client for Deepgram.
  # Connects via WebSocket for real-time transcription.
  class DeepgramStt < SttBase
    DEEPGRAM_WS_URL = "wss://api.deepgram.com/v1/listen"

    def initialize(on_transcript:, on_error: nil, **options)
      super
      @ws = nil
      @connected = false
      @api_key = options[:api_key] || Rails.application.credentials.dig(:deepgram, :api_key) || ENV["DEEPGRAM_API_KEY"]
    end

    def start
      raise "Deepgram API key not configured" unless @api_key

      url = build_url
      headers = { "Authorization" => "Token #{@api_key}" }

      @ws = WebSocket::Client::Simple.connect(url, headers: headers)
      setup_callbacks
    end

    def send_audio(audio_data)
      return unless connected?
      @ws.send(audio_data, type: :binary)
    end

    def stop
      return unless @ws
      @ws.send(JSON.generate({ type: "CloseStream" }), type: :text)
      @ws.close
      @connected = false
    rescue StandardError => e
      Rails.logger.warn("[DeepgramStt] Error during stop: #{e.message}")
    ensure
      @ws = nil
      @connected = false
    end

    def connected?
      @connected && @ws
    end

    private

    def build_url
      params = {
        encoding: options.fetch(:encoding, "linear16"),
        sample_rate: options.fetch(:sample_rate, 16_000),
        channels: options.fetch(:channels, 1),
        model: options.fetch(:model, "nova-2"),
        language: options.fetch(:language, "en"),
        punctuate: options.fetch(:punctuate, true),
        interim_results: options.fetch(:interim_results, true),
        endpointing: options.fetch(:endpointing, 300),
        vad_events: options.fetch(:vad_events, true)
      }
      query = params.map { |k, v| "#{k}=#{v}" }.join("&")
      "#{DEEPGRAM_WS_URL}?#{query}"
    end

    def setup_callbacks
      stt = self

      @ws.on :open do
        stt.instance_variable_set(:@connected, true)
        Rails.logger.info("[DeepgramStt] Connected")
      end

      @ws.on :message do |msg|
        stt.send(:handle_message, msg.data)
      end

      @ws.on :error do |e|
        Rails.logger.error("[DeepgramStt] WebSocket error: #{e.message}")
        stt.on_error&.call(e)
      end

      @ws.on :close do |_e|
        stt.instance_variable_set(:@connected, false)
        Rails.logger.info("[DeepgramStt] Disconnected")
      end
    end

    def handle_message(data)
      parsed = JSON.parse(data)

      case parsed["type"]
      when "Results"
        transcript = parsed.dig("channel", "alternatives", 0, "transcript")
        return if transcript.blank?
        is_final = parsed["is_final"] == true
        on_transcript.call(transcript, is_final: is_final)
      when "SpeechStarted"
        options[:on_speech_start]&.call
      when "UtteranceEnd"
        options[:on_utterance_end]&.call
      when "Error"
        on_error.call(StandardError.new(parsed["description"] || "Deepgram error"))
      end
    rescue JSON::ParserError => e
      Rails.logger.warn("[DeepgramStt] Invalid JSON: #{e.message}")
    end
  end
end
