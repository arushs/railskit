# frozen_string_literal: true

module Voice
  # Pipeline orchestrates the voice interaction loop:
  #   Audio In → STT → Agent (LLM) → TTS → Audio Out
  #
  # Each turn:
  #   1. Receive audio data from client (via AudioChannel)
  #   2. Transcribe to text (STTService)
  #   3. Send text to agent for response (RubyLLM)
  #   4. Synthesize response to audio (TTSService)
  #   5. Stream audio back to client (via AudioChannel)
  #
  # Usage:
  #   pipeline = Voice::Pipeline.new(voice_session)
  #   pipeline.process_audio(audio_data, format: "webm") do |event|
  #     AudioChannel.broadcast_to(session, event)
  #   end
  #
  class Pipeline
    attr_reader :session

    def initialize(voice_session)
      @session = voice_session
    end

    # Process incoming audio through the full pipeline
    def process_audio(audio_data, format: "webm", &broadcast)
      session.transition_to!("processing")

      # Step 1: Transcribe
      broadcast.call({ type: "status", status: "transcribing" })
      transcript = transcribe(audio_data, format: format)

      if transcript.blank?
        broadcast.call({ type: "status", status: "no_speech" })
        session.transition_to!("idle")
        return
      end

      broadcast.call({
        type: "transcript",
        role: "user",
        content: transcript
      })

      # Step 2: Get agent response
      broadcast.call({ type: "status", status: "thinking" })
      chat = session.ensure_chat!
      chat.persist_message(role: "user", content: transcript)

      agent_response = get_agent_response(chat, transcript, &broadcast)

      broadcast.call({
        type: "transcript",
        role: "assistant",
        content: agent_response
      })

      # Step 3: Synthesize speech
      broadcast.call({ type: "status", status: "speaking" })
      session.transition_to!("speaking")

      synthesize_and_stream(agent_response, &broadcast)

      # Done
      session.increment_turn!
      session.transition_to!("idle")
      broadcast.call({ type: "status", status: "idle" })
      broadcast.call({ type: "turn_complete", turn: session.turn_count })

    rescue STTService::TranscriptionError => e
      handle_error(e, "transcription", &broadcast)
    rescue TTSService::SynthesisError => e
      handle_error(e, "synthesis", &broadcast)
    rescue StandardError => e
      handle_error(e, "pipeline", &broadcast)
    end

    # Process text input directly (skip STT)
    def process_text(text, &broadcast)
      session.transition_to!("processing")

      broadcast.call({
        type: "transcript",
        role: "user",
        content: text
      })

      broadcast.call({ type: "status", status: "thinking" })
      chat = session.ensure_chat!
      chat.persist_message(role: "user", content: text)

      agent_response = get_agent_response(chat, text, &broadcast)

      broadcast.call({
        type: "transcript",
        role: "assistant",
        content: agent_response
      })

      broadcast.call({ type: "status", status: "speaking" })
      session.transition_to!("speaking")

      synthesize_and_stream(agent_response, &broadcast)

      session.increment_turn!
      session.transition_to!("idle")
      broadcast.call({ type: "status", status: "idle" })
      broadcast.call({ type: "turn_complete", turn: session.turn_count })

    rescue StandardError => e
      handle_error(e, "pipeline", &broadcast)
    end

    private

    def transcribe(audio_data, format:)
      STTService.transcribe(
        audio_data,
        format: format,
        provider: session.stt_provider,
        language: session.language
      )
    end

    def get_agent_response(chat, message, &broadcast)
      # Use RubyLLM for the agent response
      llm_chat = chat.to_llm_chat
      full_response = +""

      response = llm_chat.ask(message) do |chunk|
        if chunk.content.present?
          full_response << chunk.content
          broadcast.call({
            type: "chunk",
            content: chunk.content
          })
        end
      end

      # Persist assistant message
      chat.persist_message(
        role: "assistant",
        content: full_response,
        model_id: response.respond_to?(:model_id) ? response.model_id : nil,
        input_tokens: response.respond_to?(:input_tokens) ? response.input_tokens : nil,
        output_tokens: response.respond_to?(:output_tokens) ? response.output_tokens : nil
      )

      full_response
    end

    def synthesize_and_stream(text, &broadcast)
      # Stream audio chunks for low latency
      chunk_index = 0

      Voice::TTSService.stream(
        text,
        provider: session.tts_provider,
        voice: session.tts_voice
      ) do |audio_chunk|
        encoded = Base64.strict_encode64(audio_chunk)
        broadcast.call({
          type: "audio",
          data: encoded,
          format: "mp3",
          index: chunk_index
        })
        chunk_index += 1
      end

      broadcast.call({ type: "audio_end" })
    end

    def handle_error(error, stage, &broadcast)
      Rails.logger.error("[Voice::Pipeline] #{stage} error: #{error.class}: #{error.message}")
      session.transition_to!("error")
      broadcast.call({
        type: "error",
        stage: stage,
        message: "Voice #{stage} failed. Please try again."
      })
    end
  end
end
