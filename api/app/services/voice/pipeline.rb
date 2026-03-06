# frozen_string_literal: true

module Voice
  # Orchestrates the full voice conversation loop:
  #   Client audio → STT → Agent → TTS → Client
  # With interruption handling for natural conversation.
  class Pipeline
    attr_reader :voice_session, :stt_client, :tts_client, :agent

    def initialize(voice_session:, agent:, broadcast_to:)
      @voice_session = voice_session
      @agent = agent
      @broadcast_to = broadcast_to
      @tts_client = nil
      @stt_client = nil
      @current_tts_thread = nil
      @interrupted = false
      @mutex = Mutex.new
    end

    def start
      @tts_client = build_tts_client
      @stt_client = build_stt_client
      @stt_client.start
      broadcast({ type: "pipeline_ready", session_id: voice_session.id })
    end

    def receive_audio(audio_data)
      return unless @stt_client&.connected?
      @stt_client.send_audio(audio_data)
    end

    def handle_vad_event(event)
      case event
      when "speech_start" then handle_speech_start
      when "speech_end" then handle_speech_end
      end
    end

    def stop
      @stt_client&.stop
      @tts_client&.cancel!
      @current_tts_thread&.join(5)
      voice_session.end_session!
      broadcast({ type: "pipeline_stopped", session_id: voice_session.id })
    end

    def interrupt!
      @mutex.synchronize do
        @interrupted = true
        @tts_client&.cancel!
      end
      broadcast({ type: "tts_interrupted", session_id: voice_session.id })
    end

    private

    def build_stt_client
      provider = voice_config[:stt_provider] || :deepgram
      stt_class = case provider.to_sym
                  when :deepgram then Voice::DeepgramStt
                  when :whisper then Voice::WhisperStt
                  else raise "Unknown STT provider: #{provider}"
                  end

      stt_class.new(
        on_transcript: method(:on_transcript),
        on_error: method(:on_stt_error),
        on_speech_start: method(:handle_speech_start),
        on_utterance_end: method(:handle_speech_end),
        **stt_options
      )
    end

    def build_tts_client
      Voice::ElevenlabsTts.new(**tts_options)
    end

    def on_transcript(text, is_final:)
      broadcast({
        type: is_final ? "transcript_final" : "transcript_interim",
        text: text,
        session_id: voice_session.id
      })
      process_final_transcript(text) if is_final && text.present?
    end

    def process_final_transcript(text)
      voice_session.chat.persist_message(role: "user", content: text)

      voice_session.audio_segments.create(
        content: text.encode("UTF-8").bytes.pack("C*"),
        speaker: "user",
        transcript: text
      )

      @mutex.synchronize { @interrupted = false }
      broadcast({ type: "agent_thinking", session_id: voice_session.id })

      @current_tts_thread = Thread.new { generate_response(text) }
    end

    def generate_response(user_text)
      response = @agent.ask(user_text)
      response_text = response.respond_to?(:content) ? response.content : response.to_s
      return if @interrupted

      voice_session.chat.persist_message(
        role: "assistant",
        content: response_text,
        model_id: response.respond_to?(:model_id) ? response.model_id : nil,
        input_tokens: response.respond_to?(:input_tokens) ? response.input_tokens : nil,
        output_tokens: response.respond_to?(:output_tokens) ? response.output_tokens : nil
      )

      broadcast({ type: "agent_response", text: response_text, session_id: voice_session.id })
      return if @interrupted

      synthesize_and_stream(response_text)
    rescue StandardError => e
      Rails.logger.error("[VoicePipeline] Error: #{e.message}")
      broadcast({ type: "pipeline_error", error: "Failed to generate response", session_id: voice_session.id })
    end

    def synthesize_and_stream(text)
      voice_preset = voice_session.voice_preset || VoicePreset.defaults.first || VoicePreset.first
      return unless voice_preset

      broadcast({ type: "tts_start", session_id: voice_session.id })

      audio_buffer = +""
      @tts_client.synthesize(text, voice_preset: voice_preset) do |chunk|
        break if @interrupted
        audio_buffer << chunk
        broadcast({
          type: "audio_chunk",
          audio: Base64.strict_encode64(chunk),
          format: voice_session.audio_format,
          session_id: voice_session.id
        })
      end

      unless @interrupted
        voice_session.audio_segments.create(
          content: audio_buffer,
          speaker: "agent",
          transcript: text,
          duration: (audio_buffer.bytesize.to_f / (128 * 1024 / 8)).round(2)
        )
        broadcast({ type: "tts_end", session_id: voice_session.id })
      end
    end

    def handle_speech_start
      interrupt! if @current_tts_thread&.alive?
    end

    def handle_speech_end; end

    def on_stt_error(error)
      Rails.logger.error("[VoicePipeline] STT error: #{error.message}")
      broadcast({ type: "stt_error", error: error.message, session_id: voice_session.id })
    end

    def broadcast(data)
      @broadcast_to.call(data)
    end

    def voice_config
      @voice_config ||= begin
        cfg = Rails.application.config.voice
        cfg.respond_to?(:to_h) ? cfg.to_h : {}
      rescue
        {}
      end
    end

    def stt_options
      { language: voice_config[:language] || "en", model: voice_config[:stt_model] || "nova-2", punctuate: voice_config.fetch(:punctuate, true) }
    end

    def tts_options
      { output_format: voice_config[:tts_output_format] || "mp3_44100_128" }
    end
  end
end
